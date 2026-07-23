export async function GET() {
  return new Response(
    JSON.stringify({
      resource: "https://codecomplex.site/api/v1",
      authorization_servers: ["https://codecomplex.site"],
      scopes_supported: ["read", "write", "battle"],
      bearer_methods_supported: ["header", "cookie"],
    }),
    {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
