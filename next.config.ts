import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Docker: çok aşamalı imajda yalnızca gerekli dosyaları kopyalamak için */
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1"],
} as any;

export default nextConfig;
