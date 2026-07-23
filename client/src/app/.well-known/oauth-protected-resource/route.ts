export async function GET() {
  return new Response(
    JSON.stringify({
      resource: "https://codecomplex.site/api/v1",
      authorization_servers: ["https://codecomplex.site"],
      scopes_supported: ["read", "write", "battle"],
      bearer_methods_supported: ["header", "cookie"],
      agent_auth: {
        register_uri: "https://codecomplex.site/auth.md",
        registration_endpoint: "https://codecomplex.site/auth.md",
        supported_identity_types: ["user", "agent"],
        credential_types: ["bearer_token", "oauth2"],
        revocation_uri: "https://codecomplex.site/api/v1/user/logout",
        revocation_endpoint: "https://codecomplex.site/api/v1/user/logout",
        claims_supported: ["sub", "email", "name", "role", "agent_id"],
      },
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
