const STORAGE_KEY = "friending_state";
const LEGACY_KEYS = ["teender_state_v1"];
const CURRENT_VERSION = 3;

function migrateV1ToV2(state) {
  return {
    ...state,
    ui: {
      ...state.ui,
      adminPreview: state.ui?.adminPreview || { menus: {}, submenus: {} },
      auditLogs: state.ui?.auditLogs || [],
      userSettingsTab: state.ui?.userSettingsTab || "privacy",
      activeProfileId: state.ui?.activeProfileId || null,
      userSearchQuery: state.ui?.userSearchQuery || "",
    },
  };
}

function migrateV2ToV3(state) {
  return {
    ...state,
    ui: {
      ...state.ui,
      moderationRestrictions: state.ui?.moderationRestrictions || {},
      activityLog: state.ui?.activityLog || [],
      telemetry: state.ui?.telemetry || { events: [], counters: {} },
      securityLogs: state.ui?.securityLogs || [],
      moderationLogs: state.ui?.moderationLogs || [],
    },
  };
}

function runMigrations(snapshot) {
  let version = snapshot.version || 1;
  let data = snapshot.data || snapshot;
  if (version === 1) {
    data = migrateV1ToV2(data);
    version = 2;
  }
  if (version === 2) {
    data = migrateV2ToV3(data);
    version = 3;
  }
  return { version, data };
}

export function loadState() {
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyKey = LEGACY_KEYS.find((key) => window.localStorage.getItem(key));
      raw = legacyKey ? window.localStorage.getItem(legacyKey) : null;
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const migrated = runMigrations(parsed);
    return migrated.data;
  } catch (error) {
    return null;
  }
}

export function saveState(state) {
  try {
    const payload = {
      version: CURRENT_VERSION,
      data: state,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    // Silently ignore storage errors (private mode, quota, etc.)
  }
}

export function clearState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // ignore
  }
}
