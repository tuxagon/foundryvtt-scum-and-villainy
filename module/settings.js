import { refreshAllClockSurfaces } from "./clocks/sav-clock-refresh.js";
import {
  BACKGROUND_STYLES,
  DEFAULT_BACKGROUND_STYLE,
  DEFAULT_RENDER_STYLE,
  DEFAULT_TONE,
  RENDER_STYLES,
  SETTING_BACKGROUND_STYLE,
  SETTING_RENDER_STYLE,
  SETTING_TONE,
  TONES,
} from "./clocks/sav-clock-adapter.js";

export const registerSystemSettings = function() {

  /**
   * Track the system version upon which point a migration was last applied
   */
  game.settings.register("scum-and-villainy", "systemMigrationVersion", {
    name: "System Migration Version",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  game.settings.register("scum-and-villainy", "defaultClockTheme", {
    name: "BITD.ClockSettingDefaultTheme",
    hint: "BITD.ClockSettingDefaultThemeHint",
    scope: "world",
    config: true,
    type: Number,
    choices: game.system.savclocks.themes,
	  default: 0,
	  icon: "fas fa-palette"
  });

  game.settings.register("scum-and-villainy", SETTING_RENDER_STYLE, {
    name: "BITD.ClockRenderStyle",
    hint: "BITD.ClockRenderStyleHint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [RENDER_STYLES.rough]: "BITD.ClockRenderStyleRough",
      [RENDER_STYLES.clean]: "BITD.ClockRenderStyleClean",
    },
    default: DEFAULT_RENDER_STYLE,
    onChange: () => refreshAllClockSurfaces(),
  });

  game.settings.register("scum-and-villainy", SETTING_TONE, {
    name: "BITD.ClockTone",
    hint: "BITD.ClockToneHint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [TONES.light]: "BITD.ClockToneLight",
      [TONES.dark]: "BITD.ClockToneDark",
    },
    default: DEFAULT_TONE,
    onChange: () => refreshAllClockSurfaces(),
  });

  game.settings.register("scum-and-villainy", SETTING_BACKGROUND_STYLE, {
    name: "BITD.ClockBackgroundStyle",
    hint: "BITD.ClockBackgroundStyleHint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      [BACKGROUND_STYLES.transparent]: "BITD.ClockBackgroundTransparent",
      [BACKGROUND_STYLES.solid]: "BITD.ClockBackgroundSolid",
    },
    default: DEFAULT_BACKGROUND_STYLE,
    onChange: () => refreshAllClockSurfaces(),
  });

  game.settings.register("scum-and-villainy", "defaultAttributeXPBarSize", {
    name: "BITD.AttributeXPBarSize",
    hint: "BITD.AttributeXPBarSizeHint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 12,
      step: 1
    },
    default: 6
  });

  game.settings.register("scum-and-villainy", "defaultPlaybookXPBarSize", {
    name: "BITD.PlaybookXPBarSize",
    hint: "BITD.PlaybookXPBarSizeHint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 12,
      step: 1
    },
    default: 8
  });

  game.settings.register("scum-and-villainy", "defaultCrewXPBarSize", {
    name: "BITD.CrewXPBarSize",
    hint: "BITD.CrewXPBarSizeHint",
    scope: "world",
    config: true,
    type: Number,
    range: {
      min: 1,
      max: 12,
      step: 1
    },
    default: 8
  });

  game.settings.register("scum-and-villainy", "logResourceToChat", {
    name: "BITD.LogResourceToChat",
    hint: "BITD.LogResourceToChatHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register("scum-and-villainy", "useDropdownsInRollDialog", {
    name: "BITD.UseDropdownsInRollDialog",
    hint: "BITD.UseDropdownsInRollDialogHint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register("scum-and-villainy", "exposeActorName", {
    name: "BITD.ExposeActorName",
    hint: "BITD.ExposeActorNameHint",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });
};
