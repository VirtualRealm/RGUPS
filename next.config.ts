import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: process.env.PORTAL_STATIC_EXPORT === "1" ? "export" : "standalone",
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  turbopack: { root: process.env.PORTAL_BUILD_ROOT || process.cwd() },
  ...(process.env.PORTAL_STATIC_EXPORT === "1"
    ? {}
    : {
        async headers() {
          return [
            {
              source: "/:path*",
              headers: [
                { key: "X-Content-Type-Options", value: "nosniff" },
                { key: "X-Frame-Options", value: "DENY" },
                { key: "Referrer-Policy", value: "no-referrer" },
                {
                  key: "Content-Security-Policy",
                  value:
                    "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
                },
              ],
            },
          ];
        },
      }),
};
export default nextConfig;
