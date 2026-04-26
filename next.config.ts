import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Encoding",
            value: "identity",
          },
        ],
      },
    ];
  },
};

export default nextConfig;