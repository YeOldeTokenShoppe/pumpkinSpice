/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    // Resolve fallbacks for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    
    // Add alias for Three.js BufferGeometryUtils compatibility
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/examples/jsm/utils/BufferGeometryUtils.js': new URL('./patches/BufferGeometryUtils.js', import.meta.url).pathname,
    };
    
    return config;
  },
  async headers() {
    return [
      {
        source: '/:path*.wasm',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/wasm',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
