import { resolveRoute, navigate } from "./router.js";
import {
  getState,
  subscribe,
  completeOnboarding,
  likeProfile,
  passProfile,
  sendMessage,
  sendIntroMessage,
  updateProfile,
  notifyContactInvalid,
  notifySecurityAlert,
  signUp,
  signIn,
  signOut,
  getCurrentUser,
  revealMyContact,
  setSignupStep,
  updateSignupDraft,
  clearSignupDraft,
  setLanguage,
  setAdminUserId,
  setAdminTab,
  addAdminMenu,
  addAdminSubmenu,
  updateAdminMenuContent,
  updateAdminSubmenuContent,
  updateAdminMenuSettings,
  updateAdminSubmenuSettings,
  moveAdminMenu,
  moveAdminSubmenu,
  toggleAdminMenuPreview,
  toggleAdminSubmenuPreview,
  createAdmin,
  deleteAdmin,
  setUserSettingsTab,
  setActiveProfile,
  setUserSearchQuery,
  deleteUserById,
  toggleUserDisabled,
  getPermissionsCatalog,
  updateUserPermissions,
  resetState,
  setUserRestriction,
  clearUserRestriction,
  getUserRestriction,
  disableUserByModeration,
  logActivity,
  getActivityStats,
  logTelemetry,
  logSecurityEvent,
  logModerationEvent,
} from "./state/store.js";
import { SecurityGuard } from "../security/securityGuard.js";
import { ModerationSystem } from "../services/moderationSystem.js";
import { OfflineQueue } from "../services/offlineQueue.js";
import { validate } from "../utils/validation.js";
import { canAccessRoute, canDoAction } from "./permissions.js";
import {
  sanitizeText,
  sanitizeUsername,
  sanitizeList,
  sanitizeBio,
  sanitizeCity,
  sanitizeVibe,
  sanitizeEmail,
  sanitizeInstagram,
} from "../utils/sanitize.js";
import { layoutShell } from "../components/layout.js";
import { toastView } from "../components/toast.js";
import { homePage } from "../pages/home.js";
import { onboardingPage } from "../pages/onboarding.js";
import { discoverPage } from "../pages/discover.js";
import { matchesPage } from "../pages/matches.js";
import { chatPage } from "../pages/chat.js";
import { profilePage } from "../pages/profile.js";
import { signInPage } from "../pages/signIn.js";
import { signUpPage } from "../pages/signUp.js";
import { demoPage } from "../pages/demo.js";
import { t } from "./i18n.js";
import { adminPage } from "../pages/admin.js";
import { menuPage } from "../pages/menu.js";
import { usersPage } from "../pages/users.js";
import { matchesManagePage } from "../pages/matchesManage.js";
import { contentModeratePage } from "../pages/contentModerate.js";
import { reportsPage } from "../pages/reports.js";
import { settingsPage } from "../pages/settings.js";
import { userSettingsPage } from "../pages/userSettings.js";
import { adminDbPage } from "../pages/adminDb.js";

const pages = {
  "/": homePage,
  "/signin": signInPage,
  "/signup": signUpPage,
  "/demo": demoPage,
  "/admin": adminPage,
  "/menu/:menuId": menuPage,
  "/menu/:menuId/:submenuId": menuPage,
  "/users": usersPage,
  "/matches-manage": matchesManagePage,
  "/content-moderate": contentModeratePage,
  "/reports": reportsPage,
  "/settings": settingsPage,
  "/settings-user": userSettingsPage,
  "/admin-db": adminDbPage,
  "/onboarding": onboardingPage,
  "/discover": discoverPage,
  "/matches": matchesPage,
  "/chat/:id": chatPage,
  "/profile": profilePage,
};

const appRootId = "app";
const security = new SecurityGuard();
const moderator = new ModerationSystem();
const offlineQueue = new OfflineQueue();

function getClientId() {
  const key = "friending_client_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const id = `client_${Math.random().toString(36).slice(2, 10)}`;
  window.localStorage.setItem(key, id);
  return id;
}

