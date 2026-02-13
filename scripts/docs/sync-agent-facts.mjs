import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FACTS_FILE = path.join(ROOT, "docs", "RUNTIME_FACTS.md");
const TARGETS = [
  path.join(ROOT, "AGENTS.md"),
  path.join(ROOT, "CLAUDE.md"),
];

const START = "<!-- CORE_RUNTIME_FACTS:START -->";
const END = "<!-- CORE_RUNTIME_FACTS:END -->";

function fail(message) {
  console.error(`[docs:sync] ${message}`);
  process.exit(1);
}

if (!fs.existsSync(FACTS_FILE)) {
  fail(`Missing runtime facts file: ${FACTS_FILE}`);
}

const facts = fs.readFileSync(FACTS_FILE, "utf8").trim();
if (!facts) {
  fail("docs/RUNTIME_FACTS.md is empty.");
}

const updated = [];
for (const file of TARGETS) {
  if (!fs.existsSync(file)) {
    fail(`Missing target file: ${file}`);
  }

  const content = fs.readFileSync(file, "utf8");
  const startIndex = content.indexOf(START);
  const endIndex = content.indexOf(END);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    fail(`Missing or invalid sync markers in ${path.relative(ROOT, file)}`);
  }

  const before = content.slice(0, startIndex + START.length);
  const after = content.slice(endIndex);
  const next = `${before}\n\n${facts}\n\n${after}`;

  if (next !== content) {
    fs.writeFileSync(file, next);
    updated.push(path.relative(ROOT, file));
  }
}

if (updated.length === 0) {
  console.log("[docs:sync] No changes.");
} else {
  console.log(`[docs:sync] Updated ${updated.length} file(s): ${updated.join(", ")}`);
}
