/**
 * @type {import('next').NextConfig}
 */
import webpack from 'webpack';

const nextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply these modifications for client-side builds
    if (!isServer) {
      // Resolve node: protocol imports
      config.resolve.alias = {
        ...config.resolve.alias,
        "node:process": "process/browser",
        "node:buffer": "buffer",
        "node:util": "util",
        "node:stream": "stream-browserify",
        "node:path": "path-browserify",
        "node:crypto": "crypto-browserify",
        "node:zlib": "browserify-zlib",
        "node:assert": "assert",
      };

      // Add fallbacks for Node.js core modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        dns: false,
        http2: false,
        process: "process/browser",
        buffer: "buffer",
        stream: "stream-browserify",
        util: "util",
        path: "path-browserify",
        crypto: "crypto-browserify",
        zlib: "browserify-zlib",
        assert: "assert",
      };

      // Add plugins to provide global objects
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
        new webpack.NormalModuleReplacementPlugin(/node:/, (resource) => {
          const mod = resource.request.replace(/^node:/, "");
          switch (mod) {
            case "process":
              resource.request = "process/browser";
              break;
            case "buffer":
              resource.request = "buffer";
              break;
            case "stream":
              resource.request = "stream-browserify";
              break;
            case "path":
              resource.request = "path-browserify";
              break;
            case "crypto":
              resource.request = "crypto-browserify";
              break;
            case "util":
              resource.request = "util";
              break;
            case "zlib":
              resource.request = "browserify-zlib";
              break;
            case "assert":
              resource.request = "assert";
              break;
            default:
              console.warn(`Unknown node: import: ${mod}`);
          }
        })
      );
    }

    return config;
  },
  // Images optimization
  images: {
    domains: ["firebasestorage.googleapis.com"],
    formats: ["image/avif", "image/webp"],
  },  // Add any other Next.js configurations as needed
};

export default nextConfig;
