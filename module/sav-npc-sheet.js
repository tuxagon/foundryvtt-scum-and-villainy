import { SaVHelpers } from "./sav-helpers.js";
import { SaVSheetV2 } from "./sav-sheet-v2.js";

export class SaVNPCSheet extends SaVSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [...SaVSheetV2.DEFAULT_OPTIONS.classes, "npc"],
    position: { width: 800, height: 970 },
  };

  static PARTS = {
    body: { template: "systems/scum-and-villainy/templates/npc-sheet.html" },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.size_list = SaVHelpers.createListOfClockSizes(
      game.system.savclocks.sizes,
      parseInt(context.system.goal_clock.max, 10),
      parseInt(context.system.goal_clock.max, 10),
    );
    context.enrichedNotes =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.notes,
        { secrets: context.owner },
      );
    return context;
  }
}
