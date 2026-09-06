"use client";
import { useSyncExternalStore } from "react";
import { MOBILE_QUERY } from "@/lib/graph/mobile";
function subscribe(callback: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}
export function useMobileGraph() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
