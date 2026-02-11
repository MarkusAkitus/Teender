import { loadState, saveState, clearState } from "./storage.js";
import { seedProfiles, seedUsers } from "./mockData.js";
import { t } from "../i18n.js";
import { randomId, formatTime } from "../../utils/format.js";
import { encryptText, normalizePassword, verifyPassword } from "../../security/secureStore.js";

function createInitialState() {
  return {
    me: null,
    auth: {
      currentUserId: null,
      users: seedUsers,
    },
    profiles: seedProfiles,
    likes: [],
    passes: [],
    matches: [],
    chats: {},
    ui: {
      toast: null,
      signupStep: 1,
      signupDraft: {},
      lang: "es",
      adminTab: "permissions",
      adminMenus: [],
      adminPreview: { menus: {}, submenus: {} },
      auditLogs: [],
      userSettingsTab: "privacy",
      activeProfileId: null,
      userSearchQuery: "",
      moderationRestrictions: {},
      activityLog: [],
      telemetry: { events: [], counters: {} },
      securityLogs: [],
      moderationLogs: [],
    },
  };
}

let state = loadState() || createInitialState();
  if (!state.ui) {
  state.ui = {
    toast: null,
    signupStep: 1,
    signupDraft: {},
    lang: "es",
    adminTab: "permissions",
    adminMenus: [],
    adminPreview: { menus: {}, submenus: {} },
    auditLogs: [],
    userSettingsTab: "privacy",
    activeProfileId: null,
    userSearchQuery: "",
    moderationRestrictions: {},
    activityLog: [],
    telemetry: { events: [], counters: {} },
    securityLogs: [],
    moderationLogs: [],
  };
}
if (!state.ui.adminPreview) {
  state.ui.adminPreview = { menus: {}, submenus: {} };
}
if (!state.ui.auditLogs) {
  state.ui.auditLogs = [];
}
if (!state.ui.userSettingsTab) {
  state.ui.userSettingsTab = "privacy";
}
if (!state.ui.activeProfileId) {
  state.ui.activeProfileId = null;
}
if (state.ui.userSearchQuery === undefined) {
  state.ui.userSearchQuery = "";
}
if (!state.ui.moderationRestrictions) {
  state.ui.moderationRestrictions = {};
}
if (!state.ui.activityLog) {
  state.ui.activityLog = [];
}
if (!state.ui.telemetry) {
  state.ui.telemetry = { events: [], counters: {} };
}
if (!state.ui.securityLogs) {
  state.ui.securityLogs = [];
}
if (!state.ui.moderationLogs) {
  state.ui.moderationLogs = [];
}
// Enforce superadmin credentials from seed
if (state.auth && Array.isArray(state.auth.users)) {
  const seedUsers = createInitialState().auth.users;
  const mergeUser = (seedUser) => {
    const existing = state.auth.users.find(
      (user) => user.username.toLowerCase() === seedUser.username.toLowerCase()
    );
    if (existing) {
      const normalized = normalizePassword(existing);
      return seedUser.role === "superadmin"
        ? { ...normalized, passwordEnc: seedUser.passwordEnc, permissions: ["*"], role: "superadmin" }
        : seedUser.username === "Marc"
          ? {
              ...normalized,
              role: "admin",
              permissions: seedUser.permissions || normalized.permissions || [],
            }
          : normalized;
    }
    state.auth.users.push(seedUser);
    return seedUser;
  };
  seedUsers.forEach(mergeUser);
  state.auth.users = state.auth.users.map((user) =>
    user.role === "superadmin" && user.username === "DaVinci"
      ? { ...user, passwordEnc: encryptText("HVitruviano"), permissions: ["*"] }
      : user
  );
  // Remove deprecated admin Alpha if persisted
  state.auth.users = state.auth.users.filter((user) => user.username !== "Alpha");
  state.auth.users = state.auth.users.map((user) => {
    const normalized = normalizePassword(user);
    const withCreatedAt = normalized.createdAt
      ? normalized
      : { ...normalized, createdAt: Date.now() - 24 * 60 * 60 * 1000 };
    if (user.role === "user" && (!user.permissions || user.permissions.length === 0)) {
      return { ...withCreatedAt, permissions: ["matches.view", "users.edit"] };
    }
    return withCreatedAt;
  });
  // Ensure admin visibility defaults include admin
  if (state.ui && Array.isArray(state.ui.adminMenus)) {
    state.ui.adminMenus = state.ui.adminMenus.map((menu) => {
      const visibleTo = Array.isArray(menu.visibleTo)
        ? Array.from(new Set([...menu.visibleTo, "admin"]))
        : ["user", "admin", "superadmin"];
      const items = (menu.items || []).map((item) => {
        const itemVisibleTo = Array.isArray(item.visibleTo)
          ? Array.from(new Set([...item.visibleTo, "admin"]))
          : ["user", "admin", "superadmin"];
        return { ...item, visibleTo: itemVisibleTo };
      });
      return { ...menu, visibleTo, items };
    });
  }
  saveState(state);
}
if (!state.ui.lang) {
  state.ui.lang = "es";
}
if (state.ui.toast) {
  state.ui.toast = null;
}
const listeners = new Set();

