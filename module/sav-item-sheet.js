import { prepareActiveEffectCategories } from "./effects.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const SIMPLE_TYPES = new Set([
  "background",
  "heritage",
  "vice",
  "crew_reputation",
  "ship_size",
]);

export class SaVItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scum-and-villainy", "sheet", "item"],
    position: { width: 900, height: 700 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {},
  };

  static PARTS = {
    body: { template: "" },
  };

  _configureRenderParts(_options) {
    const parts = foundry.utils.deepClone(this.constructor.PARTS);
    const key = SIMPLE_TYPES.has(this.item.type) ? "simple" : this.item.type;
    parts.body.template = `systems/scum-and-villainy/templates/items/${key}.html`;
    return parts;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.item = this.item;
    context.owner = this.item.isOwner;
    context.editable = this.isEditable;
    context.isGM = game.user.isGM;
    context.effects = prepareActiveEffectCategories(this.document.effects);
    context.enrichedDescription =
      await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        context.system.description ?? "",
        { secrets: context.owner },
      );
    if (context.system.notables !== undefined) {
      context.enrichedNotables =
        await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          context.system.notables ?? "",
          { secrets: context.owner },
        );
    }
    return context;
  }
}
