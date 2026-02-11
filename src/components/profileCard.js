export function profileCard(profile) {
  return `
    <article class="card">
      <div class="card-media" style="background: ${profile.color}">
        ${
          profile.avatarUrl
            ? `<img class="card-avatar" src="${profile.avatarUrl}" alt="${profile.name}" />`
            : `<span class="card-initials">${profile.name.slice(0, 1)}</span>`
        }
      </div>
      <div class="card-body">
        <h3>${profile.name}, ${profile.age}</h3>
        <p class="muted">${profile.city}</p>
        <p>${profile.bio}</p>
        <div class="tag-list">
          ${profile.interests.map((item) => `<span class="tag">${item}</span>`).join("")}
        </div>
      </div>
    </article>
  `;
}
