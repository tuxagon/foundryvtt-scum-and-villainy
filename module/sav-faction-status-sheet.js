import { SaVSheetV2 } from "./sav-sheet-v2.js";

export class SaVFactionStatusSheet extends SaVSheetV2 {
  static DEFAULT_OPTIONS = {
    classes: [
      ...SaVSheetV2.DEFAULT_OPTIONS.classes,
      "faction-status",
      "fs-faction-dialog",
    ],
    position: { width: 1400, height: 700 },
    window: { resizable: true },
    actions: {
      factionUp: SaVFactionStatusSheet.onFactionUp,
      factionDown: SaVFactionStatusSheet.onFactionDown,
      jobsUp: SaVFactionStatusSheet.onJobsUp,
      jobsDown: SaVFactionStatusSheet.onJobsDown,
    },
  };

  static PARTS = {
    body: {
      template: "systems/scum-and-villainy/templates/faction-status-sheet.hbs",
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.exposeActorName = game.settings.get(
      "scum-and-villainy",
      "exposeActorName",
    );
    context.enrichedDescription =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.description ?? "",
        { secrets: context.owner },
      );
    context.items = [...this.actor.items].sort(
      (a, b) => parseInt(b.system.tier, 10) - parseInt(a.system.tier, 10),
    );
    return context;
  }

  static async onFactionUp(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    const status = item.system.status;
    if (status.value < status.max) {
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, system: { status: { value: status.value + 1 } } },
      ]);
    }
  }

  static async onFactionDown(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    const status = item.system.status;
    if (status.value > 1) {
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, system: { status: { value: status.value - 1 } } },
      ]);
    }
  }

  static async onJobsUp(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    const jobs = item.system.jobs;
    if (jobs.value < jobs.max) {
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, system: { jobs: { value: jobs.value + 1 } } },
      ]);
    }
  }

  static async onJobsDown(_event, target) {
    const element = target.closest(".item");
    const item = this.actor.items.get(element?.dataset.itemId);
    if (!item) return;
    const jobs = item.system.jobs;
    if (jobs.value > 0) {
      await this.actor.updateEmbeddedDocuments("Item", [
        { _id: item.id, system: { jobs: { value: jobs.value - 1 } } },
      ]);
    }
  }
}
