import { t } from "../app/i18n.js";
import { renderRichText } from "../utils/richText.js";

export function menuPage(state, params) {
  const lang = state.ui.lang || "es";
  const menus = state.ui.adminMenus || [];
  const menu = menus.find((item) => item.id === params.menuId);
  const submenu =
    menu && params.submenuId
      ? (menu.items || []).find((item) => item.id === params.submenuId)
      : null;

  const role =
    (state.auth.users.find((u) => u.id === state.auth.currentUserId) || {}).role || "user";
  const isMenuVisible =
    menu && menu.active !== false && (role === "superadmin" || (menu.visibleTo || []).includes(role));
  const isSubVisible =
    submenu &&
    submenu.active !== false &&
    (role === "superadmin" || (submenu.visibleTo || []).includes(role));

  if (!menu || !isMenuVisible || (params.submenuId && !isSubVisible)) {
    return `
      <section class="page">
        <div class="panel">
          <h2>${t(lang, "menuNotFoundTitle")}</h2>
          <p>${t(lang, "menuNotFoundBody")}</p>
        </div>
      </section>
    `;
  }

  return `
    <section class="page">
      <div class="panel">
        <h2>${submenu ? submenu.label : menu.label}</h2>
        <div class="rich-text">
          ${renderRichText(submenu ? submenu.content || t(lang, "menuPageBody") : menu.content || t(lang, "menuPageBody"))}
        </div>
        ${
          submenu
            ? ""
            : `
        <div class="submenu-list">
          ${(menu.items || [])
            .filter(
              (item) =>
                item.active !== false &&
                (role === "superadmin" || (item.visibleTo || []).includes(role))
            )
            .map((item) => `<span class="submenu-chip">${item.label}</span>`)
            .join("")}
        </div>
        `
        }
      </div>
    </section>
  `;
}
