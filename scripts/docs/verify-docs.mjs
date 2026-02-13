import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const START = "<!-- CORE_RUNTIME_FACTS:START -->";
const END = "<!-- CORE_RUNTIME_FACTS:END -->";

const REQUIRED_FILES = [
  "docs/RUNTIME_FACTS.md",
  "docs/COVERAGE_MATRIX.md",
  "docs/README.md",
  "AGENTS.md",
  "CLAUDE.md",
];

const SYNC_TARGETS = ["AGENTS.md", "CLAUDE.md"];

const STALE_PATTERNS = [
  { re: /MAX_CONTEXT_MESSAGES\s*=\s*24/i, reason: "Stale message cap (24)." },
  { re: /last\s+24\s+messages/i, reason: "Stale message history claim (24)." },
  { re: /\b25,?000\b/, reason: "Stale context trigger (25000)." },
  { re: /keep(?:s)?\s+last\s+5\s+tool\s+uses/i, reason: "Stale tool-use keep count (5)." },
  { re: /keepRecent\s*=\s*4/i, reason: "Stale compact-old-messages keepRecent value (4)." },
  { re: /last\s+8\s+user\s+messages/i, reason: "Stale session-summary message window (8)." },
  { re: /MAX_PRODUCTS_SHOWN\s*=\s*5\b/i, reason: "Stale MAX_PRODUCTS_SHOWN value (5)." },
  { re: /MAX_MENU_PRODUCTS_SHOWN\s*=\s*10\b/i, reason: "Stale MAX_MENU_PRODUCTS_SHOWN value (10)." },
  { re: /MAX_RESTAURANTS_SHOWN\s*=\s*10\b/i, reason: "Stale MAX_RESTAURANTS_SHOWN value (10)." },
  { re: /\b42\s+test\s+files\b/i, reason: "Stale test-file count (42)." },
  { re: /\b43\s+test\s+files\b/i, reason: "Stale test-file count (43)." },
  { re: /\b44\s+test\s+files\b/i, reason: "Stale test-file count (44)." },
];

function fail(messages) {
  for (const message of messages) {
    console.error(`[docs:verify] ${message}`);
  }
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), "utf8");
}

function getMarkdownFiles(dir) {
  const rootDir = path.join(ROOT, dir);
  const files = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (entry.isFile() && full.endsWith(".md")) {
        files.push(path.relative(ROOT, full));
      }
    }
  }

  walk(rootDir);
  return files;
}

function extractSyncedBlock(fileContent, fileName) {
  const start = fileContent.indexOf(START);
  const end = fileContent.indexOf(END);
  if (start === -1 || end === -1 || end <= start) {
    fail([`Missing or invalid sync markers in ${fileName}`]);
  }
  return fileContent
    .slice(start + START.length, end)
    .trim();
}

function checkRequiredFiles() {
  const missing = REQUIRED_FILES.filter((file) => !fs.existsSync(path.join(ROOT, file)));
  if (missing.length > 0) {
    fail(missing.map((file) => `Missing required file: ${file}`));
  }
}

function checkSyncedFacts() {
  const facts = read("docs/RUNTIME_FACTS.md").trim();
  const mismatches = [];

  for (const file of SYNC_TARGETS) {
    const content = read(file);
    const synced = extractSyncedBlock(content, file);
    if (synced !== facts) {
      mismatches.push(`${file} is out of sync with docs/RUNTIME_FACTS.md. Run npm run docs:sync.`);
    }
  }

  if (mismatches.length > 0) {
    fail(mismatches);
  }
}

function checkStaleClaims(markdownFiles) {
  const errors = [];
  for (const file of markdownFiles) {
    const content = read(file);
    for (const rule of STALE_PATTERNS) {
      if (rule.re.test(content)) {
        errors.push(`${file}: ${rule.reason}`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }
}

function isExternalLink(target) {
  return /^(https?:|mailto:)/i.test(target);
}

function cleanTarget(rawTarget) {
  const trimmed = rawTarget.trim();
  const noAngle = trimmed.startsWith("<") && trimmed.endsWith(">")
    ? trimmed.slice(1, -1)
    : trimmed;
  return noAngle;
}

function checkMarkdownLinks(markdownFiles) {
  const errors = [];
  const linkPattern = /\[[^\]]*\]\(([^)]+)\)/g;

  for (const file of markdownFiles) {
    const content = read(file);
    const dir = path.dirname(path.join(ROOT, file));

    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const targetRaw = cleanTarget(match[1]);
      if (!targetRaw || targetRaw.startsWith("#") || isExternalLink(targetRaw)) {
        continue;
      }

      const [targetPath] = targetRaw.split("#");
      if (!targetPath) {
        continue;
      }

      const resolved = path.resolve(dir, targetPath);
      if (!fs.existsSync(resolved)) {
        errors.push(`${file}: broken link target ${targetRaw}`);
      }
    }
  }

  if (errors.length > 0) {
    fail(errors);
  }
}

function main() {
  checkRequiredFiles();
  const markdownFiles = [
    "README.md",
    "AGENTS.md",
    "CLAUDE.md",
    ...getMarkdownFiles("docs"),
  ];

  checkSyncedFacts();
  checkStaleClaims(markdownFiles);
  checkMarkdownLinks(markdownFiles);

  console.log("[docs:verify] OK");
}

main();
