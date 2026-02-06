import { t } from "../app/i18n.js";

export function signInPage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page auth-page">
      <div class="panel">
        <h2>${t(lang, "signInTitle")}</h2>
        <p>${t(lang, "signInBody")}</p>
        <form class="form" data-form="signIn">
          <label>
            ${t(lang, "signInUser")}
            <input name="username" type="text" placeholder="tu_usuario" required />
          </label>
          <label>
            ${t(lang, "signInPassword")}
            <input id="signin-password" name="password" type="password" required />
          </label>
          <label class="password-toggle">
            <span>${t(lang, "showPassword")}</span>
            <input type="checkbox" data-action="togglePassword" data-target="signin-password" />
          </label>
          <button class="primary" type="submit">${t(lang, "signInButton")}</button>
        </form>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "signInAsideTitle")}</h3>
        <p>${t(lang, "signInAsideBody")}</p>
        <button class="ghost" data-action="go" data-go="/signup">${t(lang, "signInAsideCta")}</button>
      </aside>
    </section>
  `;
}
