/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.microlink.io' },
      { protocol: 'https', hostname: 'cdn.microlink.io' },
      { protocol: 'https', hostname: '**' }, // allow any https image source for inspiration/products
    ],
  },
};

module.exports = nextConfig;
