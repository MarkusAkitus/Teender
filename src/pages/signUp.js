import { t } from "../app/i18n.js";

export function signUpPage(state) {
  const step = state.ui.signupStep || 1;
  const draft = state.ui.signupDraft || {};
  const lang = state.ui.lang || "es";
  return `
    <section class="page auth-page">
      <div class="panel">
        <h2>${t(lang, "signUpTitle")}</h2>
        <p>${t(lang, "signUpBody")}</p>
        <form class="form" data-form="signUp" data-step="${step}">
          ${
            step === 1
              ? `
            <label>
              ${t(lang, "signUpName")}
              <input name="name" type="text" placeholder="${t(lang, "signUpName")}" data-required="true" value="${draft.name || ""}" />
            </label>
          `
              : ""
          }
          ${
            step === 2
              ? `
            <label>
              ${t(lang, "signUpUser")}
              <input name="username" type="text" placeholder="tu_usuario" data-required="true" value="${draft.username || ""}" />
            </label>
            <label>
              ${t(lang, "signUpPassword")}
              <input name="password" type="password" data-required="true" value="${draft.password || ""}" />
            </label>
          `
              : ""
          }
          ${
            step === 3
              ? `
            <label>
              ${t(lang, "formAge")}
              <input name="age" type="number" min="13" max="19" data-required="true" value="${draft.age || ""}" />
            </label>
          `
              : ""
          }
          ${
            step === 4
              ? `
            <label>
              ${t(lang, "formCity")}
              <input name="city" type="text" placeholder="${t(lang, "formCity")}" data-required="true" value="${draft.city || ""}" />
            </label>
          `
              : ""
          }
          ${
            step === 5
              ? `
            <label>
              ${t(lang, "formBio")}
              <textarea name="bio" rows="3" placeholder="${t(lang, "formBio")}" data-required="true">${draft.bio || ""}</textarea>
            </label>
            <label>
              ${t(lang, "formInterests")}
              <input name="interests" type="text" placeholder="${t(lang, "interestsPlaceholder")}" data-required="true" value="${draft.interests || ""}" />
            </label>
            <label>
              ${t(lang, "formVibe")}
              <input name="vibe" type="text" placeholder="${t(lang, "vibePlaceholder")}" data-required="true" value="${draft.vibe || ""}" />
            </label>
          `
              : ""
          }
          <div class="step-actions">
            ${step > 1 ? `<button class="ghost" type="button" data-action="signupPrev">${t(lang, "signUpBack")}</button>` : ""}
            ${
              step < 5
                ? `<button class="primary" type="button" data-action="signupNext">${t(lang, "signUpNext")}</button>`
                : `<button class="primary" type="submit">${t(lang, "signUpCreate")}</button>`
            }
          </div>
        </form>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "signUpAsideTitle")}</h3>
        <p>${t(lang, "signUpAsideBody")}</p>
        <button class="ghost" data-action="go" data-go="/signin">${t(lang, "signUpAsideCta")}</button>
      </aside>
    </section>
  `;
}
