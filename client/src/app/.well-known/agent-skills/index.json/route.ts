export async function GET() {
  return new Response(
    JSON.stringify({
      $schema: "https://agentskills.io/schemas/v0.2.0/index.json",
      skills: [
        {
          name: "code-battle-arena",
          type: "competitive-programming",
          description: "Compete in live 1v1 and 4v4 coding battles across DSA, Frontend, Backend, and AI Prompt Wars",
          url: "https://codecomplex.site/battle",
          digest: "sha256:7c9e01f6874a9b4009a25b13861c8a1492b451000b18274384918e9a273b0001",
        },
        {
          name: "elo-leaderboard",
          type: "analytics",
          description: "Query global and regional Elo ratings, divisions, and player performance metrics",
          url: "https://codecomplex.site/leaderboard",
          digest: "sha256:8d1e02f9874b9b4009a25b13861c8a1492b451000b18274384918e9a273b0002",
        },
        {
          name: "devbot-rival-simulation",
          type: "ai-simulation",
          description: "Challenge adaptive AI Bot rivals calibrated to player Elo rating and problem difficulty",
          url: "https://codecomplex.site/battle",
          digest: "sha256:9e2f03f0984c9b4009a25b13861c8a1492b451000b18274384918e9a273b0003",
        },
      ],
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