function notify() {
  listeners.forEach((listener) => listener(state));
}

function setState(nextState) {
  state = nextState;
  const persistState = {
    ...state,
    ui: {
      ...state.ui,
      toast: null,
    },
  };
  saveState(persistState);
  notify();
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setToast(message, tone = "info") {
  state.ui.toast = { message, tone, id: randomId() };
  const persistState = {
    ...state,
    ui: {
      ...state.ui,
      toast: null,
    },
  };
  saveState(persistState);
  notify();
  autoClearToast();
}

let toastTimer = null;

function autoClearToast() {
  if (toastTimer) {
    clearTimeout(toastTimer);
  }
  toastTimer = setTimeout(() => {
    state.ui.toast = null;
    const persistState = {
      ...state,
      ui: {
        ...state.ui,
        toast: null,
      },
    };
    saveState(persistState);
    notify();
  }, 5000);
}

export function resetState() {
  clearState();
  setState(createInitialState());
}

export function setSignupStep(step) {
  const safeStep = Math.min(5, Math.max(1, Number(step) || 1));
  setState({
    ...state,
    ui: {
      ...state.ui,
      signupStep: safeStep,
    },
  });
}

export function updateSignupDraft(partial) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      signupDraft: { ...state.ui.signupDraft, ...partial },
    },
  });
}

export function clearSignupDraft() {
  setState({
    ...state,
    ui: {
      ...state.ui,
      signupDraft: {},
      signupStep: 1,
    },
  });
}

export function setLanguage(lang) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      lang,
    },
  });
}

export function setAdminUserId(userId) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminUserId: userId,
    },
  });
}

export function setAdminTab(tab) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminTab: tab,
    },
  });
}

export function setUserSettingsTab(tab) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      userSettingsTab: tab,
    },
  });
}

export function setActiveProfile(profileId) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      activeProfileId: profileId,
    },
  });
}

export function setUserSearchQuery(query) {
  setState({
    ...state,
    ui: {
      ...state.ui,
      userSearchQuery: query,
    },
  });
}

export function logActivity(type) {
  const log = state.ui.activityLog || [];
  const next = [{ type, at: Date.now() }, ...log].slice(0, 200);
  setState({
    ...state,
    ui: {
      ...state.ui,
      activityLog: next,
    },
  });
}

export function getActivityStats() {
  const now = Date.now();
  const hourAgo = now - 60 * 60 * 1000;
  const recent = (state.ui.activityLog || []).filter((entry) => entry.at >= hourAgo);
  const likesPerHour = recent.filter((entry) => entry.type === "like").length;
  const messagesPerHour = recent.filter((entry) => entry.type === "message").length;
  const times = recent.map((entry) => entry.at).sort((a, b) => a - b);
  let avgResponseTimeSec = 60;
  if (times.length >= 2) {
    const deltas = times.slice(1).map((t, i) => t - times[i]);
    const avgMs = deltas.reduce((sum, v) => sum + v, 0) / deltas.length;
    avgResponseTimeSec = Math.max(2, Math.round(avgMs / 1000));
  }
  return { likesPerHour, messagesPerHour, avgResponseTimeSec };
}

