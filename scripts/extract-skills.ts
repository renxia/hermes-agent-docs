#!/usr/bin/env npx tsx
/**
 * Extract skill metadata from SKILL.md files and index caches into JSON.
 */

import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "..");
const LOCAL_SKILL_DIRS: [string, string][] = [
  ["skills", "built-in"],
  ["optional-skills", "optional"],
];
const INDEX_CACHE_DIR = path.join(REPO_ROOT, "skills", "index-cache");
const OUTPUT = path.join(REPO_ROOT, "src", "data", "skills.json");

const CATEGORY_LABELS: Record<string, string> = {
  apple: "Apple",
  "autonomous-ai-agents": "AI Agents",
  blockchain: "Blockchain",
  communication: "Communication",
  creative: "Creative",
  "data-science": "Data Science",
  devops: "DevOps",
  dogfood: "Dogfood",
  domain: "Domain",
  email: "Email",
  feeds: "Feeds",
  gaming: "Gaming",
  gifs: "GIFs",
  github: "GitHub",
  health: "Health",
  "inference-sh": "Inference",
  leisure: "Leisure",
  mcp: "MCP",
  media: "Media",
  migration: "Migration",
  mlops: "MLOps",
  "note-taking": "Note-Taking",
  productivity: "Productivity",
  "red-teaming": "Red Teaming",
  research: "Research",
  security: "Security",
  "smart-home": "Smart Home",
  "social-media": "Social Media",
  "software-development": "Software Dev",
  translation: "Translation",
  other: "Other",
};

const SOURCE_LABELS: Record<string, string> = {
  anthropics_skills: "Anthropic",
  openai_skills: "OpenAI",
  claude_marketplace: "Claude Marketplace",
  lobehub: "LobeHub",
};

interface Skill {
  name: string;
  description: string;
  category: string;
  categoryLabel: string;
  source: string;
  tags: string[];
  platforms: string[];
  author: string;
  version: string;
}

interface FrontMatter {
  name?: string;
  description?: string;
  tags?: string | string[];
  metadata?: {
    hermes?: {
      tags?: string[];
    };
  };
  platforms?: string[];
  author?: string;
  version?: string;
}

function extractLocalSkills(): Skill[] {
  const skills: Skill[] = [];

  for (const [baseDir, sourceLabel] of LOCAL_SKILL_DIRS) {
    const basePath = path.join(REPO_ROOT, baseDir);
    if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) {
      continue;
    }

    const walkDir = (dir: string): void => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name === "SKILL.md") {
          const skillDir = dir;
          const content = fs.readFileSync(path.join(skillDir, "SKILL.md"), "utf-8");

          if (!content.startsWith("---")) {
            continue;
          }

          const parts = content.split("---", 2);
          if (parts.length < 3) {
            continue;
          }

          try {
            const fm = yaml.load(parts[1]) as FrontMatter;
            if (!fm || typeof fm !== "object") {
              continue;
            }

            const rel = path.relative(basePath, skillDir);
            const category = rel.split(path.sep)[0];

            let tags: string[] = [];
            if (fm.metadata && typeof fm.metadata === "object") {
              const hermesMeta = fm.metadata.hermes;
              if (hermesMeta && typeof hermesMeta === "object") {
                tags = hermesMeta.tags ?? [];
              }
            }
            if (!tags.length) {
              tags = typeof fm.tags === "string" ? [fm.tags] : (fm.tags ?? []);
            }

            skills.push({
              name: fm.name ?? path.basename(skillDir),
              description: fm.description ?? "",
              category,
              categoryLabel:
                CATEGORY_LABELS[category] ?? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              source: sourceLabel,
              tags,
              platforms: fm.platforms ?? [],
              author: fm.author ?? "",
              version: fm.version ?? "",
            });
          } catch {
            continue;
          }
        }
      }
    };

    walkDir(basePath);
  }

  return skills;
}

const TAG_TO_CATEGORY: Record<string, string> = {
  // software-development
  programming: "software-development",
  code: "software-development",
  coding: "software-development",
  "software-development": "software-development",
  "frontend-development": "software-development",
  "backend-development": "software-development",
  "web-development": "software-development",
  react: "software-development",
  python: "software-development",
  typescript: "software-development",
  java: "software-development",
  rust: "software-development",
  // creative
  writing: "creative",
  design: "creative",
  creative: "creative",
  art: "creative",
  "image-generation": "creative",
  // research
  education: "research",
  academic: "research",
  research: "research",
  // social-media
  marketing: "social-media",
  seo: "social-media",
  "social-media": "social-media",
  // productivity
  productivity: "productivity",
  business: "productivity",
  // data-science
  data: "data-science",
  "data-science": "data-science",
  // mlops
  "machine-learning": "mlops",
  "deep-learning": "mlops",
  // devops
  devops: "devops",
  // gaming
  gaming: "gaming",
  game: "gaming",
  "game-development": "gaming",
  // media
  music: "media",
  media: "media",
  video: "media",
  // health
  health: "health",
  fitness: "health",
  // translation
  translation: "translation",
  "language-learning": "translation",
  // security
  security: "security",
  cybersecurity: "security",
};

