import { t } from "../app/i18n.js";

export function onboardingPage(state) {
  const lang = state.ui.lang || "es";
  return `
    <section class="page">
      <div class="panel">
        <h2>${t(lang, "onboardingTitle")}</h2>
        <p>${t(lang, "onboardingBody")}</p>
        <form class="form" data-form="onboarding">
          <label>
            ${t(lang, "formName")}
            <input name="name" type="text" placeholder="${t(lang, "formName")}" required />
          </label>
          <label>
            ${t(lang, "formAge")}
            <input name="age" type="number" min="13" max="19" required />
          </label>
          <label>
            ${t(lang, "formCity")}
            <input name="city" type="text" placeholder="${t(lang, "formCity")}" />
          </label>
          <label>
            ${t(lang, "formBio")}
            <textarea name="bio" rows="3" placeholder="${t(lang, "formBio")}"></textarea>
          </label>
          <label>
            ${t(lang, "formInterests")}
            <input name="interests" type="text" placeholder="${t(lang, "interestsPlaceholder")}" />
          </label>
          <label>
            ${t(lang, "formVibe")}
            <input name="vibe" type="text" placeholder="${t(lang, "vibePlaceholder")}" />
          </label>
          <button class="primary" type="submit">${t(lang, "formSubmitStart")}</button>
        </form>
      </div>
      <aside class="panel soft">
        <h3>${t(lang, "onboardingAsideTitle")}</h3>
        <ul class="list">
          <li>${t(lang, "onboardingRule1")}</li>
          <li>${t(lang, "onboardingRule2")}</li>
          <li>${t(lang, "onboardingRule3")}</li>
        </ul>
      </aside>
    </section>
  `;
}
