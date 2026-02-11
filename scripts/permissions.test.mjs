import { canAccessRoute, canDoAction } from "../src/app/permissions.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const superadmin = { role: "superadmin", permissions: [] };
const admin = { role: "admin", permissions: ["users.view", "admins.manage"] };
const user = { role: "user", permissions: ["matches.view"] };

assert(canAccessRoute(superadmin, "/admin") === true, "superadmin should access /admin");
assert(canAccessRoute(admin, "/admin") === true, "admin with admins.manage should access /admin");
assert(canAccessRoute(user, "/admin") === false, "user should not access /admin");

assert(canDoAction(superadmin, "admin.create") === true, "superadmin should create admin");
assert(canDoAction(admin, "admin.create") === true, "admin with admins.manage should create admin");
assert(canDoAction(user, "admin.create") === false, "user should not create admin");

console.log("permissions.test.mjs: ok");
