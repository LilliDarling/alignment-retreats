import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ""} https://js.stripe.com https://static.cloudflareinsights.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://static.wixstatic.com https://*.r2.dev https://*.supabase.co",
  "font-src 'self' https://fonts.gstatic.com",
  "media-src 'self' https://*.r2.dev https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://cdn.jsdelivr.net https://cloudflareinsights.com",
  "frame-src https://js.stripe.com",
]
  .join("; ")
  .replace(/\s+/g, " ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "static.wixstatic.com",
      },
      {
        protocol: "https",
        hostname: "pub-fb209cd67e9a4a668e7d182d022f613a.r2.dev",
      },
      {
        protocol: "https",
        hostname: "zuonunnxuwdthkmvqfhg.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
