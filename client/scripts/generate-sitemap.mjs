import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = "https://codecomplex.site";
const now = new Date().toISOString();

const coreRoutes = [
  { path: "", priority: "1.0", changefreq: "daily" },
  { path: "/problems", priority: "0.95", changefreq: "daily" },
  { path: "/battle", priority: "0.95", changefreq: "daily" },
  { path: "/about", priority: "0.9", changefreq: "weekly" },
  { path: "/faq", priority: "0.9", changefreq: "weekly" },
  { path: "/leaderboard", priority: "0.9", changefreq: "daily" },
  { path: "/verify-certificate", priority: "0.85", changefreq: "daily" },
  { path: "/revision", priority: "0.85", changefreq: "daily" },
  { path: "/achievements", priority: "0.75", changefreq: "weekly" },
  { path: "/matches", priority: "0.7", changefreq: "daily" },
  { path: "/guidelines", priority: "0.7", changefreq: "monthly" },
  { path: "/login", priority: "0.8", changefreq: "monthly" },
  { path: "/signup", priority: "0.8", changefreq: "monthly" },
  { path: "/contact", priority: "0.6", changefreq: "monthly" },
  { path: "/privacy", priority: "0.5", changefreq: "monthly" },
  { path: "/terms", priority: "0.5", changefreq: "monthly" },
  { path: "/auth.md", priority: "0.8", changefreq: "weekly" },
];

const modeFolders = ["dsa", "bug-fix", "frontend", "backend", "prompt-war"];

function scanJsonFiles(dir) {
  let files = [];
  if (!fs.existsSync(dir)) return files;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const full = path.join(dir, item.name);
      if (item.isDirectory()) {
        files = files.concat(scanJsonFiles(full));
      } else if (item.name.endsWith(".json")) {
        files.push(full);
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message);
  }
  return files;
}

function findDbDir() {
  const candidates = [
    path.resolve(__dirname, "../../backendServer/src/db"),
    path.resolve(process.cwd(), "../backendServer/src/db"),
    path.resolve(process.cwd(), "backendServer/src/db"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

function generate() {
  const dbRoot = findDbDir();
  console.log(`Searching challenges in: ${dbRoot}`);

  const questionEntries = [];
  const seenSlugs = new Set();

  for (const folder of modeFolders) {
    const folderPath = path.join(dbRoot, folder);
    const files = scanJsonFiles(folderPath);

    for (const file of files) {
      try {
        const raw = fs.readFileSync(file, "utf8");
        const json = JSON.parse(raw);
        const slug = json.slug || json._id;
        if (slug && !seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          const diff = json.difficulty || "Medium";
          const priority = diff === "Easy" ? "0.85" : diff === "Medium" ? "0.8" : "0.75";
          questionEntries.push({
            loc: `${baseUrl}/problems/${slug}`,
            priority,
            changefreq: "weekly",
          });
        }
      } catch {}
    }
  }

  console.log(`Found ${questionEntries.length} unique challenge URLs.`);

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const r of coreRoutes) {
    xml += `  <url>\n    <loc>${baseUrl}${r.path}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
  }

  for (const q of questionEntries) {
    xml += `  <url>\n    <loc>${q.loc}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>${q.changefreq}</changefreq>\n    <priority>${q.priority}</priority>\n  </url>\n`;
  }

  xml += `</urlset>\n`;

  const publicSitemapPath = path.resolve(__dirname, "../public/sitemap.xml");
  fs.writeFileSync(publicSitemapPath, xml, "utf8");
  console.log(`Successfully written sitemap.xml to ${publicSitemapPath} with ${coreRoutes.length + questionEntries.length} total URLs.`);
}

generate();
