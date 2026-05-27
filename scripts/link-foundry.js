import * as fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

if (!fs.existsSync("foundry-config.yaml")) {
  console.log("foundry-config.yaml not found; nothing to link.");
  process.exit(0);
}

const fc = await fs.promises.readFile("foundry-config.yaml", "utf-8");
const foundryConfig = yaml.load(fc);

// Electron installs nest sources under resources/app; Node installs do not.
const nested = fs.existsSync(path.join(foundryConfig.installPath, "resources", "app"));
const fileRoot = nested
  ? path.join(foundryConfig.installPath, "resources", "app")
  : foundryConfig.installPath;

try {
  await fs.promises.mkdir("foundry");
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}

for (const p of ["client", "common", "tsconfig.json"]) {
  try {
    await fs.promises.symlink(path.join(fileRoot, p), path.join("foundry", p));
  } catch (e) {
    if (e.code !== "EEXIST") throw e;
  }
}

try {
  await fs.promises.symlink(path.join(fileRoot, "public", "lang"), path.join("foundry", "lang"));
} catch (e) {
  if (e.code !== "EEXIST") throw e;
}

console.log(`Linked Foundry sources from ${fileRoot} into ./foundry/`);
