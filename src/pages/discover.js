import { profileCard } from "../components/profileCard.js";
import { emptyState } from "../components/emptyState.js";
import { t } from "../app/i18n.js";

function nextProfile(state) {
  return state.profiles.find(
    (profile) =>
      !state.likes.includes(profile.id) && !state.passes.includes(profile.id)
  );
}

export function discoverPage(state) {
  const lang = state.ui.lang || "es";
  const profile = nextProfile(state);
  if (!profile) {
    return emptyState(
      t(lang, "emptySeenTitle"),
      t(lang, "emptySeenBody"),
      t(lang, "emptyGoFriends"),
      "/matches"
    );
  }

  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "discoverTitle")}</h2>
        ${profileCard(profile)}
        <div class="actions">
          <button class="ghost" data-action="pass" data-profile="${profile.id}">
            ${t(lang, "discoverPass")}
          </button>
          <button class="primary" data-action="like" data-profile="${profile.id}">
            ${t(lang, "discoverLike")}
          </button>
        </div>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "discoverTipTitle")}</h3>
        <p>${t(lang, "discoverTipBody")}</p>
        <div class="tip">"${t(lang, "discoverTipExample", { interest: profile.interests[0] || t(lang, "discoverDefaultInterest") })}"</div>
      </aside>
    </section>
  `;
}
