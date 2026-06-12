import { SaVHelpers } from "./sav-helpers.js";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

function escapeAttr(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export class SaVSheetV2 extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scum-and-villainy", "sheet", "actor"],
    form: { submitOnChange: true, closeOnSubmit: false },
    window: { resizable: true },
    actions: {
      addItemPopup: SaVSheetV2.onAddItemPopup,
      addFlagPopup: SaVSheetV2.onAddFlagPopup,
      updateItems: SaVSheetV2.onUpdateItems,
      updateBox: SaVSheetV2.onUpdateBox,
      openItem: SaVSheetV2.onOpenItem,
      deleteItem: SaVSheetV2.onDeleteItem,
      postItem: SaVSheetV2.onPostItem,
      toggleVisible: SaVSheetV2.onToggleVisible,
      rollAttribute: SaVSheetV2.onRollAttribute,
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.actor.system;
    context.actor = this.actor;
    context.items = this.actor.items;
    context.owner = this.actor.isOwner;
    context.editable = this.isEditable;
    context.isGM = game.user.isGM;
    // Root-level aliases so legacy templates that read {{name}}, {{_id}},
    // {{img}} continue to work without per-template rewrites.
    context._id = this.actor._id;
    context.id = this.actor.id;
    context.name = this.actor.name;
    context.img = this.actor.img;
    return context;
  }

  /**
   * Build the dialog HTML for adding items of `itemType` (preserves the v1
   * layout/styling so existing CSS keeps applying). Filters items by the
   * various class/system/limiter rules used in the v1 sheet.
   */
  _buildAddItemPopupContent(items, { itemType, limiter, inputType }) {
    let html = `<div class="scum-and-villainy" id="items-to-add">`;
    html += `<label class="label-stripe-gray flex-horizontal">`;
    if (itemType === "ability") {
      html += `<div class="flex one">${game.i18n.localize("BITD.StartAbility")}</div>`;
    }
    if (itemType === "ability" || itemType === "crew_ability") {
      html += `<div class="flex one">${game.i18n.localize("BITD.RecommAbility")}</div>`;
    }
    html += `<div class="flex ten">${game.i18n.localize(`BITD.${itemType}`)}</div>`;
    if (itemType === "item") {
      html += `<div class="flex one">${game.i18n.localize("BITD.Load")}</div>`;
    } else if (itemType === "crew_upgrade") {
      html += `<div class="flex one">${game.i18n.localize("BITD.Cost")}</div>`;
    }
    html += `<div class="flex one">${game.i18n.localize("BITD.Info")}</div>`;
    html += `</label>`;

    const main_systems = ["Engines", "Hull", "Comms", "Weapons"];
    const overloaded = {};

    if (this.actor.type === "ship") {
      main_systems.forEach((m) => {
        const actor_items = this.actor.items.filter(
          (i) => i.system.class === m,
        );
        const total = actor_items.length;
        const lower_m = m.toLowerCase();
        overloaded[m] =
          total >= this.actor.system.systems[lower_m].value ? 1 : 0;
      });
    }

    items.forEach((e) => {
      let addition_price_load = "";
      if (typeof e.system.load !== "undefined") {
        addition_price_load += `${e.system.load}`;
      } else if (typeof e.system.price !== "undefined") {
        addition_price_load += `${e.system.price}`;
      }

      const nonclass_upgrades = ["Auxiliary", "Gear", "Training", "Upgrades"];

      if (e.type === "crew_upgrade") {
        const cls = e.system.class;
        const properCls = cls.charAt(0).toUpperCase() + cls.slice(1);
        if (
          (main_systems.includes(cls) && overloaded[properCls] === 0) ||
          nonclass_upgrades.includes(cls) ||
          cls === this.actor.system.ship_class
        ) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one">${addition_price_load}</div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else if (e.type === "crew_ability") {
        if (e.system.class === this.actor.system.ship_class) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex one abilities"><input id="recommended-${e._id}" type="radio" disabled`;
          if (e.system.recommended) html += ` checked`;
          html += `><label for="recommended-${e._id}"></label></div>`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else if (e.type === "ability") {
        if (e.system.class === this.actor.system.character_class) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex one abilities"><input id="starting-${e._id}" type="radio" disabled`;
          if (e.system.starting) html += ` checked`;
          html += `><label for="starting-${e._id}"></label></div>`;
          html += `<div class="flex one abilities"><input id="recommended-${e._id}" type="radio" disabled`;
          if (e.system.recommended) html += ` checked`;
          html += `><label for="recommended-${e._id}"></label></div>`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else if (e.type === "item") {
        if (
          e.system.class === "Standard" ||
          (this.actor.system.stun_weapons === 1 &&
            e.system.class === "Non-Lethal") ||
          e.system.class === this.actor.system.character_class
        ) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one">${addition_price_load}</div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else if (e.type === "friend") {
        if (
          e.system.class === this.actor.system.character_class ||
          e.system.class === this.actor.system.ship_class
        ) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else if (e.type === "faction") {
        html += `<div class="flex-horizontal">`;
        html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
        html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
        html += `${game.i18n.localize(e.name)}</label></div>`;
        html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
        html += `</div></div>`;
      } else if (e.type === "planet") {
        if (e.system.system === limiter) {
          html += `<div class="flex-horizontal">`;
          html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
          html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
          html += `${game.i18n.localize(e.name)}</label></div>`;
          html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
          html += `</div></div>`;
        }
      } else {
        html += `<div class="flex-horizontal">`;
        html += `<div class="flex ten new-item"><input id="select-item-${e._id}" type="${inputType}" name="select_items" value="${e._id}">`;
        html += `<label class="flex-horizontal" for="select-item-${e._id}">`;
        html += `${game.i18n.localize(e.name)}</label></div>`;
        html += `<div class="flex one">${addition_price_load}</div>`;
        html += `<div class="flex one"><i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.description))}"></i>`;
        html += `</div></div>`;
      }
    });

    if (itemType === "ability") {
      html += `</div><br>${game.i18n.localize("BITD.AbilityLegend1")}<br>${game.i18n.localize("BITD.AbilityLegend2")}<br>`;
    } else if (itemType === "crew_ability") {
      html += `</div><br><br>${game.i18n.localize("BITD.AbilityLegend2")}<br>`;
    } else if (itemType === "crew_upgrade") {
      html += `</div>${game.i18n.localize("BITD.CrewAbilityLegend")}`;
    } else {
      html += `</div><br><br><br>`;
    }
    return html;
  }

  static async onAddItemPopup(event, target) {
    event.preventDefault();
    if (!this.actor.isOwner) return;

    const itemType = target.dataset.itemType;
    const limiter = target.dataset.limiter;
    const distinct = typeof target.dataset.distinct !== "undefined";
    const inputType = distinct ? "radio" : "checkbox";

    const items = await SaVHelpers.getAllItemsByType(itemType, game);
    const content = this._buildAddItemPopupContent(items, {
      itemType,
      limiter,
      inputType,
    });

    await DialogV2.wait({
      classes: ["scum-and-villainy"],
      window: {
        title: `${game.i18n.localize("BITD.Add")} ${game.i18n.localize(`BITD.${itemType}`)}`,
      },
      position: { width: 500, height: 600 },
      content,
      buttons: [
        {
          action: "add",
          icon: "fas fa-check",
          label: game.i18n.localize("BITD.Add"),
          default: true,
          callback: async (_ev, button) => {
            const checked = button.form.querySelectorAll(
              "div.new-item input:checked",
            );
            const ids = Array.from(checked).map((i) => i.value);
            const itemsToAdd = ids
              .map((id) => items.find((e) => e._id === id))
              .filter(Boolean);
            if (this.actor.isOwner && itemsToAdd.length) {
              await this.actor.createEmbeddedDocuments(
                "Item",
                itemsToAdd.map((i) => i.toObject()),
              );
            }
          },
        },
        {
          action: "cancel",
          icon: "fas fa-times",
          label: game.i18n.localize("BITD.Cancel"),
        },
      ],
      rejectClose: false,
    });
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

  static async onAddFlagPopup(event, target) {
    event.preventDefault();
    if (!this.actor.isOwner) return;

    const itemType = target.dataset.itemType;
    const distinct = typeof target.dataset.distinct !== "undefined";
    const inputType = distinct ? "radio" : "checkbox";

    const items = await SaVHelpers.getAllActorsByType(itemType, game);
    let html = `<div class="scum-and-villainy" id="items-to-add">`;
    items.forEach((e) => {
      if (e.type !== itemType) return;
      html += `<input id="select-item-${e.id}" type="${inputType}" name="select_items" value="${e.id}">`;
      html += `<label class="flex-horizontal" for="select-item-${e.id}">`;
      html += `${escapeAttr(game.i18n.localize(e.name))} <i class="fas fa-question-circle" data-tooltip="${escapeAttr(game.i18n.localize(e.system.designation ?? ""))}"></i>`;
      html += `</label>`;
    });
    html += `</div>`;

    await DialogV2.wait({
      classes: ["scum-and-villainy"],
      window: {
        title: `${game.i18n.localize("BITD.Add")} ${game.i18n.localize(`BITD.${SaVHelpers.getProperCase(itemType)}`)}`,
      },
      position: { width: 500, height: 400 },
      content: html,
      buttons: [
        {
          action: "add",
          icon: "fas fa-check",
          label: game.i18n.localize("BITD.Add"),
          default: true,
          callback: async (_ev, button) => {
            const checked = button.form.querySelectorAll("input:checked");
            const ids = Array.from(checked).map((i) => i.value);
            const itemsToAdd = ids
              .map((id) => items.find((e) => e.id === id))
              .filter(Boolean);
            if (this.actor.isOwner && itemsToAdd.length) {
              await this.actor.setFlag(
                "scum-and-villainy",
                itemType,
                itemsToAdd,
              );
            }
          },
        },
        {
          action: "cancel",
          icon: "fas fa-times",
          label: game.i18n.localize("BITD.Cancel"),
        },
      ],
      rejectClose: false,
    });
  }

  static async onRollAttribute(event, target) {
    event.preventDefault();
    const attribute_name = target.dataset.rollAttribute;
    const att_obj = game.model.Actor.character.attributes;
    const sys_obj = game.model.Actor.ship.systems;
    let systems = Object.keys(sys_obj);
    const resistance = Object.keys(att_obj);
    const remove = ["crew", "upkeep"];
    let actions = [];
    resistance.forEach((a) => {
      actions.push(Object.keys(att_obj[a].skills));
    });
    systems = systems.filter((system) => !remove.includes(system));
    actions.push(systems);
    actions = actions.flat();

    if (actions.includes(attribute_name)) {
      this.actor.rollActionPopup(attribute_name);
    } else {
      const roll_type = resistance.includes(attribute_name)
        ? "resistance"
        : attribute_name;
      this.actor.rollSimplePopup(attribute_name, roll_type);
    }
  }

  static async onUpdateItems(event, target) {
    event.preventDefault();
    const itemType = target.dataset.itemType;

    const world_items = await SaVHelpers.getAllItemsByType(itemType, game);
    const curr_items = this.actor.items.filter((i) => i.type === itemType);

    const add_items = world_items.filter(
      ({ name: n1 }) => !curr_items.some(({ name: n2 }) => n2 === n1),
    );
    const rem_items = curr_items.filter(
      ({ name: n1 }) => !world_items.some(({ name: n2 }) => n2 === n1),
    );
    const delete_ids = rem_items.map((i) => i.id);

    await this.actor.deleteEmbeddedDocuments("Item", delete_ids);
    await this.actor.createEmbeddedDocuments("Item", add_items);
  }

  static async onUpdateBox(event, target) {
    event.preventDefault();
    const item_id = target.dataset.item;
    const update_type = target.dataset.utype;
    let raw_value = target.dataset.value;
    if (raw_value === undefined) {
      raw_value = document.getElementById(
        `fac-${update_type}-${item_id}`,
      )?.value;
    }
    // V1 used jQuery's .data() which auto-coerced numeric strings; V2's
    // dataset is always string, so coerce explicitly for numeric fields.
    const numeric = parseInt(raw_value, 10);
    const update_value = Number.isNaN(numeric) ? raw_value : numeric;
    let update;

    switch (update_type) {
      case "heat":
        update = { _id: item_id, system: { heat: { value: update_value } } };
        break;
      case "wanted":
        update = { _id: item_id, system: { wanted: { value: update_value } } };
        break;
      case "status":
        update = { _id: item_id, system: { status: { value: update_value } } };
        break;
      case "jobs":
        update = { _id: item_id, system: { jobs: { value: update_value } } };
        break;
      case "is_damaged":
        update = { _id: item_id, system: { is_damaged: update_value } };
        break;
      default:
        console.log(
          `update attempted for type undefined in SaVSheetV2.onUpdateBox: ${update_type}`,
        );
        return;
    }

    await Item.updateDocuments([update], { parent: this.actor });
  }
}
