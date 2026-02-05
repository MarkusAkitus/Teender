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
import { safetyPage } from "../pages/safety.js";
import { signInPage } from "../pages/signIn.js";
import { signUpPage } from "../pages/signUp.js";
import { demoPage } from "../pages/demo.js";
import { t } from "./i18n.js";
import { adminPage } from "../pages/admin.js";

const pages = {
  "/": homePage,
  "/signin": signInPage,
  "/signup": signUpPage,
  "/demo": demoPage,
  "/admin": adminPage,
  "/onboarding": onboardingPage,
  "/discover": discoverPage,
  "/matches": matchesPage,
  "/chat/:id": chatPage,
  "/profile": profilePage,
  "/safety": safetyPage,
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
    updateProfile({
      name: String(formData.get("name") || "").trim(),
      username: String(formData.get("username") || "").trim(),
      city: String(formData.get("city") || "").trim(),
      bio: String(formData.get("bio") || "").trim(),
      interests: String(formData.get("interests") || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8),
      vibe: String(formData.get("vibe") || "").trim(),
      visibility: String(formData.get("visibility") || "friends"),
      contact: {
        email: String(formData.get("email") || "").trim(),
        instagram: String(formData.get("instagram") || "").trim(),
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
        navigate("/signin");
        return;
      }
      return;
    }
    navigate(path);
  },
  changeLang: (target) => {
    const lang = target.value;
    setLanguage(lang);
  },
  adminUserChange: (target) => {
    const userId = target.value;
    setAdminUserId(userId);
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

  if (route === "/admin") {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "superadmin") {
      navigate("/discover");
      return;
    }
  }

  const pageRenderer = pages[route] || homePage;
  const content = pageRenderer(state, params, getCurrentUser());
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

  document.addEventListener("change", (event) => {
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl) return;
    const action = actionEl.getAttribute("data-action");
    const handler = clickHandlers[action];
    if (handler) handler(actionEl);
  });
}

export function startApp() {
  bindEvents();
  window.addEventListener("hashchange", renderApp);
  subscribe(renderApp);
  if (!window.location.hash) navigate("/");
  renderApp();
}
