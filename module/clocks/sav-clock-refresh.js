import { buildClockDataUrl } from "./sav-clock-image.js";
import { CLOCK_ACTOR_TYPE } from "./clocks.js";
import { SYSTEM_ID } from "./sav-clock-adapter.js";

function clockFlagsOn(doc) {
  return doc?.flags?.[SYSTEM_ID]?.clocks;
}

async function refreshClockTokens() {
  if (!game?.scenes) return;
  for (const scene of game.scenes) {
    const updates = [];
    for (const tokenDoc of scene.tokens) {
      const actor = tokenDoc.actor;
      if (actor?.type !== CLOCK_ACTOR_TYPE) continue;
      const clock = clockFlagsOn(actor);
      if (!clock) continue;
      const src = buildClockDataUrl(clock);
      if (tokenDoc.texture?.src !== src) {
        updates.push({ _id: tokenDoc.id, texture: { src } });
      }
    }
    if (updates.length) {
      await scene.updateEmbeddedDocuments("Token", updates, { animate: false, animation: { duration: 0 } });
    }
  }
}

async function refreshClockActors() {
  if (!game?.actors) return;
  const updates = [];
  for (const actor of game.actors) {
    if (actor.type !== CLOCK_ACTOR_TYPE) continue;
    const clock = clockFlagsOn(actor);
    if (!clock) continue;
    const src = buildClockDataUrl(clock);
    if (actor.img !== src) {
      updates.push({ _id: actor.id, img: src, "prototypeToken.texture.src": src });
    }
  }
  if (updates.length) {
    await Actor.updateDocuments(updates);
  }
}

async function refreshClockTiles() {
  if (!game?.scenes) return;
  for (const scene of game.scenes) {
    const updates = [];
    for (const tile of scene.tiles) {
      const clock = clockFlagsOn(tile);
      if (!clock) continue;
      const src = buildClockDataUrl(clock);
      if (tile.texture?.src !== src) {
        updates.push({ _id: tile.id, texture: { src } });
      }
    }
    if (updates.length) {
      await scene.updateEmbeddedDocuments("Tile", updates, { animate: false, animation: { duration: 0 } });
    }
  }
}

function refreshOpenSheets() {
  for (const app of Object.values(ui?.windows ?? {})) {
    if (app?.rendered) app.render();
  }
}

export async function refreshAllClockSurfaces() {
  if (!game?.user?.isGM) {
    refreshOpenSheets();
    return;
  }
  await refreshClockActors();
  await refreshClockTokens();
  await refreshClockTiles();
  refreshOpenSheets();
}
