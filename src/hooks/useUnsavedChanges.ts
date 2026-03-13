"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export function useUnsavedChanges(isDirty: boolean) {
  const [showModal, setShowModal] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

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
        pendingNavRef.current = navigate;
      } else {
        navigate();
      }
    },
    [isDirty]
  );

  const confirmLeave = useCallback(() => {
    setShowModal(false);
    const nav = pendingNavRef.current;
    pendingNavRef.current = null;
    nav?.();
  }, []);

  const cancelLeave = useCallback(() => {
    setShowModal(false);
    pendingNavRef.current = null;
  }, []);

  return { showModal, guardedNavigate, confirmLeave, cancelLeave };
}
