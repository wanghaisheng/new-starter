/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 禁用服务器组件以避免与Ionic的兼容性问题
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 配置路由重定向
  async redirects() {
    return [
      {
        source: '/mobile',
        destination: '/mobile/home',
        permanent: true,
      },
    ];
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
        alias: {
          ...config.resolve.alias,
          '@': require('path').resolve(__dirname, 'src'),
          '@core': require('path').resolve(__dirname, 'src/core'),
          '@mobile': require('path').resolve(__dirname, 'src/mobile'),
          '@web': require('path').resolve(__dirname, 'src/web'),
          '@db': require('path').resolve(__dirname, 'src/core/lib/db'),
          '@db/types': require('path').resolve(__dirname, 'src/core/lib/db/types'),
          '@db/interfaces': require('path').resolve(__dirname, 'src/core/lib/db/interfaces'),
          '@db/test': require('path').resolve(__dirname, 'src/core/lib/db/test')
        },
      },
    };
  },
};

module.exports = nextConfig;
