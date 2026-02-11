import { t } from "../app/i18n.js";
import { getPermissionsCatalog } from "../app/state/store.js";
import { renderRichText } from "../utils/richText.js";
import { getPasswordForDisplay } from "../security/secureStore.js";

function userOption(user, selectedId) {
  return `<option value="${user.id}" ${user.id === selectedId ? "selected" : ""}>${user.username} (${user.role})</option>`;
}

function permissionToggle(permission, userPerms, disabled) {
  const checked = userPerms.includes(permission.key) ? "checked" : "";
  return `
    <label class="perm-item">
      <input type="checkbox" name="perm:${permission.key}" ${checked} ${disabled ? "disabled" : ""} />
      <span>${permission.label}</span>
    </label>
  `;
}

function visibilityInputs(lang, name, values) {
  const roles = [
    { key: "user", label: t(lang, "adminRoleUser") },
    { key: "admin", label: t(lang, "adminRoleAdmin") },
    { key: "superadmin", label: t(lang, "adminRoleSuperadmin") },
  ];
  return `
    <div class="visibility">
      <span class="muted">${t(lang, "adminVisibility")}</span>
      ${roles
        .map(
          (role) => `
        <label class="perm-item">
          <input type="checkbox" name="${name}:${role.key}" ${values.includes(role.key) ? "checked" : ""} />
          <span>${role.label}</span>
        </label>
      `
        )
        .join("")}
    </div>
  `;
}

