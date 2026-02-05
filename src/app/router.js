function normalizeHash(hash) {
  const cleaned = (hash || "").replace(/^#/, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

function splitPath(path) {
  return path.split("/").filter(Boolean);
}

export function resolveRoute(hash, routePatterns) {
  const path = normalizeHash(hash || "/");
  const pathParts = splitPath(path);

  for (const pattern of routePatterns) {
    const patternParts = splitPath(pattern);
    if (patternParts.length !== pathParts.length) continue;

    const params = {};
    let matched = true;
    for (let i = 0; i < patternParts.length; i += 1) {
      const part = patternParts[i];
      const value = pathParts[i];
      if (part.startsWith(":")) {
        params[part.slice(1)] = value;
      } else if (part !== value) {
        matched = false;
        break;
      }
    }

    if (matched) {
      return { route: pattern, params };
    }
  }

  return { route: path === "/" ? "/" : "/404", params: {} };
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}
