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
  hasPermission,
  getPermissionsCatalog,
  updateUserPermissions,
  resetState,
} from "./state/store.js";
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
  "/onboarding": onboardingPage,
  "/discover": discoverPage,
  "/matches": matchesPage,
  "/chat/:id": chatPage,
  "/profile": profilePage,
};

const appRootId = "app";

const formHandlers = {
  onboarding: (form) => {
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      age: Number(formData.get("age") || 0),
      city: String(formData.get("city") || "").trim(),
      bio: String(formData.get("bio") || "").trim(),
      interests: String(formData.get("interests") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6),
      vibe: String(formData.get("vibe") || "").trim(),
    };
    completeOnboarding(payload);
    navigate("/discover");
  },
  profile: (form) => {
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    const instagram = String(formData.get("instagram") || "").trim();
    const emailOk = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const instaOk = !instagram || /^@?[\w.]{2,30}$/.test(instagram);
    if (!emailOk || !instaOk) {
      notifyContactInvalid();
      return;
    }
    updateProfile({
      name: String(formData.get("name") || "").trim(),
      avatarUrl: String(formData.get("avatarUrl") || "").trim(),
      username: String(formData.get("username") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      bio: String(formData.get("bio") || "").trim(),
      interests: String(formData.get("interests") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
      vibe: String(formData.get("vibe") || "").trim(),
      contact: {
        email,
        instagram,
      },
      settings: {
        showCity: formData.get("settings.showCity") === "on",
        showInterests: formData.get("settings.showInterests") === "on",
        contactMutual: formData.get("settings.contactMutual") === "on",
        notifyMatches: formData.get("settings.notifyMatches") === "on",
        notifyMessages: formData.get("settings.notifyMessages") === "on",
        notifyContact: formData.get("settings.notifyContact") === "on",
      },
    });
  },
  message: (form) => {
    const formData = new FormData(form);
    const text = String(formData.get("message") || "").trim();
    const matchId = String(formData.get("matchId") || "");
    if (!text || !matchId) return;
    sendMessage(matchId, text);
    form.reset();
  },
  introMessage: (form) => {
    const formData = new FormData(form);
    const text = String(formData.get("message") || "").trim();
    const matchId = String(formData.get("matchId") || "");
    if (!text || !matchId) return;
    sendIntroMessage(matchId, text);
    form.reset();
  },
  adminMenu: (form) => {
    const formData = new FormData(form);
    const label = String(formData.get("menuLabel") || "").trim();
    addAdminMenu(label);
    form.reset();
  },
  adminSubmenu: (form) => {
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const label = String(formData.get("submenuLabel") || "").trim();
    if (menuId) addAdminSubmenu(menuId, label);
    form.reset();
  },
  adminMenuContent: (form) => {
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const content = String(formData.get("content") || "");
    if (menuId) updateAdminMenuContent(menuId, content);
  },
  adminSubmenuContent: (form) => {
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const submenuId = String(formData.get("submenuId") || "");
    const content = String(formData.get("content") || "");
    if (menuId && submenuId) updateAdminSubmenuContent(menuId, submenuId, content);
  },
  createAdmin: (form) => {
    const formData = new FormData(form);
    createAdmin({
      name: String(formData.get("name") || "").trim(),
      username: String(formData.get("username") || "").trim(),
      password: String(formData.get("password") || ""),
    });
    form.reset();
  },
  adminMenuSettings: (form) => {
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const active = formData.get("active") === "on";
    const visibleTo = ["user", "admin", "superadmin"].filter(
      (role) => formData.get(`visibleTo:${role}`) === "on"
    );
    if (menuId) updateAdminMenuSettings(menuId, { active, visibleTo });
  },
  adminSubmenuSettings: (form) => {
    const formData = new FormData(form);
    const menuId = String(formData.get("menuId") || "");
    const submenuId = String(formData.get("submenuId") || "");
    const active = formData.get("active") === "on";
    const visibleTo = ["user", "admin", "superadmin"].filter(
      (role) => formData.get(`visibleTo:${role}`) === "on"
    );
    if (menuId && submenuId) updateAdminSubmenuSettings(menuId, submenuId, { active, visibleTo });
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
        contactMutual: formData.get("settings.contactMutual") === "on",
        notifyMatches: formData.get("settings.notifyMatches") === "on",
        notifyMessages: formData.get("settings.notifyMessages") === "on",
        notifyContact: formData.get("settings.notifyContact") === "on",
        compactMode: formData.get("settings.compactMode") === "on",
        largeText: formData.get("settings.largeText") === "on",
        language: nextLang,
      },
    });
    if (nextLang) setLanguage(nextLang);
  },
  permissions: (form) => {
    const formData = new FormData(form);
    const userId = String(formData.get("userId") || "");
    const permissions = getPermissionsCatalog()
      .map((perm) => perm.key)
      .filter((key) => formData.get(`perm:${key}`) === "on");
    if (userId) updateUserPermissions(userId, permissions);
  },
  signIn: (form) => {
    const formData = new FormData(form);
    signIn({
      username: String(formData.get("username") || "").trim(),
      password: String(formData.get("password") || ""),
    });
    if (getState().auth.currentUserId) {
      navigate("/discover");
    }
  },
  signUp: (form) => {
    const formData = new FormData(form);
    const draft = getState().ui.signupDraft || {};
    const payload = {
      name: String(formData.get("name") || draft.name || "").trim(),
      age: Number(formData.get("age") || draft.age || 0),
      city: String(formData.get("city") || draft.city || "").trim(),
      bio: String(formData.get("bio") || draft.bio || "").trim(),
      interests: String(formData.get("interests") || draft.interests || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 6),
      vibe: String(formData.get("vibe") || draft.vibe || "").trim(),
      username: String(formData.get("username") || draft.username || "").trim(),
      password: String(formData.get("password") || draft.password || ""),
    };
    signUp(payload);
    if (getState().auth.currentUserId) {
      completeOnboarding(payload);
      clearSignupDraft();
      navigate("/discover");
    }
  },
};

