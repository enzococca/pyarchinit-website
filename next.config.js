/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/images/**" },
    ],
  },
};

module.exports = nextConfig;
