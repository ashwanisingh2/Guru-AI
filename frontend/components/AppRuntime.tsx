"use client";

import { useEffect, useState } from "react";
import { flushOfflineQueue, trackEvent } from "@/lib/api";

export function AppRuntime() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    navigator.serviceWorker?.register("/sw.js").catch(() => undefined);

    const onOnline = () => {
      setOnline(true);
      flushOfflineQueue();
      trackEvent("app_online", "runtime");
    };
    const onOffline = () => {
      setOnline(false);
      trackEvent("app_offline", "runtime");
    };
    const onError = (event: ErrorEvent) => {
      trackEvent("frontend_error", "crash", { message: event.message });
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("error", onError);
    flushOfflineQueue();
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("error", onError);
    };
  }, []);

  if (online) return null;
  return <div className="fixed bottom-4 left-4 z-50 rounded border border-[#f59e0b] bg-[#451a03] px-4 py-2 text-sm text-[#fbbf24]">Offline mode: progress will sync later.</div>;
}
