export function emptyState(title, subtitle, actionLabel, actionPath) {
  return `
    <section class="empty">
      <div class="empty-illustration"></div>
      <h2>${title}</h2>
      <p>${subtitle}</p>
      <button class="primary" data-action="go" data-go="${actionPath}">
        ${actionLabel}
      </button>
    </section>
  `;
}
