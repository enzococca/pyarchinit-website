/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  experimental: { missingSuspenseWithCSRBailout: false },
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: "flyover.adarteinfo.it" },
      { protocol: "https", hostname: "pyarchinit.org" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/images/**" },
    ],
  },
};

module.exports = nextConfig;
