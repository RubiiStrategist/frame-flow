"use client";

/**
 * Registro do Service Worker da FRAME FLOW.
 * Falha silenciosamente em ambientes sem suporte (SSR, devtools fechado).
 */

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("serviceWorker" in navigator) ||
      process.env.NODE_ENV !== "production"
    ) {
      return;
    }
    const registrar = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          /* registro é best-effort; o app funciona também sem SW */
        });
    };
    if (document.readyState === "complete") registrar();
    else window.addEventListener("load", registrar, { once: true });
  }, []);

  return null;
}
