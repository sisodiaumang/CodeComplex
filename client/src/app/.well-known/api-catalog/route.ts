export async function GET() {
  return new Response(
    JSON.stringify({
      linkset: [
        {
          anchor: "https://codecomplex.site/api/v1",
          "service-desc": [
            {
              href: "https://codecomplex.site/api/v1/openapi.json",
              type: "application/json",
            },
          ],
          "service-doc": [
            {
              href: "https://codecomplex.site/about",
              type: "text/html",
            },
          ],
          status: [
            {
              href: "https://codecomplex.site/api/v1/health",
              type: "application/json",
            },
          ],
        },
      ],
    }),
    {
      headers: {
        "Content-Type": "application/linkset+json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
