import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/story", destination: "/shortstory", permanent: true },
      { source: "/story/:path*", destination: "/shortstory/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
