import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Validação de tipos ATIVA no build — erros de TypeScript quebram o build
  // (sem ignoreBuildErrors; a fundação deve compilar limpa ou falhar alto).
  reactStrictMode: false,
};

export default nextConfig;
