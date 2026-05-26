import { extractPack } from "@foundryvtt/foundryvtt-cli";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const systemJsonPath = path.join(repoRoot, "system.json");
const systemJson = JSON.parse(await readFile(systemJsonPath, "utf-8"));

// SAV_PACKS_SOURCE_DIR lets us point unpack at a snapshot/staging copy when
// Foundry has the live packs/ LevelDB locked. Path is relative to repo root.
const packsSourceRoot = process.env.SAV_PACKS_SOURCE_DIR
  ? path.resolve(repoRoot, process.env.SAV_PACKS_SOURCE_DIR)
  : null;

if (!Array.isArray(systemJson.packs) || systemJson.packs.length === 0) {
  console.warn("No packs declared in system.json; nothing to unpack.");
  process.exit(0);
}

let unpacked = 0;
let skipped = 0;

for (const pack of systemJson.packs) {
  const dirName = path.basename(pack.path);
  const packDir = packsSourceRoot
    ? path.join(packsSourceRoot, dirName)
    : path.resolve(repoRoot, pack.path);
  const srcDir = path.resolve(repoRoot, "src", "packs", dirName);

  if (!existsSync(packDir)) {
    console.warn(`Skipping ${pack.name}: LevelDB ${path.relative(repoRoot, packDir)} not found`);
    skipped++;
    continue;
  }

  await rm(srcDir, { recursive: true, force: true });
  await mkdir(srcDir, { recursive: true });

  console.log(`Unpacking ${pack.name} -> src/packs/${dirName}`);
  await extractPack(packDir, srcDir, { yaml: true, log: false });
  unpacked++;
}

console.log(`\nUnpacked ${unpacked} pack(s)${skipped ? `, skipped ${skipped}` : ""}.`);
