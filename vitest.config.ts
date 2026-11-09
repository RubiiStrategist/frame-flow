import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const raiz = fileURLToPath(new URL("./", import.meta.url));

/**
 * FRAME FLOW — configuração do Vitest (Etapa 1.1).
 * - Ambiente jsdom (testes de componente e roteamento por hash).
 * - Alias @ → src (mesma resolução do Next).
 * - `tests/integration/**` só executa com banco Supabase de TESTE configurado
 *   (as suítes pulam sozinhas sem as variáveis — ver rls-supabase.test.ts).
 */
export default defineConfig({
  // DOM tests import component CSS without running Next's Tailwind pipeline.
  css: { postcss: { plugins: [] } },
  resolve: {
    alias: {
      "@": `${raiz}src`,
    },
  },
  test: {
    environment: "jsdom",
    globals: false,
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/setup.ts"],
  },
});
