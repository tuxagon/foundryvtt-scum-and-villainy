import { prepareActiveEffectCategories } from "./effects.js";
import { SaVSheetV2 } from "./sav-sheet-v2.js";

export class SaVShipSheet extends SaVSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [...SaVSheetV2.DEFAULT_OPTIONS.classes, "ship"],
    position: { width: 720, height: 970 },
  };

  static PARTS = {
    body: { template: "systems/scum-and-villainy/templates/ship-sheet.html" },
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "abilities", label: "BITD.SpecialAbilities" },
        { id: "upgrades", label: "BITD.Upgrades" },
        { id: "friends", label: "BITD.Contacts" },
        { id: "notes", label: "BITD.Notes" },
        { id: "effects", label: "BITD.Effects" },
        { id: "all-items", label: "BITD.AllItems" },
      ],
      initial: "abilities",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.effects = prepareActiveEffectCategories(this.document.effects);
    context.enrichedDescription =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.description ?? "",
        { secrets: context.owner },
      );
    return context;
  }
}
