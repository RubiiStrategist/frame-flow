import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Limpeza automática do DOM entre testes de componente.
afterEach(() => {
  cleanup();
});
