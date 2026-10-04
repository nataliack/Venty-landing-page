import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hero frames are requested with ?v=<manifest version>, so a new encode
  // gets new URLs and browsers can keep the old ones forever.
  async headers() {
    return [
      {
        source: "/hero/sequence/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
