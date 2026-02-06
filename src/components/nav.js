import { t, languages } from "../app/i18n.js";

function buildMenuItems(state, lang, isSuperadmin, isHome) {
  const currentUser =
    state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
  const permissions = currentUser?.permissions || [];
  const hasPerm = (perm) => isSuperadmin || permissions.includes(perm);
  const adminMenus = state.ui.adminMenus || [];
  if (adminMenus.length) {
    const role =
      (state.auth.users.find((u) => u.id === state.auth.currentUserId) || {}).role || "user";
    const items = adminMenus
      .filter(
        (menu) =>
          menu.active !== false &&
          (role === "superadmin" || (menu.visibleTo || []).includes(role))
      )
      .map((menu) => {
        const visibleSubs = (menu.items || []).filter(
          (item) =>
            item.active !== false &&
            (role === "superadmin" || (item.visibleTo || []).includes(role))
        );
        const hasSub = visibleSubs.length > 0;
        if (!hasSub) {
          return `<button class="nav-link" data-action="go" data-go="/menu/${menu.id}">${menu.label}</button>`;
        }
        const subItems = visibleSubs
          .map(
            (item) =>
              `<button class="dropdown-item" data-action="go" data-go="/menu/${menu.id}/${item.id}">${item.label}</button>`
          )
          .join("");
        return `
          <div class="dropdown">
            <button class="nav-link dropdown-toggle" data-action="toggleDropdown" data-dropdown="menu-${menu.id}">
              ${menu.label}
            </button>
            <div class="dropdown-menu">
              ${subItems}
            </div>
          </div>
        `;
      })
      .join("");

    return `
      ${items}
      ${isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/admin">${t(lang, "navAdmin")}</button>` : ""}
      ${isHome ? "" : `<button class="nav-link" data-action="signOut">${t(lang, "navSignOut")}</button>`}
    `;
  }

  return `
    ${hasPerm("matches.view") ? `<button class="nav-link" data-action="go" data-go="/discover">${t(lang, "navDiscover")}</button>` : ""}
    ${hasPerm("matches.view") ? `<button class="nav-link" data-action="go" data-go="/matches">${t(lang, "navFriends")}</button>` : ""}
    ${hasPerm("users.edit") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/profile">${t(lang, "navProfile")}</button>` : ""}
    ${hasPerm("users.view") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/users">${t(lang, "usersTitle")}</button>` : ""}
    ${hasPerm("matches.manage") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/matches-manage">${t(lang, "matchesManageTitle")}</button>` : ""}
    ${hasPerm("content.moderate") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/content-moderate">${t(lang, "contentModerateTitle")}</button>` : ""}
    ${hasPerm("reports.view") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/reports">${t(lang, "reportsTitle")}</button>` : ""}
    ${hasPerm("settings.manage") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/settings">${t(lang, "settingsTitle")}</button>` : ""}
    ${hasPerm("admins.manage") || isSuperadmin ? `<button class="nav-link" data-action="go" data-go="/admin">${t(lang, "navAdmin")}</button>` : ""}
    ${isHome ? "" : `<button class="nav-link" data-action="signOut">${t(lang, "navSignOut")}</button>`}
  `;
}

export function navBar(state, route = "/") {
  const isAuthed = Boolean(state.auth.currentUserId);
  const isHome = route === "/";
  const lang = state.ui.lang || "es";
  const currentUser =
    state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
  const isSuperadmin = currentUser && currentUser.role === "superadmin";

  const menu = isAuthed
    ? buildMenuItems(state, lang, isSuperadmin, isHome)
    : `
      <button class="nav-link" data-action="go" data-go="/signin">${t(lang, "navSignIn")}</button>
      <button class="nav-link" data-action="go" data-go="/signup">${t(lang, "navSignUp")}</button>
    `;

  const currentLang = languages.find((item) => item.code === lang) || languages[0];
  const langOptions = languages
    .map(
      (item) =>
        `<button class="dropdown-item" data-action="setLang" data-lang="${item.code}">${item.label}</button>`
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
        <div class="dropdown lang-dropdown">
          <button class="nav-link dropdown-toggle" data-action="toggleDropdown" data-dropdown="lang">
            ${currentLang.label}
          </button>
          <div class="dropdown-menu">
            ${langOptions}
          </div>
        </div>
      </nav>
    </header>
  `;
}
