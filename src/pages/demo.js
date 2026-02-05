import { profileCard } from "../components/profileCard.js";
import { emptyState } from "../components/emptyState.js";
import { t } from "../app/i18n.js";

function demoProfile(lang) {
  const interests =
    lang === "en"
      ? ["music", "sports", "movies"]
      : lang === "ca"
        ? ["musica", "esport", "cinema"]
        : ["musica", "deporte", "cine"];
  return {
    id: "demo-1",
    name: "Riley",
    age: 16,
    city: lang === "en" ? "Demo City" : lang === "ca" ? "Ciutat demo" : "Ciudad demo",
    bio:
      lang === "en"
        ? "Fictional profile to show how the app looks."
        : lang === "ca"
          ? "Perfil fictici per mostrar com es veu l'app."
          : "Perfil ficticio para mostrar como se ve la app.",
    interests,
    vibe: "Chill",
    color: "linear-gradient(135deg, #ff8a65, #4dd0e1)",
  };
}

export function demoPage(state) {
  const lang = state.ui.lang || "es";
  const profile = demoProfile(lang);

  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "demoTitle")}</h2>
        <p>${t(lang, "demoBody")}</p>
        ${profileCard(profile)}
        <div class="actions">
          <button class="ghost" data-action="go" data-go="/signin">${t(lang, "navSignIn")}</button>
          <button class="primary" data-action="go" data-go="/signup">${t(lang, "demoCta")}</button>
        </div>
      </div>
      <aside class="panel soft">
        ${emptyState(t(lang, "discoverTitle"), t(lang, "discoverTipBody"), t(lang, "homeCtaSignUp"), "/signup")}
      </aside>
    </section>
  `;
}
