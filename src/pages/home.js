import { t } from "../app/i18n.js";

export function homePage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="hero">
      <div class="hero-copy">
        <h1>${t(lang, "homeTitle")}</h1>
        <p>${t(lang, "homeBody")}</p>
        <div class="hero-actions">
          <button class="primary" data-action="go" data-go="/signup">
            ${t(lang, "homeCtaSignUp")}
          </button>
          <button class="ghost" data-action="go" data-go="/signin">
            ${t(lang, "homeCtaSignIn")}
          </button>
          <button class="ghost" data-action="go" data-go="/demo">
            ${t(lang, "homeCtaExplore")}
          </button>
        </div>
        <div class="hero-note">
          ${t(lang, "homeNote")}
        </div>
      </div>
      <div class="hero-panel">
        <div class="hero-card">
          <h3>${t(lang, "heroConnectionsTitle")}</h3>
          <p>${t(lang, "heroConnectionsBody")}</p>
        </div>
        <div class="hero-card">
          <h3>${t(lang, "heroSafetyTitle")}</h3>
          <p>${t(lang, "heroSafetyBody")}</p>
          <ul class="list">
            <li>${t(lang, "heroSafetyTip1")}</li>
            <li>${t(lang, "heroSafetyTip2")}</li>
            <li>${t(lang, "heroSafetyTip3")}</li>
          </ul>
        </div>
        <div class="hero-card">
          <h3>${t(lang, "heroRulesTitle")}</h3>
          <p>${t(lang, "heroRulesBody")}</p>
        </div>
      </div>
    </section>
  `;
}
