export function toastView(toast) {
  if (!toast) return "";
  return `
    <div class="toast toast-${toast.tone}">
      <span>${toast.message}</span>
    </div>
  `;
}
