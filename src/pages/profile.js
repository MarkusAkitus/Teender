import { t } from "../app/i18n.js";

export function profilePage(state) {
  const me = state.me || {};
  const contact = me.contact || {};
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <div class="settings-header">
          <h2>${t(lang, "profileTitle")}</h2>
          <button class="gear-button" data-action="go" data-go="/settings-user" title="${t(lang, "settingsTitle")}">
            ⚙
          </button>
        </div>
        <form class="form" data-form="profile">
          <label>
            ${t(lang, "formName")}
            <input name="name" type="text" value="${me.name || ""}" required />
          </label>
          <label>
            ${t(lang, "profileAvatar")}
            <input name="avatarUrl" type="text" placeholder="https://..." value="${me.avatarUrl || ""}" />
          </label>
          <label>
            ${t(lang, "profileAvatarUpload")}
            <input type="file" accept="image/*" data-action="avatarUpload" />
          </label>
          <label>
            ${t(lang, "signInUser")}
            <input name="username" type="text" value="${me.username || ""}" />
          </label>
          <label>
            ${t(lang, "formCity")}
            <input name="city" type="text" value="${me.city || ""}" />
          </label>
          <label>
            ${t(lang, "formBio")}
            <textarea name="bio" rows="3">${me.bio || ""}</textarea>
          </label>
          <label>
            ${t(lang, "formInterests")}
            <input
              name="interests"
              type="text"
              value="${(me.interests || []).join(", ")}"
            />
          </label>
          <label>
            ${t(lang, "formVibe")}
            <input name="vibe" type="text" value="${me.vibe || ""}" />
          </label>
          <div class="subsection">
            <h4>${t(lang, "profileContactTitle")}</h4>
            <label>
              ${t(lang, "contactEmail")}
              <input name="email" type="email" value="${contact.email || ""}" />
            </label>
            <label>
              ${t(lang, "contactInstagram")}
              <input name="instagram" type="text" value="${contact.instagram || ""}" />
            </label>
          </div>
          <button class="primary" type="submit">${t(lang, "profileSave")}</button>
        </form>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "profileTools")}</h3>
        <p>${t(lang, "profileResetBody")}</p>
        <button class="ghost" data-action="resetDemo">${t(lang, "profileReset")}</button>
      </aside>
    </section>
  `;
}