const clickHandlers = {
  like: (target) => {
    const profileId = target.getAttribute("data-profile");
    likeProfile(profileId);
  },
  pass: (target) => {
    const profileId = target.getAttribute("data-profile");
    passProfile(profileId);
  },
  openChat: (target) => {
    const matchId = target.getAttribute("data-match");
    if (matchId) navigate(`/chat/${matchId}`);
  },
  go: (target) => {
    const path = target.getAttribute("data-go");
    if (path) navigate(path);
  },
  resetDemo: () => {
    resetState();
    navigate("/onboarding");
  },
  signOut: () => {
    signOut();
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
    const menuId = target.getAttribute("data-menu");
    const dir = target.getAttribute("data-dir");
    if (menuId && dir) moveAdminMenu(menuId, dir);
  },
  moveSubmenu: (target) => {
    const menuId = target.getAttribute("data-menu");
    const submenuId = target.getAttribute("data-submenu");
    const dir = target.getAttribute("data-dir");
    if (menuId && submenuId && dir) moveAdminSubmenu(menuId, submenuId, dir);
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
    const userId = target.getAttribute("data-user");
    if (userId) deleteAdmin(userId);
  },
};

function renderApp() {
  const state = getState();
  const { route, params } = resolveRoute(window.location.hash, Object.keys(pages));

  if (!state.auth.currentUserId && !["/signin", "/signup", "/demo", "/"].includes(route)) {
    navigate("/signin");
    return;
  }

  if (state.auth.currentUserId && !state.me && route === "/") {
    navigate("/onboarding");
    return;
  }

  const currentUser = getCurrentUser();
  const requires = {
    "/users": "users.view",
    "/matches-manage": "matches.manage",
    "/content-moderate": "content.moderate",
    "/reports": "reports.view",
    "/settings": "settings.manage",
    "/admin": "admins.manage",
  };
  const requiredPerm = requires[route];
  if (requiredPerm && !hasPermission(currentUser, requiredPerm)) {
    navigate("/discover");
    return;
  }

  const pageRenderer = pages[route] || homePage;
  const content = pageRenderer(state, params, currentUser);
  const root = document.getElementById(appRootId);
  if (!root) return;

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
}

export function startApp() {
  bindEvents();
  window.addEventListener("hashchange", renderApp);
  subscribe(renderApp);
  if (!window.location.hash) navigate("/");
  renderApp();
}
