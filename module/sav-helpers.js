import * as pure from "./helpers.js";

export class SaVHelpers {
  // Pure helpers delegate to module/helpers.js (no globals reached). Kept on
  // the class for backwards compat with existing `SaVHelpers.xxx` call sites.
  static removeDuplicatedItemType = pure.removeDuplicatedItemType;
  static getNestedProperty = pure.getNestedProperty;
  static getProperCase = pure.getProperCase;
  static createListOfClockSizes = pure.createListOfClockSizes;

  /**
   * Adds default abilities when class is chosen for character
   *
   * @param {Object} item_data
   * @param {Document} actor
   */
  static async addDefaultAbilities(item_data, actor) {
    const def_abilities = item_data.system.def_abilities || {};

    const abil_list = def_abilities.split(", ");
    let item_type = "";
    const items_to_add = [];

    if (actor.type === "character") {
      item_type = "ability";
    } else if (actor.type === "ship") {
      item_type = "crew_upgrade";
    }

    const abilities = actor.items
      .filter((a) => a.type === item_type)
      .map((e) => {
        return e.name;
      });

    if (actor.type === "ship") {
      const size = actor.items
        .filter((a) => a.type === "ship_size")
        .map((e) => {
          return e.name;
        }) || [""];
      if (size.length > 0) {
        abilities.push(size);
      }
    }

    const friends = actor.items
      .filter((a) => a.type === "friend")
      .map((e) => {
        return e.name;
      }) || [""];
    if (friends.length > 0) {
      abilities.push(friends);
    }

    const items = await SaVHelpers.getAllItemsByType(item_type, game);

    if (actor.type === "ship") {
      const all_sizes = await SaVHelpers.getAllItemsByType("ship_size", game);
      all_sizes.forEach((s) => {
        items.push(s);
      });
    }

    const all_friends = await SaVHelpers.getAllItemsByType("friend", game);
    all_friends.forEach((s) => {
      items.push(s);
    });

    const trim_abil_list = abil_list.filter((x) => !abilities.includes(x));
    trim_abil_list.forEach((i) => {
      items_to_add.push(items.find((e) => e.name === i));
    });

    actor.createEmbeddedDocuments("Item", items_to_add);
  }

  /**
   * Add item functionality
   */
  static _addOwnedItem(event, actor) {
    event.preventDefault();
    const a = event.currentTarget;
    const item_type = a.dataset.itemType;

    const data = {
      name: randomID(),
      type: item_type,
    };

    return actor.createEmbeddedDocuments("Item", [data]);
  }

