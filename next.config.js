/** @type {import('next').NextConfig} */
const runtimeCaching = [
  {
    urlPattern: /^https:\/\/(i\.ytimg\.com|img\.youtube\.com|yt3\.ggpht\.com)\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "yt-thumbnails",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\/_next\/static\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "next-static",
      expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "supabase-api",
      networkTimeoutSeconds: 10,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /.*/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "others",
      networkTimeoutSeconds: 10,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
    },
  },
];

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
});

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "yt3.ggpht.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // `resend` is an optional, runtime-only dependency (invitation emails).
      // Mark it external so webpack doesn't try to bundle/resolve it.
      config.externals = config.externals || [];
      config.externals.push("resend");
    }
    return config;
  },
};

module.exports = withPWA(nextConfig);
