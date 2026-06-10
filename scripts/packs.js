import { readdir } from "node:fs/promises";
import { compilePack, extractPack } from "@foundryvtt/foundryvtt-cli";

const SRC = "packs/_source";
const DEST = "packs";
const [, , action, only] = process.argv;
const names = only ? [only] : await readdir(SRC);

for (const name of names) {
  if (action === "pack") {
    await compilePack(`${SRC}/${name}`, `${DEST}/${name}`, { yaml: true });
  }
  if (action === "unpack") {
    await extractPack(`${DEST}/${name}`, `${SRC}/${name}`, { yaml: true });
  }
}
