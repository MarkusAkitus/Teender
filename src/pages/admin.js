import { t } from "../app/i18n.js";
import { getPermissionsCatalog } from "../app/state/store.js";

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

export function adminPage(state) {
  const lang = state.ui.lang || "es";
  const users = state.auth.users;
  const permissions = getPermissionsCatalog();
  const selectedUserId = state.ui.adminUserId || users[0]?.id;
  const selectedUser = users.find((user) => user.id === selectedUserId) || users[0];
  const userPerms = selectedUser?.permissions || [];

  return `
    <section class="page admin-page">
      <div class="panel">
        <h2>${t(lang, "adminTitle")}</h2>
        <p>${t(lang, "adminSubtitle")}</p>
        <form class="form" data-form="permissions">
          <label>
            ${t(lang, "adminUsersTitle")}
            <select name="userId" data-action="adminUserChange">
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
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "adminViewOnly")}</h3>
        <p>${t(lang, "adminSuperNote")}</p>
      </aside>
    </section>
  `;
}
