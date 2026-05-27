const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class SaVSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scum-and-villainy", "sheet", "actor"],
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {},
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    context.actor = this.actor;
    context.owner = this.actor.isOwner;
    context.editable = this.isEditable;
    context.isGM = game.user.isGM;
    return context;
  }
}
