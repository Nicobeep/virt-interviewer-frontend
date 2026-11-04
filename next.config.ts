/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/apps/:path*',
        destination: 'http://localhost:8000/apps/:path*',
      },
      {
        source: '/run',
        destination: 'http://localhost:8000/run',
      },
    ];
  },
};

export default nextConfig;