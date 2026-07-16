const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
    // ── Auth / account routes ──
    "signup", "login", "logout", "register", "verify", "otp",
    "refresh-token", "refresh", "password", "forgot-password",
    "reset-password", "change-password", "email", "account",
    "delete-account", "me",

    // ── Profile / settings ──
    "profile", "settings", "avatar", "bio", "country", "preferences",

    // ── Platform sections (DevWar domains) ──
    "dsa", "frontend", "backend", "projects", "bug-fix", "bugfix",
    "prompt-war", "promptwar", "arena", "battle", "battles", "battleroom",
    "match", "matches", "matchmaking", "queue", "leaderboard",
    "leaderboards", "ranking", "rankings", "rating", "ratings",
    "achievement", "achievements", "badge", "badges", "friend",
    "friends", "friendship", "notification", "notifications",
    "team", "teams",

    // ── Generic site structure ──
    "api", "admin", "static", "assets", "public", "uploads",
    "help", "support", "about", "contact", "terms", "privacy",
    "faq", "blog", "docs", "status", "health", "home", "index",

    // ── Impersonation / authority-implying ──
    "administrator", "root", "superuser", "system", "moderator",
    "mod", "owner", "staff", "official", "devarena", "bot",

    // ── Technical / accidental-leak strings ──
    "null", "undefined", "true", "false", "nan", "anonymous",
    "deleted", "deleted-user", "guest", "test", "demo"
]);

export function isReservedUsername(username: string): boolean {
    return RESERVED_USERNAMES.has(username.trim().toLowerCase());
}

export default RESERVED_USERNAMES;