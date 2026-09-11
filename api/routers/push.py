import json
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from config import DB_CONFIG, logger, VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT
from routers.auth import get_current_user_id

router = APIRouter(
    prefix="/api/push",
    tags=["Push Notifications"]
)

# --- HELPER: fetch actor display info ---

def get_user_display_info(user_id: str) -> dict:
    """
    Returns {"display_name": str, "icon_url": str | None} for a given user_id.
    Falls back to first_name if display_name is not set.
    Re-uses an existing connection if passed, or opens its own.
    """
    conn = cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT first_name, display_name, profile_pic_url FROM users WHERE id = %s",
            (user_id,)
        )
        row = cur.fetchone()
        if not row:
            return {"display_name": "Someone", "icon_url": None}
        name = row["display_name"] or row["first_name"] or "Someone"
        return {"display_name": name, "icon_url": row["profile_pic_url"]}
    except psycopg2.Error as e:
        logger.error(f"DB error fetching user display info: {e}")
        return {"display_name": "Someone", "icon_url": None}
    finally:
        if cur:  cur.close()
        if conn: conn.close()


# --- SCHEMAS ---

class PushSubscription(BaseModel):
    endpoint: str
    keys: dict  # { "p256dh": "...", "auth": "..." }

class UnsubscribeRequest(BaseModel):
    endpoint: str

# --- VAPID PUBLIC KEY ---

@router.get("/vapid-public-key")
def get_vapid_public_key():
    """Return the VAPID public key so the frontend can call PushManager.subscribe()."""
    return {"public_key": VAPID_PUBLIC_KEY}

# --- SUBSCRIBE ---

@router.post("/subscribe", status_code=201)
def subscribe(sub: PushSubscription, user_id: str = Depends(get_current_user_id)):
    """Save (or update) a push subscription for the current user."""
    p256dh = sub.keys.get("p256dh")
    auth   = sub.keys.get("auth")

    if not p256dh or not auth:
        raise HTTPException(status_code=400, detail="Missing p256dh or auth key")

    conn = cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()
        # Upsert: if the endpoint already exists (same device), update keys.
        cur.execute("""
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (endpoint)
            DO UPDATE SET user_id = EXCLUDED.user_id,
                          p256dh  = EXCLUDED.p256dh,
                          auth    = EXCLUDED.auth,
                          created_at = CURRENT_TIMESTAMP;
        """, (user_id, sub.endpoint, p256dh, auth))
        conn.commit()
        logger.info(f"Push subscription saved for user {user_id}")
        return {"status": "subscribed"}
    except psycopg2.Error as e:
        if conn: conn.rollback()
        logger.error(f"DB error saving push subscription: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if cur:  cur.close()
        if conn: conn.close()

# --- UNSUBSCRIBE ---

@router.delete("/unsubscribe")
def unsubscribe(req: UnsubscribeRequest, user_id: str = Depends(get_current_user_id)):
    """Remove a push subscription by endpoint (e.g. when the user toggles off)."""
    conn = cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()
        cur.execute(
            "DELETE FROM push_subscriptions WHERE endpoint = %s AND user_id = %s",
            (req.endpoint, user_id)
        )
        conn.commit()
        return {"status": "unsubscribed"}
    except psycopg2.Error as e:
        if conn: conn.rollback()
        logger.error(f"DB error removing push subscription: {e}")
        raise HTTPException(status_code=500, detail="Database error")
    finally:
        if cur:  cur.close()
        if conn: conn.close()

# --- SEND HELPER (called from other routers) ---

def send_push_to_user(user_id: str, title: str, body: str, url: str = "/", icon: Optional[str] = None) -> None:
    """
    Fire-and-forget: sends a push notification to every subscription registered
    for the given user_id.  Silently removes expired/gone subscriptions (410).
    Import and call this from any other router when something noteworthy happens.
    icon: optional URL (relative or absolute) shown as the notification image.
    """
    if not VAPID_PRIVATE_KEY or not VAPID_PUBLIC_KEY:
        logger.warning("VAPID keys not configured — skipping push notification")
        return

    conn = cur = None
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = %s",
            (user_id,)
        )
        subscriptions = cur.fetchall()
    except psycopg2.Error as e:
        logger.error(f"DB error fetching subscriptions for push: {e}")
        return
    finally:
        if cur:  cur.close()
        if conn: conn.close()

    if not subscriptions:
        return

    from pywebpush import webpush, WebPushException

    payload_data: dict = {"title": title, "body": body, "url": url}
    if icon:
        payload_data["icon"] = icon
    payload = json.dumps(payload_data)

    stale_endpoints = []

    for sub in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": sub["endpoint"],
                    "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
                },
                data=payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": VAPID_SUBJECT},
            )
            logger.info(f"Push sent to user {user_id} → {sub['endpoint'][:60]}…")
        except WebPushException as e:
            if e.response is not None and e.response.status_code in (404, 410):
                # Subscription is gone — queue for cleanup
                stale_endpoints.append(sub["endpoint"])
            else:
                logger.error(f"WebPushException for user {user_id}: {e}")

    # Clean up stale subscriptions
    if stale_endpoints:
        conn = cur = None
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            cur  = conn.cursor()
            cur.execute(
                "DELETE FROM push_subscriptions WHERE endpoint = ANY(%s)",
                (stale_endpoints,)
            )
            conn.commit()
            logger.info(f"Removed {len(stale_endpoints)} stale subscription(s) for user {user_id}")
        except psycopg2.Error as e:
            logger.error(f"DB error cleaning stale subscriptions: {e}")
            if conn: conn.rollback()
        finally:
            if cur:  cur.close()
            if conn: conn.close()
