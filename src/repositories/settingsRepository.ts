import { THEMES, TR } from "../config/gameDesignToolConfig";
import { LS_KEYS, lsGet, lsSet } from "../services/localStorage";

export type LangKey = keyof typeof TR;
export type ThemeKey = keyof typeof THEMES;

export type SettingsSnapshot = {
  lang: string;
  theme: string;
};

export type SettingsRepository = {
  loadSettings(): Promise<SettingsSnapshot>;
  saveSettings(settings: SettingsSnapshot): Promise<void>;
};

export function getStoredLang(fallback: LangKey): LangKey {
  return lsGet(LS_KEYS.lang, fallback) as LangKey;
}

export function saveStoredLang(lang: LangKey): void {
  lsSet(LS_KEYS.lang, lang);
}

export function getStoredTheme(fallback: ThemeKey): ThemeKey {
  return lsGet(LS_KEYS.theme, fallback) as ThemeKey;
}

export function saveStoredTheme(theme: ThemeKey): void {
  lsSet(LS_KEYS.theme, theme);
}

export const localSettingsRepository: SettingsRepository = {
  async loadSettings() {
    return {
      lang: getStoredLang("pt"),
      theme: getStoredTheme("dark"),
    };
  },

  async saveSettings(settings) {
    saveStoredLang(settings.lang as LangKey);
    saveStoredTheme(settings.theme as ThemeKey);
  },
};