export function adminPage(state) {
  const lang = state.ui.lang || "es";
  const users = state.auth.users.filter((user) => user.role === "admin");
  const permissions = getPermissionsCatalog();
  const selectedUserId = state.ui.adminUserId || users[0]?.id;
  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];
  const userPerms = selectedUser?.permissions || [];
  const adminTab = state.ui.adminTab || "permissions";
  const adminMenus = state.ui.adminMenus || [];
  const previewMenus = state.ui.adminPreview?.menus || {};
  const previewSubmenus = state.ui.adminPreview?.submenus || {};
  const currentUser =
    state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
  const canManageAdmins =
    currentUser &&
    (currentUser.role === "superadmin" || (currentUser.permissions || []).includes("admins.manage"));
  const canViewAudit =
    currentUser &&
    (currentUser.role === "superadmin" || (currentUser.permissions || []).includes("audit.view"));
  const isVector = currentUser && currentUser.username === "Vector";
  const canViewPasswords = currentUser && currentUser.role === "superadmin";

  return `
    <section class="page admin-page">
      <div class="panel">
        <h2>${t(lang, "adminTitle")}</h2>
        <p>${t(lang, "adminSubtitle")}</p>
        <div class="admin-tabs">
          <button class="ghost" data-action="adminTab" data-tab="permissions">
            ${t(lang, "adminTabsPermissions")}
          </button>
          <button class="ghost" data-action="adminTab" data-tab="menus">
            ${t(lang, "adminTabsMenus")}
          </button>
          <button class="ghost" data-action="adminTab" data-tab="security">
            ${t(lang, "adminTabsSecurity")}
          </button>
        </div>
        ${
          adminTab === "permissions"
            ? `
        <form class="form" data-form="permissions">
          <label>
            ${t(lang, "adminUsersTitle")}
            <select name="userId" data-action="adminUserChange" data-open-on-hover="true">
              ${users.map((user) => userOption(user, selectedUserId)).join("")}
            </select>
          </label>
          <div class="subsection">
            <h4>${t(lang, "adminPermsTitle")}</h4>
            <div class="perm-grid">
              ${permissions
                .map((perm) => permissionToggle(perm, userPerms, selectedUser?.role === "superadmin"))
                .join("")}
            </div>
          </div>
          <button class="primary" type="submit">${t(lang, "adminSave")}</button>
        </form>
        ${
          canManageAdmins
            ? `
        <div class="subsection">
          <h4>${t(lang, "adminManageTitle")}</h4>
          <div class="admin-list">
            ${
              users.length
                ? users
                    .map(
                      (user) => `
              <div class="admin-row">
                <div>
                  <strong>${user.username}</strong>
                  <div class="muted">${user.name || ""}</div>
                  <div class="admin-password">${t(lang, "adminPassword")}: ${getPasswordForDisplay(user, canViewPasswords)}</div>
                </div>
                <button class="ghost" data-action="deleteAdmin" data-user="${user.id}">
                  ${t(lang, "adminDelete")}
                </button>
              </div>
            `
                    )
                    .join("")
                : `<p class="muted">${t(lang, "adminNoAdmins")}</p>`
            }
          </div>
          <form class="form" data-form="createAdmin">
            <h5>${t(lang, "adminCreateTitle")}</h5>
            <label>
              ${t(lang, "adminName")}
              <input name="name" type="text" />
            </label>
            <label>
              ${t(lang, "adminUsername")}
              <input name="username" type="text" required />
            </label>
            <label>
              ${t(lang, "adminPassword")}
              <input name="password" type="password" required />
            </label>
            <button class="primary" type="submit">${t(lang, "adminCreate")}</button>
          </form>
        </div>
        `
            : ""
        }
        `
            : adminTab === "menus"
            ? `
        <div class="subsection">
          <h4>${t(lang, "adminMenusTitle")}</h4>
          <p>${t(lang, "adminMenusSubtitle")}</p>
          <form class="form" data-form="adminMenu">
            <label>
              ${t(lang, "adminMenuLabel")}
              <input name="menuLabel" type="text" required />
            </label>
            <button class="primary" type="submit">${t(lang, "adminAddMenu")}</button>
          </form>
          ${
            adminMenus.length
              ? `
            <div class="menu-list">
              ${adminMenus
                .map(
                  (menu) => `
                <div class="menu-item">
                  <strong>${menu.label}</strong>
                  <div class="menu-actions">
                    <button class="ghost" data-action="moveMenu" data-menu="${menu.id}" data-dir="up">${t(lang, "adminMoveUp")}</button>
                    <button class="ghost" data-action="moveMenu" data-menu="${menu.id}" data-dir="down">${t(lang, "adminMoveDown")}</button>
                  </div>
                  <form class="form" data-form="adminMenuSettings">
                    <input type="hidden" name="menuId" value="${menu.id}" />
                    <label class="perm-item">
                      <input type="checkbox" name="active" ${menu.active !== false ? "checked" : ""} />
                      <span>${t(lang, "adminActive")}</span>
                    </label>
                    ${visibilityInputs(lang, "visibleTo", menu.visibleTo || ["user", "admin", "superadmin"])}
                    <button class="ghost" type="submit">${t(lang, "adminSaveContent")}</button>
                  </form>
                  <form class="form" data-form="adminMenuContent">
                    <input type="hidden" name="menuId" value="${menu.id}" />
                    <label>
                      ${t(lang, "adminMenuContent")}
                      ${
                        previewMenus[menu.id]
                          ? `<div class="rich-text">${renderRichText(menu.content || t(lang, "menuPageBody"))}</div>`
                          : `<textarea name="content" rows="3">${menu.content || ""}</textarea>`
                      }
                    </label>
                    <div class="menu-actions">
                      <button class="ghost" type="button" data-action="toggleMenuPreview" data-menu="${menu.id}">
                        ${previewMenus[menu.id] ? t(lang, "adminEdit") : t(lang, "adminPreview")}
                      </button>
                      <button class="ghost" type="submit">${t(lang, "adminSaveContent")}</button>
                    </div>
                  </form>
                  <form class="form" data-form="adminSubmenu">
                    <input type="hidden" name="menuId" value="${menu.id}" />
                    <label>
                      ${t(lang, "adminSubmenuLabel")}
                      <input name="submenuLabel" type="text" required />
                    </label>
                    <button class="ghost" type="submit">${t(lang, "adminAddSubmenu")}</button>
                  </form>
                  <div class="submenu-list">
                    ${(menu.items || [])
                      .map(
                        (item) => `
                      <div class="submenu-item">
                        <span class="submenu-chip">${item.label}</span>
                        <div class="menu-actions">
                          <button class="ghost" data-action="moveSubmenu" data-menu="${menu.id}" data-submenu="${item.id}" data-dir="up">${t(lang, "adminMoveUp")}</button>
                          <button class="ghost" data-action="moveSubmenu" data-menu="${menu.id}" data-submenu="${item.id}" data-dir="down">${t(lang, "adminMoveDown")}</button>
                        </div>
                        <form class="form" data-form="adminSubmenuSettings">
                          <input type="hidden" name="menuId" value="${menu.id}" />
                          <input type="hidden" name="submenuId" value="${item.id}" />
                          <label class="perm-item">
                            <input type="checkbox" name="active" ${item.active !== false ? "checked" : ""} />
                            <span>${t(lang, "adminActive")}</span>
                          </label>
                          ${visibilityInputs(lang, "visibleTo", item.visibleTo || ["user", "admin", "superadmin"])}
                          <button class="ghost" type="submit">${t(lang, "adminSaveContent")}</button>
                        </form>
                        <form class="form" data-form="adminSubmenuContent">
                          <input type="hidden" name="menuId" value="${menu.id}" />
                          <input type="hidden" name="submenuId" value="${item.id}" />
                          <label>
                            ${t(lang, "adminSubmenuContent")}
                            ${
                              previewSubmenus[`${menu.id}:${item.id}`]
                                ? `<div class="rich-text">${renderRichText(item.content || t(lang, "menuPageBody"))}</div>`
                                : `<textarea name="content" rows="2">${item.content || ""}</textarea>`
                            }
                          </label>
                          <div class="menu-actions">
                            <button class="ghost" type="button" data-action="toggleSubmenuPreview" data-menu="${menu.id}" data-submenu="${item.id}">
                              ${previewSubmenus[`${menu.id}:${item.id}`] ? t(lang, "adminEdit") : t(lang, "adminPreview")}
                            </button>
                            <button class="ghost" type="submit">${t(lang, "adminSaveContent")}</button>
                          </div>
                        </form>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `<p class="muted">${t(lang, "adminNoMenus")}</p>`
          }
        </div>
        `
            : `
        <div class="subsection">
          <h4>${t(lang, "adminSecurityTitle")}</h4>
          ${
            (state.ui.securityLogs || []).length
              ? `
            <div class="audit-list">
              ${(state.ui.securityLogs || [])
                .map(
                  (log) => `
                <div class="audit-item">
                  <span>${new Date(log.at).toLocaleString()}</span>
                  <span>${log.type}</span>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `<p class="muted">${t(lang, "adminSecurityEmpty")}</p>`
          }
        </div>
        <div class="subsection">
          <h4>${t(lang, "adminModerationTitle")}</h4>
          ${
            (state.ui.moderationLogs || []).length
              ? `
            <div class="audit-list">
              ${(state.ui.moderationLogs || [])
                .map(
                  (log) => `
                <div class="audit-item">
                  <span>${new Date(log.at).toLocaleString()}</span>
                  <span>${log.type}</span>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `<p class="muted">${t(lang, "adminModerationEmpty")}</p>`
          }
        </div>
        <div class="subsection">
          <h4>${t(lang, "adminTelemetryTitle")}</h4>
          <div class="audit-list">
            ${Object.entries(state.ui.telemetry?.counters || {})
              .map(
                ([key, value]) => `
              <div class="audit-item">
                <span>${key}</span>
                <span>${value}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
        `
        }
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "adminViewOnly")}</h3>
        <p>${t(lang, "adminSuperNote")}</p>
        ${isVector ? `<button class="ghost" data-action="go" data-go="/admin-db">${t(lang, "adminDbTitle")}</button>` : ""}
        ${
          canViewAudit
            ? `
        <div class="subsection">
          <h4>${t(lang, "adminAuditTitle")}</h4>
          ${
            (state.ui.auditLogs || []).length
              ? `
            <div class="audit-list">
              ${(state.ui.auditLogs || [])
                .map(
                  (log) => `
                <div class="audit-item">
                  <span>${new Date(log.at).toLocaleString()}</span>
                  <span>${log.action}</span>
                </div>
              `
                )
                .join("")}
            </div>
          `
              : `<p class="muted">${t(lang, "adminAuditEmpty")}</p>`
          }
        </div>
        `
            : ""
        }
      </aside>
    </section>
  `;
}
