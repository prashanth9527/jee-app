import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const enableAnalyzer = process.env.ANALYZE === "true";

const nextConfig: NextConfig = withBundleAnalyzer({
  enabled: enableAnalyzer,
})({
  // Use standalone output for smaller server artifacts (good for Docker / Vercel)
  output: "standalone",

  // Experimental imports optimizer — keep only if your Next version supports it.
  // If you see no effect or errors, remove this block.
  experimental: {
    // Note: this option changed across Next releases. If you get a build error,
    // remove/disable this and use selective imports or babel plugin (see suggestions).
    optimizePackageImports: ["lucide-react", "chart.js", "react-chartjs-2"],
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      // Consider targeting actual CDN hostnames for YouTube thumbnails:
      // hostname: "i.ytimg.com" or "img.youtube.com"
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "devrankora.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "rankora.s3.eu-north-1.amazonaws.com",
        pathname: "/**",
      },
    ],
  },

  // Webpack tweaks
  webpack: (config, { isServer, webpack }) => {
    // Provide fallbacks for Node built-ins only for client builds (if needed),
    // so bundlers don't accidentally inject heavy polyfills into the client bundle.
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        // mark Node-only modules as false to avoid polyfills
        fs: false,
        net: false,
        tls: false,
        // keep others only if you actually import them on the client:
        // crypto: false,
        // stream: false,
        // url: false,
      };
    }

    // If you need to add defines, avoid overriding `typeof` checks.
    // Only add feature flags or runtime constants:
    config.plugins.push(
      new webpack.DefinePlugin({
        // Example: __BUILD_TIME__ can be used in client code for diagnostics
        // __BUILD_TIME__: JSON.stringify(new Date().toISOString())
      })
    );

    return config;
  },

  // Keep TypeScript/ESLint strict for CI. Change to true only if you want to skip checks:
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
});
export default nextConfig;
