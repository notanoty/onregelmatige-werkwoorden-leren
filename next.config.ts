import type { NextConfig } from "next";

const UMAMI_ORIGIN = "http://146.190.229.9:3005";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/stats/script.js", destination: `${UMAMI_ORIGIN}/script.js` },
      { source: "/stats/api/send", destination: `${UMAMI_ORIGIN}/api/send` },
    ];
  },
};

export default nextConfig;
