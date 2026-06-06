/* ============================================================
   CONFIG
   ============================================================ */
const MY_USERNAME = 'CplShephard';
const FRIENDS = ['elyionn', 'yalnie'];

/* Language color map */
const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c',
  Java: '#b07219', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
  PHP: '#4F5D95', Ruby: '#701516', Go: '#00ADD8', Rust: '#dea584',
  Swift: '#F05138', Kotlin: '#A97BFF', Dart: '#00B4AB',
  Shell: '#89e051', Vue: '#41b883', Svelte: '#ff3e00',
  Lua: '#000080', Assembly: '#6E4C13', Makefile: '#427819',
  Default: '#00ff41'
};

function getLangColor(lang) {
  return LANG_COLORS[lang] || LANG_COLORS.Default;
}

/* ============================================================
   GITHUB API FETCH (no auth — public endpoints)
   ============================================================ */
async function ghFetch(path) {
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github.v3+json' }
  });
  if (!r.ok) throw new Error(`GitHub API ${r.status}: ${path}`);
  return r.json();
}

/* ============================================================
   POPULATE MY PROFILE
   ============================================================ */
async function loadMyProfile() {
  try {
    const user = await ghFetch(`/users/${MY_USERNAME}`);

    // Banner
    document.getElementById('bannerAvatar').src = user.avatar_url;
    document.getElementById('bannerName').textContent = user.name || user.login;
    document.getElementById('bannerBio').textContent = user.bio || `@${user.login} on GitHub`;

    // Stats
    document.getElementById('statRepos').textContent = user.public_repos;
    document.getElementById('statFollowers').textContent = user.followers;
    document.getElementById('statFollowing').textContent = user.following;
    document.getElementById('statYear').textContent = new Date(user.created_at).getFullYear();

    // Nav link
    document.querySelector('.nav-logo').textContent = user.login;

  } catch(e) {
    console.warn('Profile load error:', e);
    document.getElementById('bannerBio').textContent = 'Could not load profile — GitHub API may be rate limited.';
  }
}

/* ============================================================
   POPULATE PUBLIC REPOS
   ============================================================ */
async function loadMyRepos() {
  const grid = document.getElementById('reposGrid');
  try {
    // Fetch up to 100 repos, sorted by updated
    const repos = await ghFetch(`/users/${MY_USERNAME}/repos?sort=updated&per_page=100&type=public`);

    if (!repos.length) {
      grid.innerHTML = `<div class="loading-repos"><p>No public repositories found.</p></div>`;
      return;
    }

    grid.innerHTML = repos.map((repo, i) => {
      const langColor = getLangColor(repo.language);
      const desc = repo.description
        ? repo.description.length > 100 ? repo.description.slice(0, 97) + '…' : repo.description
        : '<span style="opacity:.4">No description provided.</span>';

      return `
        <div class="repo-card reveal reveal-delay-${(i % 3) + 1}">
          <div class="repo-header">
            <div>
              <div class="repo-name">${repo.name}</div>
              ${repo.fork ? '<span class="repo-fork-badge">FORK</span>' : ''}
            </div>
            <span class="repo-visibility ${repo.private ? '' : 'public'}">${repo.private ? 'PRIVATE' : 'PUBLIC'}</span>
          </div>

          <div class="repo-desc">${desc}</div>

          <div class="repo-footer">
            <div class="repo-meta">
              ${repo.language ? `
                <div class="repo-meta-item repo-lang">
                  <span class="repo-lang-dot" style="background:${langColor}; box-shadow:0 0 6px ${langColor}80;"></span>
                  ${repo.language}
                </div>` : ''}
              <div class="repo-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                ${repo.stargazers_count}
              </div>
              <div class="repo-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
                  <path d="M6 9v1a6 6 0 006 6M18 9v1"/>
                </svg>
                ${repo.forks_count}
              </div>
            </div>
            <a class="repo-link" href="${repo.html_url}" target="_blank" rel="noopener">VIEW ↗</a>
          </div>
        </div>
      `;
    }).join('');

    observeReveal();
  } catch(e) {
    console.warn('Repos load error:', e);
    grid.innerHTML = `<div class="loading-repos"><p style="color:var(--g3)">Could not load repositories — GitHub API may be rate limited.</p></div>`;
  }
}

