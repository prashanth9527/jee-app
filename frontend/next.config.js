/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for server builds
  experimental: {
    optimizePackageImports: ['lucide-react', 'chart.js', 'react-chartjs-2'],
  },

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'devrankora.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rankora.s3.eu-north-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },

  // Webpack optimizations
  webpack: (config, { isServer, webpack }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };
    }

    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof window': JSON.stringify(isServer ? 'undefined' : 'object'),
        'typeof self': JSON.stringify(isServer ? 'undefined' : 'object'),
      })
    );

    return config;
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
