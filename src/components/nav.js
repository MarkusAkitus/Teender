import { t, languages } from "../app/i18n.js";

export function navBar(state, route = "/") {
  const isAuthed = Boolean(state.auth.currentUserId);
  const isHome = route === "/";
  const lang = state.ui.lang || "es";
  const currentUser =
    state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
  const isSuperadmin = currentUser && currentUser.role === "superadmin";

  const menu = isAuthed
    ? `
      <button class="nav-link" data-action="go" data-go="/discover">${t(lang, "navDiscover")}</button>
      <button class="nav-link" data-action="go" data-go="/matches">${t(lang, "navFriends")}</button>
      <button class="nav-link" data-action="go" data-go="/safety">${t(lang, "navSafety")}</button>
      <button class="nav-link" data-action="go" data-go="/profile">${t(lang, "navProfile")}</button>
      ${isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/admin">${t(lang, "navAdmin")}</button>` : ""}
      ${isHome ? "" : `<button class="nav-link" data-action="signOut">${t(lang, "navSignOut")}</button>`}
    `
    : `
      <button class="nav-link" data-action="go" data-go="/signin">${t(lang, "navSignIn")}</button>
      <button class="nav-link" data-action="go" data-go="/signup">${t(lang, "navSignUp")}</button>
    `;

  const langOptions = languages
    .map(
      (item) =>
        `<option value="${item.code}" ${item.code === lang ? "selected" : ""}>${item.label}</option>`
    )
    .join("");

  return `
    <header class="topbar">
      <div class="brand" data-action="brand" data-go="/">
        <span class="brand-mark">${t(lang, "brand")}</span>
        <span class="brand-tag">${t(lang, "brandTag")}</span>
      </div>
      <nav class="nav">
        ${menu}
        <label class="lang-select">
          <span>${t(lang, "langLabel")}</span>
          <select data-action="changeLang">
            ${langOptions}
          </select>
        </label>
      </nav>
    </header>
  `;
}