/* ============================================================
   POPULATE FRIENDS
   ============================================================ */
async function loadFriends() {
  const grid = document.getElementById('friendsGrid');

  const cards = await Promise.all(FRIENDS.map(async (username, idx) => {
    try {
      const user = await ghFetch(`/users/${username}`);
      const repos = await ghFetch(`/users/${username}/repos?sort=updated&per_page=6&type=public`);

      const topLangs = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 4);
      const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
      const badge = user.bio ? 'DEVELOPER' : 'GITHUB USER';

      return `
        <div class="dev-card glass reveal reveal-delay-${idx + 1}">
          <div class="dev-card-top">
            <img src="${user.avatar_url}" alt="${user.login}"
              class="dev-avatar"
              onerror="this.outerHTML='<div class=\\'dev-avatar dev-avatar-fallback\\'>${username[0].toUpperCase()}</div>'">
            <div class="dev-info">
              <div class="dev-name">${user.name || user.login}</div>
              <div class="dev-handle">@${user.login} · GitHub</div>
              <div class="dev-role-badge">${badge}</div>
            </div>
          </div>

          ${user.bio ? `
          <div class="dev-bio">
            <p>${user.bio}</p>
          </div>` : ''}

          <div class="dev-stats">
            <div class="dev-stat">
              <div class="dev-stat-val">${user.public_repos}</div>
              <div class="dev-stat-lbl">Repos</div>
            </div>
            <div class="dev-stat">
              <div class="dev-stat-val">${user.followers}</div>
              <div class="dev-stat-lbl">Followers</div>
            </div>
            <div class="dev-stat">
              <div class="dev-stat-val">${totalStars}</div>
              <div class="dev-stat-lbl">Stars</div>
            </div>
          </div>

          ${topLangs.length ? `
          <div class="dev-tags">
            ${topLangs.map(l => `
              <span class="dev-tag" style="border-color:${getLangColor(l)}40; color:${getLangColor(l)}">
                ${l}
              </span>`).join('')}
          </div>` : ''}

          <div class="dev-links">
            <a class="btn-outline" href="${user.html_url}" target="_blank" rel="noopener">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub Profile
            </a>
          </div>
        </div>
      `;
    } catch(e) {
      console.warn(`Friend load error (${username}):`, e);
      return `
        <div class="dev-card glass reveal reveal-delay-${idx + 1}">
          <div class="dev-card-top">
            <img src="https://avatars.githubusercontent.com/${username}" alt="${username}" class="dev-avatar">
            <div class="dev-info">
              <div class="dev-name">@${username}</div>
              <div class="dev-handle">${username} · GitHub</div>
              <div class="dev-role-badge">GITHUB USER</div>
            </div>
          </div>
          <div class="dev-bio"><p>Profile could not be loaded — GitHub API may be rate limited.</p></div>
          <div class="dev-links">
            <a class="btn-outline" href="https://github.com/${username}" target="_blank">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              GitHub Profile
            </a>
          </div>
        </div>
      `;
    }
  }));

  grid.innerHTML = cards.join('');
  observeReveal();
}

/* ============================================================
   LAMBDA RAIN
   ============================================================ */
function spawnLambdas() {
  const container = document.getElementById('lambda-rain');
  const chars = ['λ', 'Λ', 'λ'];
  const sizes  = [40, 60, 80, 100, 120];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.className = 'l';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.fontSize = sizes[Math.floor(Math.random() * sizes.length)] + 'px';
    el.style.animationDuration = (18 + Math.random() * 22) + 's';
    el.style.animationDelay = (Math.random() * 18) + 's';
    container.appendChild(el);
  }
}

/* ============================================================
   INTERSECTION OBSERVER (REVEAL)
   ============================================================ */
function observeReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  els.forEach(el => obs.observe(el));
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  spawnLambdas();
  observeReveal();

  // Load all data in parallel
  await Promise.all([
    loadMyProfile(),
    loadMyRepos(),
    loadFriends()
  ]);

  observeReveal();
});