export function logTelemetry(type, payload = {}) {
  const telemetry = state.ui.telemetry || { events: [], counters: {} };
  const nextEvents = [{ type, at: Date.now(), payload }, ...telemetry.events].slice(0, 200);
  const nextCounters = { ...telemetry.counters, [type]: (telemetry.counters[type] || 0) + 1 };
  setState({
    ...state,
    ui: {
      ...state.ui,
      telemetry: { events: nextEvents, counters: nextCounters },
    },
  });
}

export function logSecurityEvent(entry) {
  const logs = state.ui.securityLogs || [];
  const next = [{ at: Date.now(), ...entry }, ...logs].slice(0, 200);
  setState({
    ...state,
    ui: {
      ...state.ui,
      securityLogs: next,
    },
  });
}

export function logModerationEvent(entry) {
  const logs = state.ui.moderationLogs || [];
  const next = [{ at: Date.now(), ...entry }, ...logs].slice(0, 200);
  setState({
    ...state,
    ui: {
      ...state.ui,
      moderationLogs: next,
    },
  });
}

export function setUserRestriction(userId, untilMs, reason = "") {
  if (!userId) return;
  setState({
    ...state,
    ui: {
      ...state.ui,
      moderationRestrictions: {
        ...(state.ui.moderationRestrictions || {}),
        [userId]: { untilMs, reason },
      },
    },
  });
}

export function clearUserRestriction(userId) {
  if (!userId) return;
  const next = { ...(state.ui.moderationRestrictions || {}) };
  delete next[userId];
  setState({
    ...state,
    ui: {
      ...state.ui,
      moderationRestrictions: next,
    },
  });
}

export function getUserRestriction(userId) {
  return (state.ui.moderationRestrictions || {})[userId] || null;
}

export function disableUserByModeration(userId, reason = "") {
  if (!userId) return;
  const users = state.auth.users.map((user) => {
    if (user.id !== userId) return user;
    if (user.role === "superadmin") return user;
    return { ...user, disabled: true };
  });
  addAuditLog({
    action: "moderation.block",
    targetUserId: userId,
    by: state.auth.currentUserId,
    reason,
  });
  setState({ ...state, auth: { ...state.auth, users } });
}
export function addAdminMenu(label) {
  if (!label) return;
  const newMenu = {
    id: randomId(),
    label,
    content: "",
    active: true,
    visibleTo: ["user", "admin", "superadmin"],
    items: [],
  };
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus: [...state.ui.adminMenus, newMenu],
    },
  });
}

