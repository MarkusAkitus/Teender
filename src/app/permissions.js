export const ROUTE_PERMISSIONS = {
  "/users": "users.view",
  "/matches-manage": "matches.manage",
  "/content-moderate": "content.moderate",
  "/reports": "reports.view",
  "/settings": "settings.manage",
  "/admin": "admins.manage",
  "/admin-db": "admins.manage",
};

export const ACTION_PERMISSIONS = {
  "admin.permissions.save": "admins.manage",
  "admin.create": "admins.manage",
  "admin.delete": "admins.manage",
  "admin.menus.edit": "admins.manage",
  "admin.menus.settings": "admins.manage",
  "admin.menus.move": "admins.manage",
  "admin.db.access": "admins.manage",
  "users.delete": "users.edit",
  "users.disable": "users.edit",
};

export function canAccessRoute(user, route) {
  const required = ROUTE_PERMISSIONS[route];
  if (!required) return true;
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return (user.permissions || []).includes(required);
}

export function canDoAction(user, actionKey) {
  const required = ACTION_PERMISSIONS[actionKey];
  if (!required) return true;
  if (!user) return false;
  if (user.role === "superadmin") return true;
  return (user.permissions || []).includes(required);
}
