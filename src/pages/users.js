import { t } from "../app/i18n.js";

export function usersPage(state) {
  const lang = state.ui.lang || "es";
  const users = state.auth.users || [];
  const query = (state.ui.userSearchQuery || "").toLowerCase();
  const currentUser =
    state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
  const canDeleteUsers = currentUser && ["Vector", "DaVinci"].includes(currentUser.username);
  const isVector = currentUser && currentUser.username === "Vector";

  const matchesQuery = (user) =>
    !query ||
    user.username.toLowerCase().includes(query) ||
    (user.name || "").toLowerCase().includes(query);

  const sortAlpha = (a, b) => a.username.localeCompare(b.username);
  const superadmins = users.filter((u) => u.role === "superadmin").filter(matchesQuery).sort(sortAlpha);
  const admins = users.filter((u) => u.role === "admin").filter(matchesQuery).sort(sortAlpha);
  const normals = users.filter((u) => u.role === "user").filter(matchesQuery).sort(sortAlpha);
  const ordered = [...superadmins, ...admins, ...normals];
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "usersTitle")}</h2>
        <p>${t(lang, "usersBody")}</p>
        <div class="form">
          <label>
            ${t(lang, "usersSearch")}
            <input type="text" value="${state.ui.userSearchQuery || ""}" data-action="userSearch" placeholder="Marc, Vector..." />
          </label>
        </div>
        <div class="match-list">
          ${ordered
            .map(
              (user) => `
            <div class="admin-row">
              <div>
                <strong>${user.username}</strong>
                <div class="muted">${user.role}${user.level ? ` · ${user.level}` : ""}</div>
                ${user.disabled ? `<div class="status-badge status-waiting">${t(lang, "usersDisabled")}</div>` : ""}
              </div>
              <div class="menu-actions">
                <span>${(user.permissions || []).length} perms</span>
                ${
                  isVector && user.username === "DaVinci"
                    ? `<button class="ghost" data-action="toggleDisableDaVinci" data-user="${user.id}">
                        ${user.disabled ? t(lang, "usersEnable") : t(lang, "usersDisable")}
                      </button>`
                    : ""
                }
                ${
                  canDeleteUsers && user.username !== "Vector"
                    ? `<button class="ghost" data-action="deleteUser" data-user="${user.id}">
                        ${t(lang, "usersDelete")}
                      </button>`
                    : ""
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