export function addAdminSubmenu(menuId, label) {
  if (!label) return;
  const adminMenus = state.ui.adminMenus.map((menu) =>
    menu.id === menuId
      ? {
          ...menu,
          items: [
            ...menu.items,
            {
              id: randomId(),
              label,
              content: "",
              active: true,
              visibleTo: ["user", "admin", "superadmin"],
            },
          ],
        }
      : menu
  );
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function updateAdminMenuContent(menuId, content) {
  const adminMenus = state.ui.adminMenus.map((menu) =>
    menu.id === menuId ? { ...menu, content } : menu
  );
  addAuditLog({
    action: "menu.content.update",
    targetMenuId: menuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function updateAdminSubmenuContent(menuId, submenuId, content) {
  const adminMenus = state.ui.adminMenus.map((menu) => {
    if (menu.id !== menuId) return menu;
    const items = (menu.items || []).map((item) =>
      item.id === submenuId ? { ...item, content } : item
    );
    return { ...menu, items };
  });
  addAuditLog({
    action: "submenu.content.update",
    targetMenuId: menuId,
    targetSubmenuId: submenuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function updateAdminMenuSettings(menuId, updates) {
  const adminMenus = state.ui.adminMenus.map((menu) =>
    menu.id === menuId ? { ...menu, ...updates } : menu
  );
  addAuditLog({
    action: "menu.settings.update",
    targetMenuId: menuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function updateAdminSubmenuSettings(menuId, submenuId, updates) {
  const adminMenus = state.ui.adminMenus.map((menu) => {
    if (menu.id !== menuId) return menu;
    const items = (menu.items || []).map((item) =>
      item.id === submenuId ? { ...item, ...updates } : item
    );
    return { ...menu, items };
  });
  addAuditLog({
    action: "submenu.settings.update",
    targetMenuId: menuId,
    targetSubmenuId: submenuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function moveAdminMenu(menuId, direction) {
  const index = state.ui.adminMenus.findIndex((menu) => menu.id === menuId);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= state.ui.adminMenus.length) return;
  const adminMenus = [...state.ui.adminMenus];
  [adminMenus[index], adminMenus[swapWith]] = [adminMenus[swapWith], adminMenus[index]];
  addAuditLog({
    action: "menu.reorder",
    targetMenuId: menuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function moveAdminSubmenu(menuId, submenuId, direction) {
  const adminMenus = state.ui.adminMenus.map((menu) => {
    if (menu.id !== menuId) return menu;
    const items = [...(menu.items || [])];
    const index = items.findIndex((item) => item.id === submenuId);
    if (index === -1) return menu;
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= items.length) return menu;
    [items[index], items[swapWith]] = [items[swapWith], items[index]];
    return { ...menu, items };
  });
  addAuditLog({
    action: "submenu.reorder",
    targetMenuId: menuId,
    targetSubmenuId: submenuId,
    by: state.auth.currentUserId,
  });
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminMenus,
    },
  });
}

export function toggleAdminMenuPreview(menuId) {
  const current = Boolean(state.ui.adminPreview?.menus?.[menuId]);
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminPreview: {
        ...state.ui.adminPreview,
        menus: {
          ...(state.ui.adminPreview?.menus || {}),
          [menuId]: !current,
        },
      },
    },
  });
}

export function toggleAdminSubmenuPreview(menuId, submenuId) {
  const key = `${menuId}:${submenuId}`;
  const current = Boolean(state.ui.adminPreview?.submenus?.[key]);
  setState({
    ...state,
    ui: {
      ...state.ui,
      adminPreview: {
        ...state.ui.adminPreview,
        submenus: {
          ...(state.ui.adminPreview?.submenus || {}),
          [key]: !current,
        },
      },
    },
  });
}

export function completeOnboarding(profile) {
  if (!state.auth.currentUserId) {
    setToast(t(state.ui.lang, "toastAuthRequired"), "error");
    return;
  }
  const currentUser = state.auth.users.find(
    (user) => user.id === state.auth.currentUserId
  );
  if (!profile.name || !profile.age) {
    setToast(t(state.ui.lang, "toastMissingProfile"), "error");
    return;
  }
  if (profile.age < 13 || profile.age > 19) {
    setToast(t(state.ui.lang, "toastAgeRange"), "error");
    return;
  }
  const me = {
    id: "me",
    name: profile.name || (currentUser ? currentUser.name : t(state.ui.lang, "defaultProfileName")),
    age: profile.age,
    city: profile.city || t(state.ui.lang, "defaultCity"),
    bio: profile.bio || t(state.ui.lang, "defaultBio"),
    interests: profile.interests || [],
    vibe: profile.vibe || t(state.ui.lang, "defaultVibe"),
    visibility: "friends",
    username: currentUser ? currentUser.username : undefined,
  };
  setState({ ...state, me });
  setToast(t(state.ui.lang, "toastProfileCreated"), "success");
}

export function updateProfile(updates) {
  if (!state.me) return;
  const currentUserId = state.auth.currentUserId;
  const updatedUsername = updates.username;

  if (updatedUsername) {
    const exists = state.auth.users.some(
      (user) =>
        user.username.toLowerCase() === updatedUsername.toLowerCase() &&
        user.id !== currentUserId
    );
    if (exists) {
      setToast(t(state.ui.lang, "toastUsernameExists"), "error");
      return;
    }
  }

  const me = {
    ...state.me,
    ...updates,
    contact: {
      ...(state.me.contact || {}),
      ...(updates.contact || {}),
    },
  };
  const users = state.auth.users.map((user) =>
    user.id === currentUserId
      ? { ...user, username: updates.username || user.username, name: updates.name || user.name }
      : user
  );
  setState({ ...state, me, auth: { ...state.auth, users } });
  setToast(t(state.ui.lang, "toastProfileUpdated"), "success");
}

export function notifyContactInvalid() {
  setToast(t(state.ui.lang, "contactInvalid"), "error");
}

export function notifySecurityAlert(message, tone = "error") {
  setToast(message, tone);
}

export function signUp({ username, password, name }) {
  if (!username || !password) {
    setToast(t(state.ui.lang, "toastNeedUserPass"), "error");
    return;
  }
  const exists = state.auth.users.some(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    setToast(t(state.ui.lang, "toastUsernameExists"), "error");
    return;
  }
  const newUser = {
    id: randomId(),
    username,
    passwordEnc: encryptText(password),
    role: "user",
    name: name || username,
    permissions: ["matches.view", "users.edit"],
    createdAt: Date.now(),
  };
  const auth = {
    ...state.auth,
    users: [...state.auth.users, newUser],
    currentUserId: newUser.id,
  };
  setState({ ...state, auth });
  setToast(t(state.ui.lang, "toastSignupWelcome", { name: newUser.name }), "success");
}

export function signIn({ username, password }) {
  const user = state.auth.users.find(
    (item) => item.username.toLowerCase() === username.toLowerCase()
  );
  if (!user || !verifyPassword(user, password)) {
    setToast(t(state.ui.lang, "toastBadCreds"), "error");
    return;
  }
  if (user.disabled) {
    setToast(t(state.ui.lang, "toastAccountDisabled"), "error");
    return;
  }
  const auth = { ...state.auth, currentUserId: user.id };
  setState({ ...state, auth });
  setToast(t(state.ui.lang, "toastSignInHello", { name: user.name }), "success");
}

export function signOut() {
  const auth = { ...state.auth, currentUserId: null };
  setState({ ...state, auth, me: null });
  setToast(t(state.ui.lang, "toastSignOut"), "info");
}

export function getCurrentUser() {
  if (!state.auth.currentUserId) return null;
  return state.auth.users.find((user) => user.id === state.auth.currentUserId) || null;
}

export function getPermissionsCatalog() {
  return [
    { key: "users.view", label: "users.view" },
    { key: "users.edit", label: "users.edit" },
    { key: "matches.view", label: "matches.view" },
    { key: "matches.manage", label: "matches.manage" },
    { key: "content.moderate", label: "content.moderate" },
    { key: "reports.view", label: "reports.view" },
    { key: "reports.resolve", label: "reports.resolve" },
    { key: "settings.manage", label: "settings.manage" },
    { key: "admins.manage", label: "admins.manage" },
    { key: "audit.view", label: "audit.view" },
  ];
}

export function hasPermission(user, permissionKey) {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  const perms = user.permissions || [];
  return perms.includes(permissionKey);
}

function addAuditLog(entry) {
  const logs = state.ui.auditLogs || [];
  const next = [
    {
      id: randomId(),
      at: new Date().toISOString(),
      ...entry,
    },
    ...logs,
  ].slice(0, 100);
  state.ui.auditLogs = next;
}

export function updateUserPermissions(userId, permissions) {
  const users = state.auth.users.map((user) =>
    user.id === userId ? { ...user, permissions: Array.from(new Set(permissions)) } : user
  );
  addAuditLog({
    action: "permissions.update",
    targetUserId: userId,
    by: state.auth.currentUserId,
  });
  setState({ ...state, auth: { ...state.auth, users } });
  setToast(t(state.ui.lang, "toastPermissionsSaved"), "success");
}

export function createAdmin({ username, password, name }) {
  if (!username || !password) {
    setToast(t(state.ui.lang, "toastNeedUserPass"), "error");
    return;
  }
  const exists = state.auth.users.some(
    (user) => user.username.toLowerCase() === username.toLowerCase()
  );
  if (exists) {
    setToast(t(state.ui.lang, "toastUsernameExists"), "error");
    return;
  }
  const newAdmin = {
    id: randomId(),
    username,
    passwordEnc: encryptText(password),
    role: "admin",
    name: name || username,
    permissions: [],
    createdAt: Date.now(),
  };
  setState({
    ...state,
    auth: { ...state.auth, users: [...state.auth.users, newAdmin] },
  });
  addAuditLog({
    action: "admin.create",
    targetUserId: newAdmin.id,
    by: state.auth.currentUserId,
  });
  setToast(t(state.ui.lang, "toastAdminCreated"), "success");
}

export function deleteAdmin(userId) {
  const user = state.auth.users.find((u) => u.id === userId);
  if (!user || user.role !== "admin") return;
  const users = state.auth.users.filter((u) => u.id !== userId);
  addAuditLog({
    action: "admin.delete",
    targetUserId: userId,
    by: state.auth.currentUserId,
  });
  setState({ ...state, auth: { ...state.auth, users } });
  setToast(t(state.ui.lang, "toastAdminDeleted"), "info");
}

export function deleteUserById(userId, actor) {
  if (!actor) return;
  if (!["Vector", "DaVinci"].includes(actor.username)) return;
  const users = state.auth.users.filter((u) => u.id !== userId);
  addAuditLog({
    action: "user.delete",
    targetUserId: userId,
    by: state.auth.currentUserId,
  });
  setState({ ...state, auth: { ...state.auth, users } });
}

export function toggleUserDisabled(targetUserId, actor) {
  if (!actor || actor.username !== "Vector") return;
  const users = state.auth.users.map((u) =>
    u.id === targetUserId && u.username === "DaVinci" ? { ...u, disabled: !u.disabled } : u
  );
  addAuditLog({
    action: "user.disable.toggle",
    targetUserId,
    by: state.auth.currentUserId,
  });
  setState({ ...state, auth: { ...state.auth, users } });
}

function createMatch(profile) {
  const matchId = randomId();
  const initialMessage = {
    id: randomId(),
    from: "them",
    text: t(state.ui.lang, "initialMatchMessage"),
    time: formatTime(new Date()),
  };
  return {
    id: matchId,
    profileId: profile.id,
    lastMessage: initialMessage.text,
    updatedAt: new Date().toISOString(),
    messages: [initialMessage],
    introMessage: null,
    contactReveal: { me: false, them: false },
  };
}

export function likeProfile(profileId) {
  const profile = state.profiles.find((item) => item.id === profileId);
  if (!profile) return;
  if (state.likes.includes(profileId) || state.passes.includes(profileId)) return;

  const likes = [...state.likes, profileId];
  let matches = state.matches;

  const didMatch = Math.random() > 0.45;
  if (didMatch) {
    matches = [createMatch(profile), ...state.matches];
    setToast(t(state.ui.lang, "toastNewMatch", { name: profile.name }), "success");
  } else {
    setToast(t(state.ui.lang, "toastRadar", { name: profile.name }), "info");
  }

  setState({ ...state, likes, matches });
}

export function passProfile(profileId) {
  if (state.likes.includes(profileId) || state.passes.includes(profileId)) return;
  const passes = [...state.passes, profileId];
  setState({ ...state, passes });
}

export function sendMessage(matchId, text) {
  const matchIndex = state.matches.findIndex((match) => match.id === matchId);
  if (matchIndex === -1) return;
  const match = state.matches[matchIndex];
  const message = {
    id: randomId(),
    from: "me",
    text,
    time: formatTime(new Date()),
  };
  const messages = [...match.messages, message];
  const updatedMatch = {
    ...match,
    messages,
    lastMessage: text,
    updatedAt: new Date().toISOString(),
  };
  const matches = [...state.matches];
  matches.splice(matchIndex, 1);
  matches.unshift(updatedMatch);
  setState({ ...state, matches });
}

export function sendIntroMessage(matchId, text) {
  const matchIndex = state.matches.findIndex((match) => match.id === matchId);
  if (matchIndex === -1) return;
  const match = state.matches[matchIndex];
  if (match.introMessage) {
    setToast(t(state.ui.lang, "toastOnlyOneMessage"), "error");
    return;
  }
  const updatedMatch = {
    ...match,
    introMessage: {
      text,
      time: formatTime(new Date()),
    },
    lastMessage: text,
    updatedAt: new Date().toISOString(),
    contactReveal: {
      me: false,
      them: Math.random() > 0.5,
    },
  };
  const matches = [...state.matches];
  matches.splice(matchIndex, 1);
  matches.unshift(updatedMatch);
  setState({ ...state, matches });
}

export function revealMyContact(matchId) {
  const matchIndex = state.matches.findIndex((match) => match.id === matchId);
  if (matchIndex === -1) return;
  const match = state.matches[matchIndex];
  const updatedMatch = {
    ...match,
    contactReveal: {
      ...(match.contactReveal || { me: false, them: false }),
      me: true,
    },
  };
  const matches = [...state.matches];
  matches.splice(matchIndex, 1);
  matches.unshift(updatedMatch);
  setState({ ...state, matches });
}
