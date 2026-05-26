import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const systemJsonPath = path.join(repoRoot, "system.json");
const systemJson = JSON.parse(await readFile(systemJsonPath, "utf-8"));

// SAV_PACKS_DEST_DIR lets us pack to a scratch directory (useful when Foundry
// has the live packs/ LevelDB locked). Path is relative to repo root.
const packsDestRoot = process.env.SAV_PACKS_DEST_DIR
  ? path.resolve(repoRoot, process.env.SAV_PACKS_DEST_DIR)
  : null;

if (!Array.isArray(systemJson.packs) || systemJson.packs.length === 0) {
  console.warn("No packs declared in system.json; nothing to pack.");
  process.exit(0);
}

let packed = 0;
let skipped = 0;

for (const pack of systemJson.packs) {
  const dirName = path.basename(pack.path);
  const srcDir = path.resolve(repoRoot, "src", "packs", dirName);
  const destDir = packsDestRoot
    ? path.join(packsDestRoot, dirName)
    : path.resolve(repoRoot, pack.path);

  if (!existsSync(srcDir)) {
    console.warn(`Skipping ${pack.name}: source src/packs/${dirName} not found`);
    skipped++;
    continue;
  }

  const entries = await readdir(srcDir);
  if (entries.length === 0) {
    console.warn(`Skipping ${pack.name}: source src/packs/${dirName} is empty`);
    skipped++;
    continue;
  }

  await rm(destDir, { recursive: true, force: true });
  await mkdir(destDir, { recursive: true });

  console.log(`Packing src/packs/${dirName} -> ${pack.name}`);
  await compilePack(srcDir, destDir, { yaml: true, log: false });
  packed++;
}

console.log(`\nPacked ${packed} pack(s)${skipped ? `, skipped ${skipped}` : ""}.`);
