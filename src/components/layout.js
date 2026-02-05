import { navBar } from "./nav.js";

export function layoutShell(state, content, route) {
  return `
    <div class="app">
      ${navBar(state, route)}
      <main class="main">
        ${content}
      </main>
    </div>
  `;
}
