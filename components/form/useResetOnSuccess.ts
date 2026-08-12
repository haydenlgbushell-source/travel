"use client";

import { useEffect, useRef } from "react";
import type { ActionState } from "@/lib/validation";

/**
 * Clears an "add" form once its action succeeds, so the next entry starts
 * blank. `state` gets a fresh object identity on every action result, so this
 * fires per submission rather than only on the first success.
 */
export function useResetOnSuccess(state: ActionState, enabled = true) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (enabled && state.ok) formRef.current?.reset();
  }, [state, enabled]);

  return formRef;
}
