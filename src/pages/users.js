import { t } from "../app/i18n.js";

export function usersPage(state) {
  const lang = state.ui.lang || "es";
  const users = state.auth.users || [];
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "usersTitle")}</h2>
        <p>${t(lang, "usersBody")}</p>
        <div class="match-list">
          ${users
            .map(
              (user) => `
            <div class="admin-row">
              <div>
                <strong>${user.username}</strong>
                <div class="muted">${user.role}</div>
              </div>
              <span>${(user.permissions || []).length} perms</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    </section>
  `;
}
