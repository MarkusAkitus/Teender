import { t } from "../app/i18n.js";

export function settingsPage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "settingsTitle")}</h2>
        <p>${t(lang, "settingsBody")}</p>
      </div>
    </section>
  `;
}
