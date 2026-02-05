import { emptyState } from "../components/emptyState.js";
import { t } from "../app/i18n.js";

function messageBubble(message) {
  const tone = message.from === "me" ? "bubble me" : "bubble";
  return `
    <div class="${tone}">
      <p>${message.text}</p>
      <span>${message.time}</span>
    </div>
  `;
}

export function chatPage(state, params) {
  const lang = state.ui.lang || "es";
  const match = state.matches.find((item) => item.id === params.id);
  if (!match) {
    return emptyState(
      t(lang, "chatNotFoundTitle"),
      t(lang, "chatNotFoundBody"),
      t(lang, "emptyGoFriends"),
      "/matches"
    );
  }

  const profile = state.profiles.find((item) => item.id === match.profileId);
  return `
    <section class="page chat-page">
      <div class="panel chat-panel">
        <div class="chat-header">
          <button class="ghost" data-action="go" data-go="/matches">${t(lang, "chatBack")}</button>
          <div>
            <h3>${profile ? profile.name : t(lang, "chatTitle")}</h3>
            <p class="muted">${t(lang, "chatReminder")}</p>
          </div>
        </div>
        <div class="chat-messages">
          ${match.messages.map(messageBubble).join("")}
        </div>
        <form class="chat-input" data-form="message">
          <input type="hidden" name="matchId" value="${match.id}" />
          <input name="message" type="text" placeholder="${t(lang, "chatPlaceholder")}" required />
          <button class="primary" type="submit">${t(lang, "chatSend")}</button>
        </form>
      </div>
    </section>
  `;
}
