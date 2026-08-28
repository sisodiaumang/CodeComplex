import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// `immutable, max-age=1y` is right for the content-hashed production build, but
// in dev the same paths serve chunks that change on every edit. Telling the
// browser never to revalidate them means it keeps serving a pre-edit chunk
// after a hot reload, which surfaces as a React hydration mismatch where the
// server HTML and the client tree come from two different versions of a file.
// Next warns about this itself ("Custom Cache-Control headers detected for
// /_next/static/:path* ... can break Next.js development behavior"), so these
// are applied in production only and dev keeps Next's own no-store defaults.
const immutable = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
  { key: "Access-Control-Allow-Origin", value: "*" },
];

const staticPageHeader = [
  {
    key: "Cache-Control",
    value: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false, // Let Nginx handle gzip compression at the reverse proxy layer
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value:
              '</.well-known/api-catalog>; rel="api-catalog", </.well-known/agent-skills/index.json>; rel="agent-skills", </.well-known/mcp/server-card.json>; rel="mcp-server-card", </auth.md>; rel="service-doc"',
          },
        ],
      },
      ...(isProd
        ? [
            { source: "/_next/static/:path*", headers: immutable },
            { source: "/logo.webp", headers: immutable },
            { source: "/", headers: staticPageHeader },
            { source: "/about", headers: staticPageHeader },
            { source: "/faq", headers: staticPageHeader },
            { source: "/guidelines", headers: staticPageHeader },
            { source: "/privacy", headers: staticPageHeader },
            { source: "/terms", headers: staticPageHeader },
            { source: "/contact", headers: staticPageHeader },
          ]
        : []),
    ];
  },
};

export default nextConfig;
