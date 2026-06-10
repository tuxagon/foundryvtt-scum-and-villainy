// Rewrite system.json.version and system.json.download from a single
// argument so they can't drift out of lockstep. The download URL is derived
// from system.json.url (expected: https://github.com/<owner>/<repo>) and the
// new release tag (v<version>).
//
// Usage: bun run ./scripts/bump.js <version>

import { readFile, writeFile } from "node:fs/promises";

const [, , version] = process.argv;
if (!version) {
  console.error("Usage: bun run ./scripts/bump.js <version>");
  process.exit(1);
}

const manifest = JSON.parse(await readFile("./system.json", "utf8"));
manifest.version = version;
const repo = manifest.url
  .replace(/^https:\/\/github\.com\//, "")
  .replace(/\/$/, "");
manifest.download = `https://github.com/${repo}/releases/download/v${version}/${manifest.id}-v${version}.zip`;
await writeFile("./system.json", `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Bumped to ${version}`);
console.log(`  download: ${manifest.download}`);
