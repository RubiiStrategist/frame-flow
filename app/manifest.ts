import type { MetadataRoute } from "next";

/**
 * Manifest PWA da FRAME FLOW.
 * Escopo/idioma/moeda: pt-BR · BRL · America/Sao_Paulo (formato aplicado na camada lib/format).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FRAME FLOW — Gestão Integrada FRAME VISION",
    short_name: "FRAME FLOW",
    description:
      "Sistema operacional digital da FRAME VISION: clientes, vendas, produção, projetos, finanças e decisões em um único ecossistema.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "pt-BR",
    dir: "ltr",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    categories: ["business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
