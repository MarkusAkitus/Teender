import { t } from "../app/i18n.js";

export function matchesManagePage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "matchesManageTitle")}</h2>
        <p>${t(lang, "matchesManageBody")}</p>
      </div>
    </section>
  `;
}
