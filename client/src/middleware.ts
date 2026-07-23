import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get("accept") || "";

  if (acceptHeader.includes("text/markdown")) {
    const markdownContent = `# CodeComplex — Real-time Competitive Engineering Arena

Welcome to CodeComplex! CodeComplex is the ultimate real-time competitive programming platform for software engineers.

## Key Features
- **1v1 & 4v4 Team Duels:** Squad up or battle head-to-head in real-time coding matches.
- **6 Battle Arenas:** DSA & Algorithms, Frontend (React/HTML), Backend (Node/Express), Bug Fix, Full-Stack Projects, and AI Prompt Wars.
- **Adaptive AI Bot Rivals (DevBot V1):** Dynamic AI opponents that calibrate solve speed and testcase pass rates to your Elo rank.
- **Competitive Elo System:** Climb divisions from Bronze to Master with global & regional leaderboards.

## Discovery & API Endpoints
- **API Catalog:** https://codecomplex.site/.well-known/api-catalog
- **Agent Skills:** https://codecomplex.site/.well-known/agent-skills/index.json
- **MCP Server Card:** https://codecomplex.site/.well-known/mcp/server-card.json
- **Auth & Agent Docs:** https://codecomplex.site/auth.md

## Live Application
Visit https://codecomplex.site/battle to enter the arena!
`;

    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": "180",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/about", "/faq", "/guidelines", "/privacy", "/terms"],
};