function guessCategory(tags: string[]): string {
  if (!tags.length) {
    return "uncategorized";
  }
  for (const tag of tags) {
    const cat = TAG_TO_CATEGORY[tag.toLowerCase()];
    if (cat) {
      return cat;
    }
  }
  return tags[0].toLowerCase().replace(/ /g, "-");
}

interface CachedAgent {
  identifier?: string;
  author?: string;
  meta?: {
    title?: string;
    description?: string;
    tags?: string[];
  };
}

interface CachedIndex {
  agents?: CachedAgent[];
  [key: string]: unknown;
}

function extractCachedIndexSkills(): Skill[] {
  const skills: Skill[] = [];

  if (!fs.existsSync(INDEX_CACHE_DIR) || !fs.statSync(INDEX_CACHE_DIR).isDirectory()) {
    return skills;
  }

  const files = fs.readdirSync(INDEX_CACHE_DIR);
  for (const filename of files) {
    if (!filename.endsWith(".json")) {
      continue;
    }

    const filepath = path.join(INDEX_CACHE_DIR, filename);
    let data: CachedIndex | unknown[];
    try {
      const content = fs.readFileSync(filepath, "utf-8");
      data = JSON.parse(content);
    } catch {
      continue;
    }

    const stem = filename.replace(".json", "");
    let sourceLabel = "community";
    for (const [key, label] of Object.entries(SOURCE_LABELS)) {
      if (stem.includes(key)) {
        sourceLabel = label;
        break;
      }
    }

    if (typeof data === "object" && data !== null && "agents" in data) {
      const indexData = data as CachedIndex;
      for (const agent of indexData.agents ?? []) {
        if (typeof agent !== "object" || !agent) {
          continue;
        }
        const meta = agent.meta ?? {};
        skills.push({
          name: agent.identifier ?? meta.title ?? "unknown",
          description: (meta.description ?? "").split("\n")[0].slice(0, 200),
          category: guessCategory(meta.tags ?? []),
          categoryLabel: "",
          source: sourceLabel,
          tags: meta.tags ?? [],
          platforms: [],
          author: agent.author ?? "",
          version: "",
        });
      }
      continue;
    }

    if (Array.isArray(data)) {
      for (const entry of data) {
        if (typeof entry !== "object" || !entry || !(entry as { name?: string }).name) {
          continue;
        }
        const e = entry as Record<string, unknown>;
        if ("skills" in e && Array.isArray(e.skills)) {
          continue;
        }
        skills.push({
          name: (e.name as string) ?? "",
          description: (e.description as string) ?? "",
          category: "uncategorized",
          categoryLabel: "",
          source: sourceLabel,
          tags: (e.tags as string[]) ?? [],
          platforms: [],
          author: "",
          version: "",
        });
      }
    }
  }

  for (const s of skills) {
    if (!s.categoryLabel) {
      s.categoryLabel =
        CATEGORY_LABELS[s.category] ??
        (s.category
          ? s.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
          : "Uncategorized");
    }
  }

  return skills;
}

const MIN_CATEGORY_SIZE = 4;

function consolidateSmallCategories(skills: Skill[]): Skill[] {
  for (const s of skills) {
    if (s.category === "uncategorized" || s.category === "") {
      s.category = "other";
      s.categoryLabel = "Other";
    }
  }

  const counts = new Map<string, number>();
  for (const s of skills) {
    counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
  }

  const smallCats = new Set<string>();
  for (const [cat, n] of counts) {
    if (n < MIN_CATEGORY_SIZE) {
      smallCats.add(cat);
    }
  }

  for (const s of skills) {
    if (smallCats.has(s.category)) {
      s.category = "other";
      s.categoryLabel = "Other";
    }
  }

  return skills;
}

function main(): void {
  const local = extractLocalSkills();
  const external = extractCachedIndexSkills();

  const allSkills = consolidateSmallCategories([...local, ...external]);

  const sourceOrder: Record<string, number> = { "built-in": 0, optional: 1 };
  allSkills.sort((a, b) => {
    const aSource = sourceOrder[a.source] ?? 2;
    const bSource = sourceOrder[b.source] ?? 2;
    if (aSource !== bSource) return aSource - bSource;
    const aIsOther = a.category === "other" ? 1 : 0;
    const bIsOther = b.category === "other" ? 1 : 0;
    if (aIsOther !== bIsOther) return aIsOther - bIsOther;
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return a.name.localeCompare(b.name);
  });

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(allSkills, null, 2), "utf-8");

  const localBuiltIn = local.filter((s) => s.source === "built-in").length;
  const localOptional = local.filter((s) => s.source === "optional").length;

  console.log(`Extracted ${allSkills.length} skills to ${OUTPUT}`);
  console.log(
    `  ${local.length} local (${localBuiltIn} built-in, ${localOptional} optional)`
  );
  console.log(`  ${external.length} from external indexes`);
}

main();
