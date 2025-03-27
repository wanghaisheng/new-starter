/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // 禁用服务器组件以避免与Ionic的兼容性问题
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 配置Ionic和Capacitor相关的webpack设置
  webpack: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
        },
      },
    };
  },
};

module.exports = nextConfig;
