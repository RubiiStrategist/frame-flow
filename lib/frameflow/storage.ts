"use client";

/**
 * Flag persistida em Web Storage lida corretamente com SSR/hydration via
 * useSyncExternalStore (o padrão recomendado do React para estado externo).
 * Usada pelo colapso da sidebar (localStorage) e pelo modo de
 * pré-visualização (sessionStorage).
 */

import { useCallback, useSyncExternalStore } from "react";

const EVENTO = "frameflow:store";

function subscribe(callback: () => void) {
  window.addEventListener(EVENTO, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENTO, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useStorageFlag(
  storage: "local" | "session",
  key: string
): [boolean, (valor: boolean) => void] {
  // O acesso a `window` fica dentro dos callbacks — o useSyncExternalStore
  // só executa getSnapshot no cliente; no SSR usa getServerSnapshot.
  const ler = useCallback(
    () => (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key) === "1",
    [storage, key]
  );

  const valor = useSyncExternalStore(subscribe, ler, () => false);

  const escrever = useCallback(
    (v: boolean) => {
      const s = storage === "local" ? window.localStorage : window.sessionStorage;
      if (v) s.setItem(key, "1");
      else s.removeItem(key);
      window.dispatchEvent(new Event(EVENTO));
    },
    [storage, key]
  );

  return [valor, escrever];
}
