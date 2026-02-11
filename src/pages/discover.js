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
  const activeProfile =
    state.ui.activeProfileId &&
    state.profiles.find((item) => item.id === state.ui.activeProfileId);
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
        <div data-action="openProfile" data-profile="${profile.id}">
          ${profileCard(profile)}
        </div>
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
      ${
        activeProfile
          ? `
      <div class="profile-modal" data-action="closeProfile">
        <div class="profile-modal-content" data-action="noop">
          <button class="ghost close-button" data-action="closeProfile">×</button>
          <div class="profile-hero">
            <div class="profile-cover" style="background: ${activeProfile.color}">
              ${
                activeProfile.avatarUrl
                  ? `<img src="${activeProfile.avatarUrl}" alt="${activeProfile.name}" />`
                  : `<span>${activeProfile.name[0]}</span>`
              }
            </div>
            <div class="profile-info">
              <h2>${activeProfile.name}, ${activeProfile.age}</h2>
              <p class="muted">${activeProfile.city}</p>
              <p>${activeProfile.bio}</p>
              <div class="tag-list">
                ${activeProfile.interests.map((item) => `<span class="tag">${item}</span>`).join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
      `
          : ""
      }
    </section>
  `;
}
