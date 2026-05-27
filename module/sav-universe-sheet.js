import { SaVSheetV2 } from "./sav-sheet-v2.js";

export class SaVUniverseSheet extends SaVSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [...SaVSheetV2.DEFAULT_OPTIONS.classes, "universe"],
    position: { width: 800, height: 700 },
    actions: {
      openItem: SaVUniverseSheet.onOpenItem,
      deleteItem: SaVUniverseSheet.onDeleteItem,
      postItem: SaVUniverseSheet.onPostItem,
      toggleVisible: SaVUniverseSheet.onToggleVisible,
      rollWanted: SaVUniverseSheet.onRollWanted,
    },
  };

  static PARTS = {
    body: {
      template: "systems/scum-and-villainy/templates/universe-sheet.html",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.items = this.actor.items;
    context.enrichedDescription =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.description ?? "",
        { secrets: context.owner },
      );
    let total = 0;
    this.actor.items.forEach((i) => {
      if (i.type === "star_system") total += 1;
    });
    context.totalSystems = total;
    return context;
  }

  static async onOpenItem(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    item?.sheet.render(true);
  }

  static async onDeleteItem(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    await this.actor.deleteEmbeddedDocuments("Item", [item.id]);
  }

  static async onPostItem(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    item?.sendToChat();
  }

  static async onToggleVisible(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    await this.actor.updateEmbeddedDocuments("Item", [
      { _id: item.id, system: { visible: !item.system.visible } },
    ]);
  }

  static async onRollWanted(_event, target) {
    const value = parseInt(target.dataset.value, 10);
    const wantedCompendiums = await game.packs
      .filter(
        (p) =>
          p.metadata.label === "Wanted Tables" &&
          p.documentName === "RollTable",
      )[0]
      .getDocuments();

    if (value < 4) {
      const tableName = `Wanted ${value}`;
      const table = wantedCompendiums.find((p) => p.name === tableName);
      if (!table) {
        ui.notifications.warn(`Table ${tableName} not found.`, {});
        return;
      }
      await table.draw();
    } else {
      const tableName = "Wanted 3";
      const table = wantedCompendiums.find((p) => p.name === tableName);
      if (!table) {
        ui.notifications.warn(`Table ${tableName} not found.`, {});
        return;
      }
      const r = new Roll("6");
      await table.draw({ roll: r });
    }
  }
}
