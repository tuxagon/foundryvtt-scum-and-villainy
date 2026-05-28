import { SaVClock } from "./sav-clock.js";
import { error, log } from "./sav-clock-util.js";
import { getSystemMapping } from "./systems/index.js";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const DISPLAY_NAME = {
  ALWAYS_FOR_EVERYONE: 50,
};
const DISPOSITION = {
  NEUTRAL: 0,
};
const DEFAULT_TOKEN = {
  disposition: DISPOSITION.NEUTRAL,
  displayName: DISPLAY_NAME.ALWAYS_FOR_EVERYONE,
  actorLink: true,
};

export class SaVClockSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["scum-and-villainy", "sheet", "actor", "clock"],
    position: { width: 400, height: 460 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {},
  };

  static PARTS = {
    body: {
      template: "systems/scum-and-villainy/templates/sav-clock-sheet.html",
    },
  };

  _clockSystem;

  get clockSystem() {
    this._clockSystem ??= getSystemMapping(game.system.id);
    return this._clockSystem;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const clock = new SaVClock(
      this.clockSystem.loadClockFromActor({ actor: this.actor }),
    );
    const sizesObject = {};
    SaVClock.sizes.forEach((item) => {
      sizesObject[item] = String(item);
    });
    const themesObject = {};
    SaVClock.themes.forEach((item) => {
      themesObject[item] = String(item);
    });
    context.actor = this.actor;
    context.editable = this.isEditable;
    context.clock = {
      progress: clock.progress,
      size: String(clock.size),
      theme: clock.theme,
      image: {
        url: clock.image.texture.src,
        width: clock.image.widthSheet,
        height: clock.image.heightSheet,
      },
      settings: {
        sizes: sizesObject,
        themes: themesObject,
      },
      flags: clock.flags,
    };
    return context;
  }

  async _processSubmitData(_event, _form, submitData) {
    const oldClock = new SaVClock(
      this.clockSystem.loadClockFromActor({ actor: this.actor }),
    );
    const newFlags = submitData?.flags?.["scum-and-villainy"]?.clocks ?? {};
    const newClock = new SaVClock({
      progress: parseInt(newFlags.progress ?? oldClock.progress, 10),
      size: newFlags.size ?? oldClock.size,
      theme: newFlags.theme ?? oldClock.theme,
    });

    submitData.img = newClock.image.texture.src;
    submitData.prototypeToken = {
      texture: { src: newClock.image.texture.src },
      ...DEFAULT_TOKEN,
    };

    await this.actor.update(submitData);

    const tokens = this.actor.getActiveTokens();
    if (tokens.length !== 0) {
      const updates = tokens.map((t) => ({
        _id: t.id,
        name: this.actor.name,
        texture: { src: newClock.image.texture.src },
        actorLink: true,
      }));
      await TokenDocument.updateDocuments(updates, {
        parent: game.scenes.current,
        animate: false,
        animation: { duration: 0 },
      });
    }
  }
}

export default {
  renderTokenHUD: async (_hud, html, token) => {
    log("Render");
    let _t = canvas.tokens.get(token.id);
    const a = game.actors.get(token.actorId);

    if (!a?.flags["scum-and-villainy"]?.clocks) {
      return false;
    }

    const button1HTML = await foundry.applications.handlebars.renderTemplate(
      "systems/scum-and-villainy/templates/sav-clock-button1.html",
    );
    const button2HTML = await foundry.applications.handlebars.renderTemplate(
      "systems/scum-and-villainy/templates/sav-clock-button2.html",
    );

    html.querySelector("div.left").insertAdjacentHTML("beforeend", button1HTML);
    html.querySelector("div.left").addEventListener("click", async (event) => {
      log("HUD Clicked");
      _t = canvas.tokens.get(token.id);

      const oldClock = new SaVClock(a.flags["scum-and-villainy"]?.clocks);
      let newClock;

      const target = event.target.classList.contains("control-icon")
        ? event.target
        : event.target.parentElement;
      if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if (target.classList.contains("progress-up")) {
        newClock = oldClock.increment();
      } else if (target.classList.contains("progress-down")) {
        newClock = oldClock.decrement();
      } else if (target.dataset.action) {
        return;
      } else {
        return error("ERROR: Unknown TokenHUD Button");
      }

      const persistObj = {
        flags: {
          "scum-and-villainy": {
            clocks: {
              progress: newClock.progress,
              size: newClock.size,
              theme: newClock.theme,
            },
          },
        },
      };

      const visualObj = {
        img: newClock.image.texture.src,
        prototypeToken: {
          texture: { src: newClock.image.texture.src },
          ...DEFAULT_TOKEN,
        },
      };

      const newObj = foundry.utils.mergeObject(visualObj, persistObj);
      let tokenObj = {};
      let update = [];
      update.push(foundry.utils.mergeObject({ _id: a.id }, newObj));
      await Actor.updateDocuments(update);
      update = [];
      const tokens = a.getActiveTokens();
      if (tokens.length !== 0) {
        for (const t of tokens) {
          tokenObj = {
            _id: t.id,
            name: a.name,
            texture: { src: newClock.image.texture.src },
            flags: newClock.flags,
            actorLink: true,
          };
          update.push(tokenObj);
        }
        await TokenDocument.updateDocuments(update, {
          parent: game.scenes.current,
          animate: false,
          animation: { duration: 0 },
        });
      }
    });

    html
      .querySelector("div.right")
      .insertAdjacentHTML("beforeend", button2HTML);
    html.querySelector("div.right").addEventListener("click", async (event) => {
      log("HUD Clicked");
      _t = canvas.tokens.get(token.id);

      const oldClock = new SaVClock(a.flags["scum-and-villainy"]?.clocks);
      let newClock;

      const target = event.target.classList.contains("control-icon")
        ? event.target
        : event.target.parentElement;
      if (target.classList.contains("cycle-size")) {
        newClock = oldClock.cycleSize();
      } else if (target.classList.contains("cycle-theme")) {
        newClock = oldClock.cycleTheme();
      } else if (target.classList.contains("progress-up")) {
        newClock = oldClock.increment();
      } else if (target.classList.contains("progress-down")) {
        newClock = oldClock.decrement();
      } else if (target.dataset.action) {
        return;
      } else {
        return error("ERROR: Unknown TokenHUD Button");
      }

      const persistObj = {
        flags: {
          "scum-and-villainy": {
            clocks: {
              progress: newClock.progress,
              size: newClock.size,
              theme: newClock.theme,
            },
          },
        },
      };

      const visualObj = {
        img: newClock.image.texture.src,
        prototypeToken: {
          texture: { src: newClock.image.texture.src },
          ...DEFAULT_TOKEN,
        },
      };

      const newObj = foundry.utils.mergeObject(visualObj, persistObj);
      let tokenObj = {};
      let update = [];
      update.push(foundry.utils.mergeObject({ _id: a.id }, newObj));
      await Actor.updateDocuments(update);

      update = [];
      const tokens = a.getActiveTokens();
      if (tokens.length !== 0) {
        for (const t of tokens) {
          tokenObj = {
            _id: t.id,
            name: a.name,
            texture: { src: newClock.image.texture.src },
            flags: newClock.flags,
            actorLink: true,
          };
          update.push(tokenObj);
        }
        await TokenDocument.updateDocuments(update, {
          parent: game.scenes.current,
          animate: false,
          animation: { duration: 0 },
        });
      }
    });
    return true;
  },
};
