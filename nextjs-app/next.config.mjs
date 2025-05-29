/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/compass",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
