import { loadState, saveState, clearState } from "./storage.js";
import { seedProfiles, safeTips, seedUsers } from "./mockData.js";
import { t } from "../i18n.js";
import { randomId, formatTime } from "../../utils/format.js";

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
    safetyTips: safeTips,
    ui: {
      toast: null,
      signupStep: 1,
      signupDraft: {},
      lang: "es",
    },
  };
}

let state = loadState() || createInitialState();
if (!state.ui) {
  state.ui = { toast: null, signupStep: 1, signupDraft: {}, lang: "es" };
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
    password,
    role: "user",
    name: name || username,
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
    (item) =>
      item.username.toLowerCase() === username.toLowerCase() &&
      item.password === password
  );
  if (!user) {
    setToast(t(state.ui.lang, "toastBadCreds"), "error");
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
  ];
}

export function hasPermission(user, permissionKey) {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  const perms = user.permissions || [];
  return perms.includes(permissionKey);
}

export function updateUserPermissions(userId, permissions) {
  const users = state.auth.users.map((user) =>
    user.id === userId ? { ...user, permissions: Array.from(new Set(permissions)) } : user
  );
  setState({ ...state, auth: { ...state.auth, users } });
  setToast(t(state.ui.lang, "toastPermissionsSaved"), "success");
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