function getClientFingerprint() {
  const raw = `${navigator.userAgent}|${navigator.language}|${screen.width}x${screen.height}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash << 5) - hash + raw.charCodeAt(i);
    hash |= 0;
  }
  return `ip_${Math.abs(hash)}`;
}

function getAccountAgeHours(user) {
  if (!user?.createdAt) return 24;
  const diffMs = Date.now() - user.createdAt;
  return Math.max(1, Math.round(diffMs / (60 * 60 * 1000)));
}

function buildActivityStats(user) {
  const stats = getActivityStats();
  return {
    ...stats,
    accountAgeHours: getAccountAgeHours(user),
  };
}

function validateSecurity(path, body) {
  const req = { path, body };
  const result = security.validateRequest(req);
  if (!result.isValid) {
    security.generateAlert(result.threats, "HIGH");
    logSecurityEvent({ type: "request.blocked", path, threats: result.threats });
    notifySecurityAlert(t(getState().ui.lang, "securityInvalid"));
    return false;
  }
  return true;
}

function getActiveRestriction(userId) {
  if (!userId) return null;
  const restriction = getUserRestriction(userId);
  if (!restriction) return null;
  if (Date.now() > restriction.untilMs) {
    clearUserRestriction(userId);
    return null;
  }
  return restriction;
}

function applyModerationAction(user, violation, reason) {
  if (!user) return true;
  const action = moderator.handleViolation(user, violation);
  logModerationEvent({ type: "moderation.action", userId: user.id, reason, action });
  if (action.action === "warning") {
    notifySecurityAlert(t(getState().ui.lang, "moderationWarning"));
    return true;
  }
  if (action.action === "temp_restrict") {
    const untilMs = Date.now() + (action.durationMinutes || 60) * 60 * 1000;
    setUserRestriction(user.id, untilMs, reason);
    logModerationEvent({ type: "moderation.restrict", userId: user.id, reason, untilMs });
    notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
    return false;
  }
  if (action.action === "block") {
    disableUserByModeration(user.id, reason);
    logModerationEvent({ type: "moderation.block", userId: user.id, reason });
    notifySecurityAlert(t(getState().ui.lang, "moderationBlocked"));
    signOut();
    navigate("/");
    return false;
  }
  return true;
}

function enforceAction(actionKey) {
  const user = getCurrentUser();
  if (!canDoAction(user, actionKey)) {
    notifySecurityAlert(t(getState().ui.lang, "toastNoPermission"));
    return false;
  }
  return true;
}

function validateForm(schemaName, data) {
  const result = validate(schemaName, data);
  if (!result.ok) {
    notifySecurityAlert(t(getState().ui.lang, "toastFormInvalid"));
  }
  return result.ok;
}

const formHandlers = {
  onboarding: (form) => {
    const formData = new FormData(form);
    const payload = {
      name: sanitizeText(formData.get("name")),
      age: Number(formData.get("age") || 0),
      city: sanitizeCity(formData.get("city")),
      bio: sanitizeBio(formData.get("bio")),
      interests: sanitizeList(formData.get("interests")).slice(0, 6),
      vibe: sanitizeVibe(formData.get("vibe")),
    };
    if (!validateForm("onboarding", payload)) return;
    const currentUser = getCurrentUser();
    const profileCheck = moderator.analyzeFakeProfile(payload);
    const ok = applyModerationAction(
      currentUser,
      { score: Math.round(profileCheck.probability * 100), severity: profileCheck.probability },
      "profile.fake"
    );
    if (!ok) return;
    completeOnboarding(payload);
    logTelemetry("onboarding.complete", { userId: currentUser?.id || null });
    offlineQueue.enqueue("onboarding.complete", payload);
    navigate("/discover");
  },
  profile: (form) => {
    const formData = new FormData(form);
    const email = sanitizeEmail(formData.get("email"));
    const instagram = sanitizeInstagram(formData.get("instagram"));
    const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const instaOk = !instagram || /^@?[\w.]{2,30}$/.test(instagram);
    if (!emailOk || !instaOk) {
      notifyContactInvalid();
      return;
    }
    const payload = {
      name: sanitizeText(formData.get("name")),
      avatarUrl: sanitizeText(formData.get("avatarUrl")),
      username: sanitizeUsername(formData.get("username")),
      city: sanitizeCity(formData.get("city")),
      bio: sanitizeBio(formData.get("bio")),
      interests: sanitizeList(formData.get("interests")),
      vibe: sanitizeVibe(formData.get("vibe")),
      contact: {
        email,
        instagram,
      },
    };
    const currentUser = getCurrentUser();
    const profileCheck = moderator.analyzeFakeProfile({
      ...(getState().me || {}),
      ...payload,
    });
    const ok = applyModerationAction(
      currentUser,
      { score: Math.round(profileCheck.probability * 100), severity: profileCheck.probability },
      "profile.update"
    );
    if (!ok) return;
    updateProfile(payload);
    logTelemetry("profile.update", { userId: currentUser?.id || null });
    offlineQueue.enqueue("profile.update", payload);
  },
  message: (form) => {
    const formData = new FormData(form);
    const text = sanitizeText(formData.get("message"));
    const matchId = String(formData.get("matchId") || "");
    if (!text || !matchId) return;
    if (!validateForm("message", { message: text })) return;
    const currentUser = getCurrentUser();
    const restriction = getActiveRestriction(currentUser?.id);
    if (restriction) {
      notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
      return;
    }
    if (!validateSecurity("/api/messages", { text, matchId })) return;
    const rate = security.enforceRateLimit(getClientFingerprint(), "/api/messages");
    if (!rate.allowed) {
      logSecurityEvent({ type: "rate.limit", path: "/api/messages" });
      notifySecurityAlert(t(getState().ui.lang, "securityRateLimit"));
      return;
    }
    const messageCheck = moderator.analyzeMessage(text);
    if (messageCheck.isToxic) {
      applyModerationAction(currentUser, messageCheck, "message.toxic");
      return;
    }
    const match = getState().matches.find((item) => item.id === matchId);
    const recentMessages = (match?.messages || []).map((msg) => ({
      text: msg.text,
      timeMs: Date.now(),
    }));
    const spamCheck = moderator.detectSpam([...recentMessages, { text, timeMs: Date.now() }]);
    if (spamCheck.isSpam) {
      applyModerationAction(
        currentUser,
        { score: Math.round(spamCheck.confidence * 100) },
        "message.spam"
      );
      return;
    }
    sendMessage(matchId, text);
    logActivity("message");
    logTelemetry("message.send", { matchId });
    offlineQueue.enqueue("message.send", { matchId, text });
    form.reset();
  },
  introMessage: (form) => {
    const formData = new FormData(form);
    const text = sanitizeText(formData.get("message"));
    const matchId = String(formData.get("matchId") || "");
    if (!text || !matchId) return;
    if (!validateForm("message", { message: text })) return;
    const currentUser = getCurrentUser();
    const restriction = getActiveRestriction(currentUser?.id);
    if (restriction) {
      notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
      return;
    }
    if (!validateSecurity("/api/messages", { text, matchId })) return;
    const rate = security.enforceRateLimit(getClientFingerprint(), "/api/messages");
    if (!rate.allowed) {
      logSecurityEvent({ type: "rate.limit", path: "/api/messages" });
      notifySecurityAlert(t(getState().ui.lang, "securityRateLimit"));
      return;
    }
    const messageCheck = moderator.analyzeMessage(text);
    if (messageCheck.isToxic) {
      applyModerationAction(currentUser, messageCheck, "message.toxic");
      return;
    }
    const match = getState().matches.find((item) => item.id === matchId);
    const recentMessages = (match?.messages || []).map((msg) => ({
      text: msg.text,
      timeMs: Date.now(),
    }));
    const spamCheck = moderator.detectSpam([...recentMessages, { text, timeMs: Date.now() }]);
    if (spamCheck.isSpam) {
      applyModerationAction(
        currentUser,
        { score: Math.round(spamCheck.confidence * 100) },
        "message.spam"
      );
      return;
    }
    sendIntroMessage(matchId, text);
    logActivity("message");
    logTelemetry("message.intro", { matchId });
    offlineQueue.enqueue("message.intro", { matchId, text });
    form.reset();
  },
  adminMenu: (form) => {
    if (!enforceAction("admin.menus.edit")) return;
    const formData = new FormData(form);
    const label = String(formData.get("menuLabel") || "").trim();
    addAdminMenu(label);
    logTelemetry("admin.menu.create", { label });
    form.reset();
  },
  adminSubmenu: (form) => {
    if (!enforceAction("admin.menus.edit")) return;
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const label = String(formData.get("submenuLabel") || "").trim();
    if (menuId) addAdminSubmenu(menuId, label);
    logTelemetry("admin.submenu.create", { menuId, label });
    form.reset();
  },
  adminMenuContent: (form) => {
    if (!enforceAction("admin.menus.edit")) return;
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const content = String(formData.get("content") || "");
    if (menuId) updateAdminMenuContent(menuId, content);
    logTelemetry("admin.menu.content", { menuId });
  },
  adminSubmenuContent: (form) => {
    if (!enforceAction("admin.menus.edit")) return;
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const submenuId = String(formData.get("submenuId") || "");
    const content = String(formData.get("content") || "");
    if (menuId && submenuId) updateAdminSubmenuContent(menuId, submenuId, content);
    logTelemetry("admin.submenu.content", { menuId, submenuId });
  },
  createAdmin: (form) => {
    if (!enforceAction("admin.create")) return;
    const formData = new FormData(form);
    createAdmin({
      name: sanitizeText(formData.get("name")),
      username: sanitizeUsername(formData.get("username")),
      password: String(formData.get("password") || ""),
    });
    logTelemetry("admin.create", { username: String(formData.get("username") || "").trim() });
    form.reset();
  },
  adminMenuSettings: (form) => {
    if (!enforceAction("admin.menus.settings")) return;
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const active = formData.get("active") === "on";
    const visibleTo = ["user", "admin", "superadmin"].filter(
      (role) => formData.get(`visibleTo:${role}`) === "on"
    );
    if (menuId) updateAdminMenuSettings(menuId, { active, visibleTo });
    logTelemetry("admin.menu.settings", { menuId });
  },
  adminSubmenuSettings: (form) => {
    if (!enforceAction("admin.menus.settings")) return;
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const submenuId = String(formData.get("submenuId") || "");
    const active = formData.get("active") === "on";
    const visibleTo = ["user", "admin", "superadmin"].filter(
      (role) => formData.get(`visibleTo:${role}`) === "on"
    );
    if (menuId && submenuId) updateAdminSubmenuSettings(menuId, submenuId, { active, visibleTo });
    logTelemetry("admin.submenu.settings", { menuId, submenuId });
  },
  userSettings: (form) => {
    const formData = new FormData(form);
    const nextLang = String(formData.get("settings.language") || "");
    updateProfile({
      settings: {
        showOnline: formData.get("settings.showOnline") === "on",
        showAge: formData.get("settings.showAge") === "on",
        showCity: formData.get("settings.showCity") === "on",
        showInterests: formData.get("settings.showInterests") === "on",
        notifyMatches: formData.get("settings.notifyMatches") === "on",
        notifyMessages: formData.get("settings.notifyMessages") === "on",
        notifyContact: formData.get("settings.notifyContact") === "on",
        compactMode: formData.get("settings.compactMode") === "on",
        largeText: formData.get("settings.largeText") === "on",
        darkMode: formData.get("settings.darkMode") === "on",
        autoBlock: formData.get("settings.autoBlock") === "on",
        hideSensitive: formData.get("settings.hideSensitive") === "on",
        language: nextLang,
      },
    });
    if (nextLang) setLanguage(nextLang);
    logTelemetry("settings.update", { lang: nextLang || null });
  },
  permissions: (form) => {
    if (!enforceAction("admin.permissions.save")) return;
    const formData = new FormData(form);
    const userId = String(formData.get("userId") || "");
    const permissions = getPermissionsCatalog()
      .map((perm) => perm.key)
      .filter((key) => formData.get(`perm:${key}`) === "on");
    if (userId) updateUserPermissions(userId, permissions);
    logTelemetry("admin.permissions.update", { userId });
  },
  signIn: (form) => {
    const formData = new FormData(form);
    const ip = getClientFingerprint();
    const brute = security.detectBruteForce(ip, "/login");
    if (brute.isAttack) {
      logSecurityEvent({ type: "bruteforce.block", ip, path: "/login" });
      notifySecurityAlert(t(getState().ui.lang, "securityBlocked"));
      return;
    }
    const signInPayload = {
      username: sanitizeUsername(formData.get("username")),
      password: String(formData.get("password") || ""),
    };
    if (!validateForm("signIn", signInPayload)) return;
    if (!validateSecurity("/login", Object.fromEntries(formData.entries()))) return;
    signIn(signInPayload);
    if (getState().auth.currentUserId) {
      logTelemetry("auth.signin", { username: signInPayload.username });
      offlineQueue.enqueue("auth.signin", { username: signInPayload.username });
      navigate("/discover");
    }
  },
  signUp: (form) => {
    const formData = new FormData(form);
    if (!validateSecurity("/register", Object.fromEntries(formData.entries()))) return;
    const draft = getState().ui.signupDraft || {};
    const payload = {
      name: sanitizeText(formData.get("name") || draft.name || ""),
      age: Number(formData.get("age") || draft.age || 0),
      city: sanitizeCity(formData.get("city") || draft.city || ""),
      bio: sanitizeBio(formData.get("bio") || draft.bio || ""),
      interests: sanitizeList(formData.get("interests") || draft.interests || "").slice(0, 6),
      vibe: sanitizeVibe(formData.get("vibe") || draft.vibe || ""),
      username: sanitizeUsername(formData.get("username") || draft.username || ""),
      password: String(formData.get("password") || draft.password || ""),
    };
    if (!validateForm("signUp", payload)) return;
    const profileCheck = moderator.analyzeFakeProfile(payload);
    signUp(payload);
    const createdUser = getCurrentUser();
    if (createdUser) {
      const ok = applyModerationAction(
        createdUser,
        { score: Math.round(profileCheck.probability * 100), severity: profileCheck.probability },
        "profile.signup"
      );
      if (!ok) return;
    }
    if (getState().auth.currentUserId) {
      completeOnboarding(payload);
      clearSignupDraft();
      logTelemetry("auth.signup", { username: payload.username });
      offlineQueue.enqueue("auth.signup", { username: payload.username });
      navigate("/discover");
    }
  },
};

const clickHandlers = {
  like: (target) => {
    const currentUser = getCurrentUser();
    const restriction = getActiveRestriction(currentUser?.id);
    if (restriction) {
      notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
      return;
    }
    const activity = buildActivityStats(currentUser);
    const risk = moderator.calculateRiskScore(
      { ...(getState().me || {}), ...(currentUser || {}) },
      { ...activity, recentMessages: [] }
    );
    const ok = applyModerationAction(
      currentUser,
      { score: risk.score },
      "activity.bot"
    );
    if (!ok) return;
    const profileId = target.getAttribute("data-profile");
    const rate = security.enforceRateLimit(getClientFingerprint(), "/api/like");
    if (!rate.allowed) {
      logSecurityEvent({ type: "rate.limit", path: "/api/like" });
      notifySecurityAlert(t(getState().ui.lang, "securityRateLimit"));
      return;
    }
    likeProfile(profileId);
    logActivity("like");
    logTelemetry("discover.like", { profileId });
    offlineQueue.enqueue("discover.like", { profileId });
  },
  pass: (target) => {
    const currentUser = getCurrentUser();
    const restriction = getActiveRestriction(currentUser?.id);
    if (restriction) {
      notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
      return;
    }
    const activity = buildActivityStats(currentUser);
    const risk = moderator.calculateRiskScore(
      { ...(getState().me || {}), ...(currentUser || {}) },
      { ...activity, recentMessages: [] }
    );
    const ok = applyModerationAction(
      currentUser,
      { score: risk.score },
      "activity.bot"
    );
    if (!ok) return;
    const profileId = target.getAttribute("data-profile");
    passProfile(profileId);
    logActivity("pass");
    logTelemetry("discover.pass", { profileId });
    offlineQueue.enqueue("discover.pass", { profileId });
  },
  openChat: (target) => {
    const matchId = target.getAttribute("data-match");
    if (matchId) navigate(`/chat/${matchId}`);
  },
  go: (target) => {
    const path = target.getAttribute("data-go");
    if (path) navigate(path);
  },
  openProfile: (target) => {
    const currentUser = getCurrentUser();
    const restriction = getActiveRestriction(currentUser?.id);
    if (restriction) {
      notifySecurityAlert(t(getState().ui.lang, "moderationRestricted"));
      return;
    }
    const activity = buildActivityStats(currentUser);
    const risk = moderator.calculateRiskScore(
      { ...(getState().me || {}), ...(currentUser || {}) },
      { ...activity, recentMessages: [] }
    );
    const ok = applyModerationAction(
      currentUser,
      { score: risk.score },
      "activity.bot"
    );
    if (!ok) return;
    const profileId = target.getAttribute("data-profile");
    if (profileId) setActiveProfile(profileId);
    logActivity("profile.view");
    logTelemetry("profile.view", { profileId });
  },
  closeProfile: () => {
    setActiveProfile(null);
  },
  noop: () => {},
  resetDemo: () => {
    resetState();
    navigate("/onboarding");
  },
  signOut: () => {
    signOut();
    logTelemetry("auth.signout", {});
    navigate("/signin");
  },
  signupNext: (target) => {
    const form = target.closest("form[data-form='signUp']");
    if (!form) return;
    const step = Number(form.getAttribute("data-step") || "1");
    const data = Object.fromEntries(new FormData(form).entries());
    updateSignupDraft(data);

    const required = Array.from(form.querySelectorAll("[data-required='true']"));
    const missing = required.some((input) => !String(input.value || "").trim());
    if (missing) return;
    setSignupStep(step + 1);
  },
  signupPrev: (target) => {
    const form = target.closest("form[data-form='signUp']");
    if (!form) return;
    const step = Number(form.getAttribute("data-step") || "1");
    const data = Object.fromEntries(new FormData(form).entries());
    updateSignupDraft(data);
    setSignupStep(step - 1);
  },
  revealContact: (target) => {
    const matchId = target.getAttribute("data-match");
    if (matchId) revealMyContact(matchId);
  },
  brand: (target) => {
    const path = target.getAttribute("data-go") || "/";
    const state = getState();
    if (state.auth.currentUserId) {
      const shouldSignOut = window.confirm(t(state.ui.lang, "confirmSignOut"));
      if (shouldSignOut) {
        signOut();
        navigate("/");
        return;
      }
      return;
    }
    navigate(path);
  },
  setLang: (target) => {
    const lang = target.getAttribute("data-lang");
    if (lang) setLanguage(lang);
  },
  adminUserChange: (target) => {
    const userId = target.value;
    setAdminUserId(userId);
  },
  adminTab: (target) => {
    const tab = target.getAttribute("data-tab") || "permissions";
    setAdminTab(tab);
  },
  toggleDropdown: (target) => {
    const dropdown = target.closest(".dropdown");
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains("open");
    document.querySelectorAll(".dropdown.open").forEach((el) => el.classList.remove("open"));
    if (!isOpen) dropdown.classList.add("open");
  },
  togglePassword: (target) => {
    const inputId = target.getAttribute("data-target");
    const input = inputId ? document.getElementById(inputId) : null;
    if (!input) return;
    input.type = target.checked ? "text" : "password";
  },
  moveMenu: (target) => {
    if (!enforceAction("admin.menus.move")) return;
    const menuId = target.getAttribute("data-menu");
    const dir = target.getAttribute("data-dir");
    if (menuId && dir) moveAdminMenu(menuId, dir);
    logTelemetry("admin.menu.move", { menuId, dir });
  },
  moveSubmenu: (target) => {
    if (!enforceAction("admin.menus.move")) return;
    const menuId = target.getAttribute("data-menu");
    const submenuId = target.getAttribute("data-submenu");
    const dir = target.getAttribute("data-dir");
    if (menuId && submenuId && dir) moveAdminSubmenu(menuId, submenuId, dir);
    logTelemetry("admin.submenu.move", { menuId, submenuId, dir });
  },
  toggleMenuPreview: (target) => {
    const menuId = target.getAttribute("data-menu");
    if (menuId) toggleAdminMenuPreview(menuId);
  },
  toggleSubmenuPreview: (target) => {
    const menuId = target.getAttribute("data-menu");
    const submenuId = target.getAttribute("data-submenu");
    if (menuId && submenuId) toggleAdminSubmenuPreview(menuId, submenuId);
  },
  deleteAdmin: (target) => {
    if (!enforceAction("admin.delete")) return;
    const userId = target.getAttribute("data-user");
    if (userId) deleteAdmin(userId);
    logTelemetry("admin.delete", { userId });
  },
  avatarUpload: (target) => {
    const file = target.files && target.files[0];
    if (!file) return;
    const scan = security.scanUploadedFile({
      name: file.name,
      size: file.size,
      header: "",
    });
    if (!scan.isSafe) {
      logSecurityEvent({ type: "upload.blocked", file: file.name });
      notifySecurityAlert(t(getState().ui.lang, "securityInvalid"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfile({ avatarUrl: String(reader.result || "") });
    };
    reader.readAsDataURL(file);
  },
  userSearch: (target) => {
    setUserSearchQuery(target.value || "");
  },
  deleteUser: (target) => {
    if (!enforceAction("users.delete")) return;
    const userId = target.getAttribute("data-user");
    if (userId) deleteUserById(userId, getCurrentUser());
    logTelemetry("users.delete", { userId });
  },
  toggleDisableDaVinci: (target) => {
    if (!enforceAction("users.disable")) return;
    const userId = target.getAttribute("data-user");
    if (userId) toggleUserDisabled(userId, getCurrentUser());
    logTelemetry("users.disable.toggle", { userId });
  },
  settingsTab: (target) => {
    const tab = target.getAttribute("data-tab");
    if (tab) setUserSettingsTab(tab);
  },
};

function renderApp() {
  const state = getState();
  const { route, params } = resolveRoute(window.location.hash, Object.keys(pages));
  security.trackIP(getClientFingerprint(), state.auth.currentUserId, route);

  if (!state.auth.currentUserId && !["/signin", "/signup", "/demo", "/"].includes(route)) {
    navigate("/signin");
    return;
  }

  if (state.auth.currentUserId && !state.me && route === "/") {
    navigate("/onboarding");
    return;
  }

  const currentUser = getCurrentUser();
  if (!canAccessRoute(currentUser, route)) {
    navigate("/discover");
    return;
  }
  if (route === "/admin-db" && (!currentUser || currentUser.username !== "Vector")) {
    navigate("/discover");
    return;
  }

  const pageRenderer = pages[route] || homePage;
  const content = pageRenderer(state, params, currentUser);
  const root = document.getElementById(appRootId);
  if (!root) return;

  const theme = state.me?.settings?.darkMode ? "dark" : "light";
  document.body.dataset.theme = theme;
  document.body.dataset.compact = state.me?.settings?.compactMode ? "true" : "false";
  document.body.dataset.largeText = state.me?.settings?.largeText ? "true" : "false";

  root.innerHTML = layoutShell(state, content, route) + toastView(state.ui.toast);
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const handler = clickHandlers[action];
    if (handler) handler(actionEl);
  });

  document.addEventListener("submit", (event) => {
    const form = event.target.closest("form[data-form]");
    if (!form) return;
    event.preventDefault();
    const formId = form.getAttribute("data-form");
    const handler = formHandlers[formId];
    if (handler) handler(form);
  });

  document.addEventListener("change", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const handler = clickHandlers[action];
    if (handler) handler(actionEl);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) {
      document.querySelectorAll(".dropdown.open").forEach((el) => el.classList.remove("open"));
    }
  });

  document.addEventListener("mouseover", (event) => {
    const dropdown = event.target.closest(".dropdown");
    if (!dropdown) return;
    dropdown.classList.add("open");
  });

  document.addEventListener("mouseout", (event) => {
    const dropdown = event.target.closest(".dropdown");
    if (!dropdown) return;
    dropdown.classList.remove("open");
  });

  document.addEventListener("mouseover", (event) => {
    const select = event.target.closest("select");
    if (!select) return;
    const optionCount = select.options.length;
    select.size = Math.min(optionCount, 8);
  });

  document.addEventListener("mouseout", (event) => {
    const select = event.target.closest("select");
    if (!select) return;
    select.size = 1;
  });

  window.addEventListener("error", (event) => {
    logSecurityEvent({
      type: "client.error",
      message: event.message || "unknown",
      source: event.filename || "",
      line: event.lineno || 0,
      column: event.colno || 0,
    });
    logTelemetry("client.error", { message: event.message || "unknown" });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logSecurityEvent({
      type: "client.unhandledrejection",
      message: String(event.reason || "unknown"),
    });
    logTelemetry("client.unhandledrejection", { message: String(event.reason || "unknown") });
  });
}

export function startApp() {
  bindEvents();
  window.addEventListener("hashchange", renderApp);
  subscribe(renderApp);
  if (!window.location.hash) navigate("/");
  security.startSecurityMonitoring();
  moderator.startMonitoring();
  offlineQueue.start(() => true);
  renderApp();
}
