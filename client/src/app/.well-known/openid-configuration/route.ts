export async function GET() {
  return new Response(
    JSON.stringify({
      issuer: "https://codecomplex.site",
      authorization_endpoint: "https://codecomplex.site/api/v1/auth/google",
      token_endpoint: "https://codecomplex.site/api/v1/user/login",
      userinfo_endpoint: "https://codecomplex.site/api/v1/user/me",
      response_types_supported: ["code", "token"],
      grant_types_supported: ["authorization_code", "password", "refresh_token"],
      scopes_supported: ["openid", "profile", "email", "battle", "read", "write"],
      token_endpoint_auth_methods_supported: ["client_secret_post", "bearer"],
      agent_auth: {
        register_uri: "https://codecomplex.site/auth.md",
        supported_identity_types: ["user", "agent"],
        credential_types: ["bearer_token", "oauth2"],
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
