import { emptyState } from "../components/emptyState.js";
import { t } from "../app/i18n.js";

function contactBlock(title, contact, lang) {
  if (!contact) return "";
  return `
    <div class="contact-card">
      <h5>${title}</h5>
      <p><strong>${t(lang, "contactEmail")}:</strong> ${contact.email || "-"}</p>
      <p><strong>${t(lang, "contactInstagram")}:</strong> ${contact.instagram || "-"}</p>
    </div>
  `;
}

function friendCard(match, state) {
  const profile = state.profiles.find((item) => item.id === match.profileId);
  if (!profile) return "";
  const lang = state.ui.lang || "es";
  const reveal = match.contactReveal || { me: false, them: false };
  const canShowContact = reveal.me && reveal.them;
  const intro = match.introMessage;
  return `
    <article class="match-card">
      <div class="match-avatar" style="background: ${profile.color}">
        ${profile.name.slice(0, 1)}
      </div>
      <div class="match-body">
        <h4>${profile.name}</h4>
        <p>${match.lastMessage}</p>
        ${
          intro
            ? `
          <div class="intro-status">
            <span>${t(lang, "introSent", { text: intro.text })}</span>
            <span class="muted">${intro.time}</span>
          </div>
          <p class="muted">
            ${reveal.them ? t(lang, "introAccepted") : t(lang, "introWaiting")}
          </p>
          <button class="ghost" data-action="revealContact" data-match="${match.id}" ${
            reveal.me ? "disabled" : ""
          }>
            ${reveal.me ? t(lang, "revealDone") : t(lang, "revealButton")}
          </button>
        `
            : `
          <form class="intro-form" data-form="introMessage">
            <input type="hidden" name="matchId" value="${match.id}" />
            <input name="message" type="text" placeholder="${t(lang, "introPlaceholder")}" required />
            <button class="primary" type="submit">${t(lang, "chatSend")}</button>
          </form>
          <p class="muted">${t(lang, "introHint")}</p>
        `
        }
        ${
          canShowContact
            ? `
          <div class="contact-grid">
            ${contactBlock(t(lang, "contactMine"), state.me && state.me.contact, lang)}
            ${contactBlock(t(lang, "contactTheirs"), profile.contact, lang)}
          </div>
        `
            : ""
        }
      </div>
      <span class="match-time">${new Date(match.updatedAt).toLocaleDateString(lang)}</span>
    </article>
  `;
}

export function matchesPage(state) {
  const lang = state.ui.lang || "es";
  if (!state.matches.length) {
    return emptyState(
      t(lang, "friendsEmptyTitle"),
      t(lang, "friendsEmptyBody"),
      t(lang, "navDiscover"),
      "/discover"
    );
  }

  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "friendsTitle")}</h2>
        <div class="match-list">
          ${state.matches.map((match) => friendCard(match, state)).join("")}
        </div>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "friendsAsideTitle")}</h3>
        <p>${t(lang, "friendsAsideBody")}</p>
        <button class="ghost" data-action="go" data-go="/discover">${t(lang, "friendsAsideCta")}</button>
      </aside>
    </section>
  `;
}
