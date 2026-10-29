import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Fixa a raiz do Turbopack neste projeto (evita subir até C:\Users por um
  // package-lock.json solto fora do repositório).
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: "/produto", destination: "/catalogo", permanent: false },
      { source: "/produto/:slug", destination: "/catalogo", permanent: false },
    ];
  },
};

export default nextConfig;
