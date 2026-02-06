import { t, languages } from "../app/i18n.js";

export function userSettingsPage(state) {
  const lang = state.ui.lang || "es";
  const settings = state.me?.settings || {};
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
        <form class="form" data-form="userSettings">
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
            <label class="toggle-row">
              <span>${t(lang, "settingsContactMutual")}</span>
              <input name="settings.contactMutual" type="checkbox" ${settings.contactMutual ? "checked" : ""} />
            </label>
          </div>
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
          </div>
          <div class="settings-section">
            <h5>${t(lang, "settingsLanguage")}</h5>
            <label>
              ${t(lang, "settingsLanguage")}
              <select name="settings.language">
                ${langOptions}
              </select>
            </label>
          </div>
          <button class="primary" type="submit">${t(lang, "profileSave")}</button>
        </form>
      </div>
    </section>
  `;
}
