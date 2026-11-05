import type { NextConfig } from "next";

const jsonContentType = [
  {
    key: "Content-Type",
    value: "application/json",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        headers: jsonContentType,
      },
      {
        source: "/.well-known/assetlinks.json",
        headers: jsonContentType,
      },
    ];
  },
};

export default nextConfig;
