import { t } from "../app/i18n.js";

export function reportsPage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "reportsTitle")}</h2>
        <p>${t(lang, "reportsBody")}</p>
        <div class="subsection">
          <h4>${t(lang, "reportsResolveTitle")}</h4>
          <p>${t(lang, "reportsResolveBody")}</p>
        </div>
      </div>
    </section>
  `;
}
