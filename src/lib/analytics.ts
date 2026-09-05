"use client";

import { sendGAEvent } from "@next/third-parties/google";

/**
 * Tracks a custom event in Google Analytics (GA4).
 *
 * @param action - Event name (e.g. 'recording_submitted', 'language_changed')
 * @param params - Optional parameters associated with the event
 */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !process.env.NEXT_PUBLIC_GA_ID) {
    return;
  }

  try {
    sendGAEvent("event", action, params ?? {});
  } catch (error) {
    console.error("Failed to send GA event:", error);
  }
}