  /**
   * Get the list of all available ingame items by Type.
   *
   * @param {string} item_type
   * @param {Object} game
   */
  static async getAllItemsByType(item_type, game) {
    const game_items =
      game.items
        .filter((e) => e.type === item_type)
        .map((e) => {
          return e;
        }) || [];
    const pack = game.packs.find((e) => e.metadata.name === item_type);
    if (!pack) {
      ui.notifications.error(
        `Compendium pack "${item_type}" not found or not accessible.`,
      );
    }
    const compendium_content = pack ? await pack.getDocuments() : [];

    let compendium_items =
      compendium_content.map((k) => {
        return k;
      }) || [];
    compendium_items = compendium_items.filter(
      (a) =>
        game_items.filter((b) => a.name === b.name && a.name === b.name)
          .length === 0,
    );

    const list_of_items = game_items.concat(compendium_items) || [];
    list_of_items.sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }
      return 0;
    });

    return list_of_items;
  }
  /* -------------------------------------------- */

  static async getAllActorsByType(item_type, game) {
    const actors =
      game.actors
        .filter((e) => e.type === item_type)
        .map((e) => {
          return e;
        }) || [];
    const addId = actors.map((a) => ({ ...a, id: a._id }));
    return addId;
  }

  /* -------------------------------------------- */
  /**
   * Returns the label for attribute.
   *
   * @param {string} attribute_name
   * @returns {string}
   */
  static getAttributeLabel(attribute_name) {
    // Calculate Dice to throw.
    const attribute_labels = {};
    let attributes = {};

    // There has to be a better way to to do this
    // @todo - pull skill list dynamically
    const skills = [
      "insight",
      "doctor",
      "hack",
      "rig",
      "study",
      "prowess",
      "helm",
      "scramble",
      "scrap",
      "skulk",
      "resolve",
      "attune",
      "command",
      "consort",
      "sway",
    ];
    const systems = [
      "crew",
      "upkeep",
      "engines",
      "comms",
      "weapons",
      "hull",
      "shields",
      "encryptor",
    ];

    if (skills.indexOf(attribute_name) !== -1) {
      attributes = game.model.Actor.character.attributes;
    } else if (systems.indexOf(attribute_name) !== -1) {
      attributes = game.model.Actor.ship.systems;
    } else {
      return game.i18n.localize(
        `BITD.${SaVHelpers.getProperCase(attribute_name)}`,
      );
    }

    for (const a in attributes) {
      attribute_labels[a] = attributes[a].label;
      for (const skill_name in attributes[a].skills) {
        attribute_labels[skill_name] = attributes[a].skills[skill_name].label;
      }
    }

    return attribute_labels[attribute_name];
  }

  /* -------------------------------------------- */

  /**
   * Creates a chat notification on a resource change
   *
   * @param {string} actor
   *  actor on which change occurred
   * @param {string} resource
   *  localized resource name
   * @param {int} oldValue
   *  original resource value
   * @param {int} newValue
   *  new resource value
   */
  static chatNotify(actor, resource, oldValue, newValue) {
    let change;
    if (newValue > oldValue) {
      change = `+${String(newValue - oldValue)}`;
    } else {
      change = String(newValue - oldValue);
    }
    const color = newValue >= oldValue ? "green" : "red";
    const message = `<div class="resource-chat-notification">${actor}<table><tr><td>${resource}</td><td class="value">${oldValue}</td><td class="arrow"><i class="fas fa-arrow-right"></i></td><td class="value"><span class="${color}">${newValue}</span></td><td><span class="small">(${change})</span></td></tr></table></div>`;
    ChatMessage.create({ content: message });
  }

  /* -------------------------------------------- */

  /**
   * Creates a chat notification on a resource change
   *
   * @param {string} actor
   *  actor on which change occurred
   * @param {string} resource
   *  localized resource name
   */
  static chatNotifyString(actor, resource) {
    const message = `<div class="resource-chat-notification">${actor}<table><tr><td>${resource}</td></tr></table></div>`;
    ChatMessage.create({ content: message });
  }

  /* -------------------------------------------- */

  /**
   * Creates a Tile on a canvas
   *
   * @param {Object} canvas
   *  canvas Object where the Tile should be created
   * @param {Object} data
   *  data describing Tile to be created
   */
  static async createTile(canvas, data) {
    if (data.type === "Item") {
      const sourceData = await fromUuid(data.uuid);
      if (sourceData.type === "planet" || sourceData.type === "star_system") {
        const tileImg = sourceData.img.replace(/webp/g, "webm");

        try {
          const t = await foundry.canvas.loadTexture(tileImg);
          const tileData = {
            texture: { src: tileImg },
            width: t.width,
            height: t.height,
            x: data.x,
            y: data.y,
          };

          await canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        } catch (_error) {
          ui.notifications.warn(
            "Error creating Tile, there needs to exist a WEBM file with the same filename and location as the Item img WEBP",
          );
        }
      }
    }
  }

  /* -------------------------------------------- */

  /**
   * Gets files from a specified directory matching the target
   *
   * @param {string} target
   *  target variable to pass to FilePicker.browse()
   * @param {string[]} extensions
   *  data describing Tile to be created
   * @param {Boolean} wildcard
   *
   * @param {string} source
   *  source variable to pass to FilePicker.browse()
   */
  static async getFiles(target, extensions, wildcard = false, source = "user") {
    extensions = Array.isArray(extensions) ? extensions : [extensions];
    const options = { extensions: extensions, wildcard: wildcard };
    const filePicker = await FilePicker.browse(source, target, options);
    if (filePicker.files) return [...filePicker.files];
    return [];
  }
}
