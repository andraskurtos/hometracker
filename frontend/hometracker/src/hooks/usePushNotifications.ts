/**
 * usePushNotifications.ts
 *
 * React hook that wraps pushService for easy use in components.
 * Exposes:
 *  - isSupported  — whether the browser can do push at all
 *  - isSubscribed — whether this device is currently subscribed
 *  - subscribe    — request permission and register
 *  - unsubscribe  — revoke and clean up
 *  - isLoading    — async operation in progress
 *  - error        — last error message (if any)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  getCurrentSubscription,
} from '@/services/pushService';
import { storageService } from '@/services/storageService';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported] = useState<boolean>(isPushSupported);
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check current subscription state on mount
  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }
    getCurrentSubscription().then((sub) => {
      setIsSubscribed(!!sub);
      setIsLoading(false);
    });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const token = storageService.getToken();
      if (!token) throw new Error('Not authenticated');
      await subscribeToPush(token);
      setIsSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enable notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const token = storageService.getToken();
      if (!token) throw new Error('Not authenticated');
      await unsubscribeFromPush(token);
      setIsSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disable notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSupported, isSubscribed, isLoading, error, subscribe, unsubscribe };
}
