export async function GET() {
  return new Response(
    JSON.stringify({
      $schema: "https://modelcontextprotocol.io/schemas/server-card.json",
      serverInfo: {
        name: "CodeComplex Competitive Arena MCP Server",
        version: "1.0.0",
        description: "Real-time competitive programming, 1v1 duels, and Elo leaderboard API for AI Agents",
      },
      transport: {
        type: "sse",
        endpoint: "https://codecomplex.site/api/v1/mcp",
      },
      capabilities: {
        tools: true,
        prompts: true,
        resources: true,
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
