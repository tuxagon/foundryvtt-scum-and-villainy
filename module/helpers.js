// Pure helpers. No reads of game, CONFIG, Hooks, canvas, ui, ChatMessage or
// other Foundry globals — everything is passed in. Safe to unit-test under
// vitest without a running Foundry.

/**
 * Identify embedded items on `actor` that should be removed because the
 * incoming `item_data` would duplicate them. "Distinct" types are unique by
 * type (only one allowed); other types are unique by name.
 *
 * @param {{ _id?: string, name: string, type: string }} item_data
 * @param {{ items: Iterable<{ id: string, name: string, type: string }> }} actor
 * @returns {string[]} ids of embedded items to delete
 */
export function removeDuplicatedItemType(item_data, actor) {
  const dupe_list = [];
  const distinct_types = [
    "crew_reputation",
    "class",
    "background",
    "vice",
    "heritage",
    "ship_size",
    "crew_type",
  ];
  const allowed_types = ["item"];
  const should_be_distinct = distinct_types.includes(item_data.type);

  actor.items.forEach((i) => {
    const has_double = item_data.type === i.type;
    if (
      (i.name === item_data.name || (should_be_distinct && has_double)) &&
      !allowed_types.includes(item_data.type) &&
      item_data._id !== i.id
    ) {
      dupe_list.push(i.id);
    }
  });

  return dupe_list;
}

/**
 * Walk a dotted property path on a plain object.
 *
 * @param {object} obj
 * @param {string} property dotted path like "system.loadout.heavy"
 */
export function getNestedProperty(obj, property) {
  return property.split(".").reduce((r, e) => r[e], obj);
}

/**
 * Capitalize the first character, lowercase the rest.
 *
 * @param {string} name
 * @returns {string}
 */
export function getProperCase(name) {
  return name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
}

/**
 * Render `<option>` markup for a clock-size select.
 *
 * @param {number[]} sizes available clock sizes
 * @param {number} default_size size to mark selected when current is falsy
 * @param {number} current_size currently-selected size (overrides default)
 * @returns {string} html string ready for `{{{ }}}` in Handlebars
 */
export function createListOfClockSizes(sizes, default_size, current_size) {
  let text = "";
  sizes.forEach((size) => {
    text += `<option value="${size}"`;
    if (!current_size && size === default_size) {
      text += " selected";
    } else if (size === current_size) {
      text += " selected";
    }
    text += `>${size}</option>`;
  });
  return text;
}
