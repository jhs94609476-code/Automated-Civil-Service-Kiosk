/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ads-partners.coupang.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
