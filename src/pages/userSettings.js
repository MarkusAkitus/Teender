import { t, languages } from "../app/i18n.js";

export function userSettingsPage(state) {
  const lang = state.ui.lang || "es";
  const settings = state.me?.settings || {};
  const tab = state.ui.userSettingsTab || "privacy";
  const langOptions = languages
    .map(
      (item) =>
        `<option value="${item.code}" ${item.code === lang ? "selected" : ""}>${item.label}</option>`
    )
    .join("");

  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "settingsUserTitle")}</h2>
        <p>${t(lang, "settingsUserBody")}</p>
        <div class="admin-tabs">
          <button class="ghost" data-action="settingsTab" data-tab="account">${t(lang, "settingsAccount")}</button>
          <button class="ghost" data-action="settingsTab" data-tab="privacy">${t(lang, "settingsPrivacy")}</button>
          <button class="ghost" data-action="settingsTab" data-tab="notifications">${t(lang, "settingsNotifications")}</button>
          <button class="ghost" data-action="settingsTab" data-tab="appearance">${t(lang, "settingsAppearance")}</button>
          <button class="ghost" data-action="settingsTab" data-tab="security">${t(lang, "settingsSecurity")}</button>
          <button class="ghost" data-action="settingsTab" data-tab="language">${t(lang, "settingsLanguage")}</button>
        </div>
        <form class="form" data-form="userSettings">
          ${tab === "account" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsAccount")}</h5>
            <label class="toggle-row">
              <span>${t(lang, "settingsShowOnline")}</span>
              <input name="settings.showOnline" type="checkbox" ${settings.showOnline ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsShowAge")}</span>
              <input name="settings.showAge" type="checkbox" ${settings.showAge ? "checked" : ""} />
            </label>
          </div>
          ` : ""}
          ${tab === "privacy" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsPrivacy")}</h5>
            <label class="toggle-row">
              <span>${t(lang, "settingsShowCity")}</span>
              <input name="settings.showCity" type="checkbox" ${settings.showCity ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsShowInterests")}</span>
              <input name="settings.showInterests" type="checkbox" ${settings.showInterests ? "checked" : ""} />
            </label>
          </div>
          ` : ""}
          ${tab === "notifications" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsNotifications")}</h5>
            <label class="toggle-row">
              <span>${t(lang, "settingsNotifyMatches")}</span>
              <input name="settings.notifyMatches" type="checkbox" ${settings.notifyMatches ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsNotifyMessages")}</span>
              <input name="settings.notifyMessages" type="checkbox" ${settings.notifyMessages ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsNotifyContact")}</span>
              <input name="settings.notifyContact" type="checkbox" ${settings.notifyContact ? "checked" : ""} />
            </label>
          </div>
          ` : ""}
          ${tab === "appearance" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsAppearance")}</h5>
            <label class="toggle-row">
              <span>${t(lang, "settingsCompactMode")}</span>
              <input name="settings.compactMode" type="checkbox" ${settings.compactMode ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsLargeText")}</span>
              <input name="settings.largeText" type="checkbox" ${settings.largeText ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsDarkMode")}</span>
              <input name="settings.darkMode" type="checkbox" ${settings.darkMode ? "checked" : ""} />
            </label>
          </div>
          ` : ""}
          ${tab === "security" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsSecurity")}</h5>
            <label class="toggle-row">
              <span>${t(lang, "settingsAutoBlock")}</span>
              <input name="settings.autoBlock" type="checkbox" ${settings.autoBlock ? "checked" : ""} />
            </label>
            <label class="toggle-row">
              <span>${t(lang, "settingsHideSensitive")}</span>
              <input name="settings.hideSensitive" type="checkbox" ${settings.hideSensitive ? "checked" : ""} />
            </label>
          </div>
          ` : ""}
          ${tab === "language" ? `
          <div class="settings-section">
            <h5>${t(lang, "settingsLanguage")}</h5>
            <label>
              ${t(lang, "settingsLanguage")}
              <select name="settings.language">
                ${langOptions}
              </select>
            </label>
          </div>
          ` : ""}
          <button class="primary" type="submit">${t(lang, "profileSave")}</button>
        </form>
      </div>
    </section>
  `;
}
