import { prepareActiveEffectCategories } from "./effects.js";
import { lifestyleRollPopup } from "./sav-roll.js";
import { SaVSheetV2 } from "./sav-sheet-v2.js";

const LOAD_LEVELS = [
  "BITD.Empty",
  "BITD.Light",
  "BITD.Light",
  "BITD.Light",
  "BITD.Normal",
  "BITD.Normal",
  "BITD.Heavy",
  "BITD.Heavy",
  "BITD.Heavy",
  "BITD.OverMax",
  "BITD.OverMax",
];

const MULE_LEVELS = [
  "BITD.Empty",
  "BITD.Light",
  "BITD.Light",
  "BITD.Light",
  "BITD.Light",
  "BITD.Normal",
  "BITD.Normal",
  "BITD.Heavy",
  "BITD.Heavy",
  "BITD.Heavy",
  "BITD.OverMax",
];

export class SaVActorSheet extends SaVSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [...SaVSheetV2.DEFAULT_OPTIONS.classes, "character"],
    position: { width: 800, height: 970 },
    actions: {
      openShip: SaVActorSheet.onOpenShip,
      deleteFlag: SaVActorSheet.onDeleteFlag,
      lifestyle: SaVActorSheet.onLifestyle,
    },
  };

  static PARTS = {
    body: { template: "systems/scum-and-villainy/templates/actor-sheet.html" },
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "abilities", label: "BITD.Abilities" },
        { id: "loadout", label: "BITD.Loadout" },
        { id: "friends", label: "BITD.Friends" },
        { id: "character-notes", label: "BITD.Notes" },
        { id: "effects", label: "BITD.Effects" },
        { id: "all-character-items", label: "BITD.AllItems" },
      ],
      initial: "abilities",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    // Clone system so derived-value mutations (loadout, stress/trauma maxes,
    // load_level) below don't try to mutate the read-only DataModel.
    context.system = foundry.utils.deepClone(this.actor.system);
    context.effects = prepareActiveEffectCategories(this.document.effects);

    const shipActorFlags =
      this.actor.getFlag("scum-and-villainy", "ship") || [];
    const shipActor = game.actors.get(shipActorFlags[0]?.id);
    if (shipActor === undefined) {
      this.actor.setFlag("scum-and-villainy", "ship", "");
    }
    context.shipActor = [shipActor];

    const loadout = context.system.loadout;
    if (shipActor?.system.installs.loaded_inst === 1) {
      loadout.heavy++;
      loadout.normal++;
      loadout.light++;
    } else {
      loadout.heavy = loadout.heavy_default;
      loadout.normal = loadout.normal_default;
      loadout.light = loadout.light_default;
    }

    if (shipActor?.system.installs.stress_max_up === 1) {
      context.system.stress.max++;
    } else {
      context.system.stress.max = context.system.stress.max_default;
    }

    if (shipActor?.system.installs.trauma_max_up === 1) {
      context.system.trauma.max++;
    } else {
      context.system.trauma.max = context.system.trauma.max_default;
    }

    context.system.forged =
      shipActor?.system.installs.forged_inst === 1 ? 1 : 0;

    if (loadout.heavy > loadout.heavy_default) {
      loadout.load_level = MULE_LEVELS[loadout.current];
    } else {
      loadout.load_level = LOAD_LEVELS[loadout.current];
    }

    if (parseInt(loadout.planned, 10) < loadout.current) {
      loadout.load_level = "BITD.OverMax";
    }

    context.enrichedDescription =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.description ?? "",
        { secrets: context.owner },
      );
    return context;
  }

  static async onOpenShip(_event, target) {
    const element = target.closest(".item");
    const actor = game.actors.get(element?.dataset.itemId);
    actor?.sheet.render(true);
  }

  static async onDeleteFlag(_event, target) {
    const element = target.closest(".item");
    const itemType = element?.dataset.itemType;
    if (!itemType) return;
    await this.actor.setFlag("scum-and-villainy", itemType, null);
  }

  static async onLifestyle(_event, target) {
    const coins = target.dataset.rollValue;
    await lifestyleRollPopup(coins);
  }
}
