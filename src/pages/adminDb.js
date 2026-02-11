import { t } from "../app/i18n.js";

export function adminDbPage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "adminDbTitle")}</h2>
        <p>${t(lang, "adminDbBody")}</p>
      </div>
    </section>
  `;
}
