import { t } from "../app/i18n.js";

export function contentModeratePage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "contentModerateTitle")}</h2>
        <p>${t(lang, "contentModerateBody")}</p>
      </div>
    </section>
  `;
}
