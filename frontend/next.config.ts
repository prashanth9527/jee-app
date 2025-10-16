import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize for server builds
  experimental: {
    optimizePackageImports: ['lucide-react', 'chart.js', 'react-chartjs-2'],
  },
  
  // Reduce memory usage during build
  // swcMinify is deprecated in Next.js 15+
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'youtube.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'devrankora.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'rankora.s3.eu-north-1.amazonaws.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Webpack optimizations for server builds
  webpack: (config, { isServer, webpack }) => {
    // Fix for "self is not defined" error
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
    
    // Define global variables for client-side code
    config.plugins.push(
      new webpack.DefinePlugin({
        'typeof window': JSON.stringify(isServer ? 'undefined' : 'object'),
        'typeof self': JSON.stringify(isServer ? 'undefined' : 'object'),
      })
    );
    
    return config;
  },
  
  // TypeScript configuration
  typescript: {
    // Don't fail build on TypeScript errors during development
    ignoreBuildErrors: false,
  },
  
  // ESLint configuration
  eslint: {
    // Don't fail build on ESLint warnings
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
