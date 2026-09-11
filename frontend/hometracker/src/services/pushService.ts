/**
 * pushService.ts
 *
 * Low-level Web Push helpers. Handles:
 *  - Feature detection
 *  - PushManager subscription / unsubscription
 *  - Syncing the subscription with the backend
 */

import { API_BASE_URL } from '@/config/api';

// --------------------------------------------------------------------------
// Feature detection
// --------------------------------------------------------------------------

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

// --------------------------------------------------------------------------
// VAPID public key
// --------------------------------------------------------------------------

async function fetchVapidPublicKey(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
  if (!res.ok) throw new Error('Failed to fetch VAPID public key');
  const { public_key } = await res.json();
  return public_key;
}

/** base64url → Uint8Array (needed by PushManager.subscribe) */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// --------------------------------------------------------------------------
// Subscribe
// --------------------------------------------------------------------------

export async function subscribeToPush(token: string): Promise<PushSubscription> {
  if (!isPushSupported()) throw new Error('Push notifications are not supported');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission denied');

  const registration = await navigator.serviceWorker.ready;
  const vapidKey = await fetchVapidPublicKey();

  const applicationServerKey = urlBase64ToUint8Array(vapidKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  });

  // Sync to backend
  const subJson = subscription.toJSON();
  const res = await fetch(`${API_BASE_URL}/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subJson.endpoint,
      keys: subJson.keys,
    }),
  });

  if (!res.ok) throw new Error('Failed to save push subscription on server');

  return subscription;
}

// --------------------------------------------------------------------------
// Unsubscribe
// --------------------------------------------------------------------------

export async function unsubscribeFromPush(token: string): Promise<void> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) return; // already gone

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();

  // Inform backend
  await fetch(`${API_BASE_URL}/push/unsubscribe`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
}

// --------------------------------------------------------------------------
// Current state
// --------------------------------------------------------------------------

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}
