import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/uploads/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'none'; sandbox" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/", destination: "/portal" },
      { source: "/meetings", destination: "/portal/meetings" },
      { source: "/meetings/book", destination: "/portal/meetings/book" },
      { source: "/programs", destination: "/portal/programs" },
      { source: "/programs/:path*", destination: "/portal/programs/:path*" },
      { source: "/documents", destination: "/portal/documents" },
      { source: "/documents/:path*", destination: "/portal/documents/:path*" },
      { source: "/timetables", destination: "/portal/timetables" },
      { source: "/timetables/:path*", destination: "/portal/timetables/:path*" },
    ];
  },
};

export default nextConfig;
