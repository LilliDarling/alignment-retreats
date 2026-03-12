"use client";

import { useEffect, useState, useCallback } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Warn on browser-level navigation (tab close, refresh, address bar)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Call instead of router.push() or a Link click when isDirty may be true
  const guardedNavigate = useCallback(
    (navigate: () => void) => {
      if (isDirty) {
        setShowModal(true);
        setPendingNavigation(() => navigate);
      } else {
        navigate();
      }
    },
    [isDirty]
  );

  const confirmLeave = useCallback(() => {
    setShowModal(false);
    const nav = pendingNavigation;
    setPendingNavigation(null);
    nav?.();
  }, [pendingNavigation]);

  const cancelLeave = useCallback(() => {
    setShowModal(false);
    setPendingNavigation(null);
  }, []);

  return { showModal, guardedNavigate, confirmLeave, cancelLeave };
}
