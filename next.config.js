/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 禁用服务器组件以避免与Ionic的兼容性问题
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  // 配置图像优化
  images: {
    domains: ['localhost'],
    // 图像尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 图像格式配置
    formats: ['image/webp', 'image/avif'],
    // 禁用图像优化（如果需要）
    // unoptimized: true,
  },
  // 配置环境变量
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'HeyTCM',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    NEXT_PUBLIC_API_VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
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
  // 配置API路由
  async rewrites() {
    return {
      beforeFiles: [
        // 移动端API路由
        {
          source: '/api/mobile/:path*',
          destination: '/api/mobile/:path*',
        },
        // Web端API路由
        {
          source: '/api/web/:path*',
          destination: '/api/web/:path*',
        },
      ],
    };
  },
  // 配置Ionic和Capacitor相关的webpack设置
  webpack: (config, { isServer }) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          fs: false,
          path: false,
          dgram: false,
          net: false,
          tls: false,
          child_process: false,
          dns: false,
          pg: false,
          'pg-native': false,
          'pg-hstore': false
        },
        alias: {
          ...config.resolve.alias,
          '@': require('path').resolve(__dirname, 'src'),
          '@app': require('path').resolve(__dirname, 'app'),
          '@core': require('path').resolve(__dirname, 'src/core'),
          '@mobile': require('path').resolve(__dirname, 'src/mobile'),
          '@web': require('path').resolve(__dirname, 'src/web'),
          '@db': require('path').resolve(__dirname, 'src/core/lib/db'),
          '@db/types': require('path').resolve(__dirname, 'src/core/lib/db/types'),
          '@db/interfaces': require('path').resolve(__dirname, 'src/core/lib/db/interfaces'),
          '@db/test': require('path').resolve(__dirname, 'src/core/lib/db/test')
        },
      },
      // 在浏览器环境中排除Node.js模块
      externals: [
        ...(config.externals || []),
        ...(isServer ? [] : ['pg', 'pg-native', 'pg-hstore'])
      ]
    };
  },
};

module.exports = nextConfig;
