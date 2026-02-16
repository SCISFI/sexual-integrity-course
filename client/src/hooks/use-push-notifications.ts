import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  const { data: statusData, isLoading: loadingStatus } = useQuery<{
    subscribed: boolean;
    preferences: {
      checkinReminderEnabled: boolean;
      checkinReminderTime: string;
      feedbackNotificationsEnabled: boolean;
      weeklyProgressEnabled: boolean;
    };
  }>({
    queryKey: ["/api/push/status"],
    enabled: isSupported,
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const permResult = await Notification.requestPermission();
      setPermission(permResult);
      if (permResult !== "granted") {
        throw new Error("Notification permission denied");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const vapidRes = await fetch("/api/vapid-public-key");
      const { publicKey } = await vapidRes.json();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      await apiRequest("POST", "/api/push/subscribe", {
        endpoint: subJson.endpoint,
        keys: subJson.keys,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push/status"] });
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await apiRequest("POST", "/api/push/unsubscribe", {
            endpoint: subscription.endpoint,
          });
          await subscription.unsubscribe();
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push/status"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: Partial<{
      checkinReminderEnabled: boolean;
      checkinReminderTime: string;
      feedbackNotificationsEnabled: boolean;
      weeklyProgressEnabled: boolean;
    }>) => {
      await apiRequest("PUT", "/api/push/preferences", prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push/status"] });
    },
  });

  const subscribe = useCallback(() => subscribeMutation.mutate(), [subscribeMutation]);
  const unsubscribe = useCallback(() => unsubscribeMutation.mutate(), [unsubscribeMutation]);

  return {
    isSupported,
    permission,
    isSubscribed: statusData?.subscribed ?? false,
    preferences: statusData?.preferences,
    loadingStatus,
    subscribe,
    unsubscribe,
    updatePreferences: updatePreferencesMutation.mutate,
    isSubscribing: subscribeMutation.isPending,
    isUnsubscribing: unsubscribeMutation.isPending,
    subscribeError: subscribeMutation.error,
  };
}
