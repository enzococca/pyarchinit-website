/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
    ],
  },
};

module.exports = nextConfig;
