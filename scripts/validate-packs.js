// Validate packs/_source/<pack>/ against the original LevelDB packs preserved
// on the master branch. Pack files were corrupted/incomplete during the v13→v14
// pack-tooling migration; this restores anything missing.
//
// For each pack declared in system.json:
//   1. Extract the master branch's packs/<name>/ LevelDB files to a temp dir
//   2. Use foundryvtt-cli to dump that LevelDB to YAML in another temp dir
//   3. Diff against the current packs/_source/<name>/
//   4. Copy any YAML files that exist in master but not in current source
//   5. Report counts (existing / restored / total master)
//
// After running, regenerate compiled packs via `mise run pack`.
//
// Usage: bun run ./scripts/validate-packs.js [pack-name]

import { execSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { extractPack } from "@foundryvtt/foundryvtt-cli";

const [, , only] = process.argv;

const manifest = JSON.parse(await readFile("./system.json", "utf8"));
const packs = manifest.packs
  .map((p) => ({
    name: p.name,
    // Source/dest dirs are keyed off the path stem (e.g. "abilities") not the
    // singular pack `name` ("ability"). Match how scripts/packs.js keys them.
    dir: p.path.replace(/^\.\/packs\//, ""),
    path: p.path.replace(/^\.\//, ""),
  }))
  .filter((p) => (only ? p.name === only : true));

const TMP_ROOT = "/tmp/sav-validate-packs";
await rm(TMP_ROOT, { recursive: true, force: true });
await mkdir(TMP_ROOT, { recursive: true });

let totalRestored = 0;
const summary = [];

for (const { name, dir, path: packPath } of packs) {
  const restoredDir = join(TMP_ROOT, `db-${dir}`);
  const yamlDir = join(TMP_ROOT, `yaml-${dir}`);
  await mkdir(restoredDir, { recursive: true });
  await mkdir(yamlDir, { recursive: true });

  // List files in master at the pack path. Filter out lost/ subdirs (LevelDB
  // leftovers from compaction history that aren't part of the live db).
  let lines;
  try {
    lines = execSync(`git ls-tree master -r --name-only ${packPath}`, {
      encoding: "utf8",
    })
      .split("\n")
      .filter((l) => l && !l.includes("/lost/"));
  } catch {
    summary.push({ name, status: "no master entry", restored: 0 });
    continue;
  }

  if (lines.length === 0) {
    summary.push({ name, status: "no master entry", restored: 0 });
    continue;
  }

  // Restore the LevelDB files from master into the temp dir.
  for (const filePath of lines) {
    const basename = filePath.split("/").pop();
    const contents = execSync(`git show master:${filePath}`);
    await writeFile(join(restoredDir, basename), contents);
  }

  // Extract YAML from the restored LevelDB.
  try {
    await extractPack(restoredDir, yamlDir, { yaml: true });
  } catch (e) {
    summary.push({
      name,
      status: `extract failed: ${e.message.slice(0, 60)}`,
      restored: 0,
    });
    continue;
  }

  // Compare against current source.
  const sourceDir = `packs/_source/${dir}`;
  await mkdir(sourceDir, { recursive: true });
  const currentFiles = new Set(await readdir(sourceDir));
  const masterFiles = await readdir(yamlDir);

  let restored = 0;
  for (const file of masterFiles) {
    if (currentFiles.has(file)) continue;
    await copyFile(join(yamlDir, file), join(sourceDir, file));
    restored++;
  }

  totalRestored += restored;
  summary.push({
    name,
    current: currentFiles.size,
    master: masterFiles.length,
    restored,
  });
}

console.log("\nPack validation summary:");
console.log("─".repeat(64));
for (const row of summary) {
  if (row.status) {
    console.log(`  ${row.name.padEnd(20)} ${row.status}`);
  } else {
    const tag =
      row.restored > 0
        ? `+${row.restored} restored`
        : row.master === row.current
          ? "ok"
          : `current=${row.current} master=${row.master}`;
    console.log(
      `  ${row.name.padEnd(20)} current=${String(row.current).padStart(3)} master=${String(row.master).padStart(3)}  ${tag}`,
    );
  }
}
console.log("─".repeat(64));
console.log(`Total restored: ${totalRestored}`);
if (totalRestored > 0) {
  console.log("\nRun 'mise run pack' to rebuild compiled packs.");
}
