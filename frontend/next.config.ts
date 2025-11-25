import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default nextConfig;

declare global {
  var __NEXT_DATA__: any;
}


