/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  allowedDevOrigins: ["*.trycloudflare.com"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.b-cdn.net" },
      { protocol: "https", hostname: "flyover.adarteinfo.it" },
      { protocol: "https", hostname: "www.adarteinfo.it" },
      { protocol: "https", hostname: "pyarchinit.org" },
    ],
    localPatterns: [
      { pathname: "/uploads/**" },
      { pathname: "/images/**" },
    ],
  },
};

module.exports = nextConfig;
