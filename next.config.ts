import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // தூவானை (Story) was merged into சிறு மயில் (Short Story) — old links still work.
      { source: "/story", destination: "/shortstory", permanent: true },
      { source: "/story/:path*", destination: "/shortstory/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
