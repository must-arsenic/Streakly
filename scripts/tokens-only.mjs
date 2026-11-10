// The tokens-only check. `pnpm lint`: a raw colour (hex, rgb, hsl) anywhere in src/ except
// src/theme/tokens.ts fails, naming each file and line.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const src = join(root, "src");
const tokens = join(src, "theme", "tokens.ts");
const raw = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|\b(?:rgba?|hsla?)\(/;

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(name) ? [path] : [];
  });
}

const found = [];
let checked = 0;
for (const file of files(src)) {
  if (file === tokens) continue;
  checked += 1;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, n) => {
      if (raw.test(line)) found.push(`${relative(root, file)}:${n + 1}: ${line.trim()}`);
    });
}
if (found.length > 0) {
  console.error("Use a token from src/theme/tokens.ts instead of a raw colour:");
  for (const line of found) console.error(`  ${line}`);
  process.exit(1);
}
console.log(`tokens only: ${checked} files checked`);
