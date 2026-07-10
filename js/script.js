const MY_USERNAME = 'CplShephard';
const FRIENDS = ['elyionn', 'yalnie'];

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', SCSS: '#c6538c',
  Java: '#b07219', C: '#555555', 'C++': '#f34b7d', 'C#': '#178600',
  Shell: '#89e051', Lua: '#000080', Default: 'var(--md-sys-color-primary)'
};

function initThemeEngine() {
  const toggleBtn = document.getElementById('theme-toggle');
  const themeLink = document.getElementById('theme-link');
  let savedTheme = localStorage.getItem('m3-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'css/dark.css' : 'css/light.css');
  themeLink.setAttribute('href', savedTheme);
  updateThemeClassAndIcon(savedTheme);
  toggleBtn.addEventListener('click', () => {
    let currentTheme = themeLink.getAttribute('href');
    let newTheme = (currentTheme === 'css/light.css') ? 'css/dark.css' : 'css/light.css';
    themeLink.setAttribute('href', newTheme);
    localStorage.setItem('m3-theme', newTheme);
    updateThemeClassAndIcon(newTheme);
  });
}

function updateThemeClassAndIcon(themePath) {
  const iconEl = document.querySelector('#theme-toggle md-icon');
  if (themePath === 'css/dark.css') {
    document.body.classList.remove('light'); document.body.classList.add('dark');
    if (iconEl) iconEl.textContent = 'light_mode';
  } else {
    document.body.classList.remove('dark'); document.body.classList.add('light');
    if (iconEl) iconEl.textContent = 'dark_mode';
  }
}

async function ghFetch(path) {
  const cacheKey = `gh_cache_${path.replace(/\//g, '_')}`;
  try {
    const r = await fetch(`https://api.github.com${path}`, { headers: { Accept: 'application/vnd.github.v3+json' } });
    if (!r.ok) throw new Error(`Status ${r.status}`);
    const data = await r.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (e) {
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) return JSON.parse(cachedData);
    throw e;
  }
}

async function loadMyProfile() {
  const statsGrid = document.querySelector('.stats-grid');
  const bannerBio = document.getElementById('bannerBio');
  const avatarImg = document.getElementById('bannerAvatar');
  
  try {
    const user = await ghFetch(`/users/${MY_USERNAME}`);
    avatarImg.src = user.avatar_url;
    avatarImg.classList.add('m3-img-loaded');
    document.getElementById('bannerName').textContent = user.name || user.login;
    if (user.bio) { bannerBio.textContent = user.bio; bannerBio.style.display = 'block'; } else { bannerBio.style.display = 'none'; }
    document.getElementById('statRepos').textContent = user.public_repos;
    document.getElementById('statFollowers').textContent = user.followers;
    document.getElementById('statFollowing').textContent = user.following;
    document.getElementById('statYear').textContent = new Date(user.created_at).getFullYear();
    document.querySelector('.nav-logo').textContent = user.login;
    statsGrid.style.display = 'grid';
  } catch(e) {
    bannerBio.style.display = 'none';
    if (statsGrid) statsGrid.style.display = 'none';
  }
}

async function loadMyRepos() {
  const section = document.getElementById('repos-section');
  const grid = document.getElementById('reposGrid');
  try {
    const repos = await ghFetch(`/users/${MY_USERNAME}/repos?sort=updated&per_page=100&type=public`);
    if (!repos.length) { section.style.display = 'none'; return; }
    section.style.display = 'block';
    grid.innerHTML = repos.map(repo => {
      const langColor = LANG_COLORS[repo.language] || LANG_COLORS.Default;
      const desc = repo.description ? (repo.description.length > 100 ? repo.description.slice(0, 97) + '…' : repo.description) : 'No project configuration parameters specified.';
      return `
        <div class="m3-card m3-card-elevated m3-repo-card">
          <div class="repo-header">
            <div class="repo-title-block">
              <span class="repo-name m3-title-large">${repo.name}</span>
              <div class="repo-badge-row"><span class="m3-sub-badge public">Public</span></div>
            </div>
          </div>
          <p class="repo-desc m3-body-medium">${desc}</p>
          <div class="repo-footer">
            <div class="repo-meta-group">
              ${repo.language ? `<div class="repo-meta-item"><span class="repo-lang-dot" style="background:${langColor}"></span><span class="m3-body-small">${repo.language}</span></div>` : ''}
              <div class="repo-meta-item"><span class="material-symbols-outlined" style="font-size: 16px;">star</span><span class="m3-body-small">${repo.stargazers_count}</span></div>
            </div>
            <md-text-button href="${repo.html_url}" target="_blank">View</md-text-button>
          </div>
        </div>`;
    }).join('');
  } catch(e) {
    if (section) section.style.display = 'none';
  }
}

async function loadFriends() {
  const section = document.getElementById('friends-section');
  const grid = document.getElementById('friendsGrid');
  try {
    const cards = await Promise.all(FRIENDS.map(async username => {
      const user = await ghFetch(`/users/${username}`);
      const repos = await ghFetch(`/users/${username}/repos?sort=updated&per_page=100&type=public`);
      const topLangs = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 3);
      const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
      
      return `
        <div class="m3-card m3-card-elevated m3-dev-card">
          <div class="dev-card-header">
            <img src="${user.avatar_url}" alt="${user.login}" class="dev-avatar-m3" onload="this.classList.add('m3-img-loaded')" onerror="this.style.display='none'">
            <div class="dev-identity">
              <span class="m3-title-large" style="color:var(--md-sys-color-on-surface);">${user.name || user.login}</span>
              <span class="m3-body-small" style="color:var(--md-sys-color-on-surface-variant);">@${user.login}</span>
            </div>
          </div>
          <div class="dev-m3-stats">
            <div><div class="m3-title-large">${user.public_repos}</div><div class="m3-body-small">Repos</div></div>
            <div><div class="m3-title-large">${user.followers}</div><div class="m3-body-small">Followers</div></div>
            <div><div class="m3-title-large">${totalStars}</div><div class="m3-body-small">Stars</div></div>
          </div>
          ${topLangs.length ? `
          <div class="dev-tag-row">
            ${topLangs.map(l => `<span class="m3-sub-badge" style="border-left: 3px solid ${LANG_COLORS[l] || LANG_COLORS.Default}; padding-left: 6px;">${l}</span>`).join('')}
          </div>` : ''}
          <md-filled-button href="${user.html_url}" target="_blank">GitHub Profile</md-filled-button>
        </div>`;
    }));
    section.style.display = 'block';
    grid.innerHTML = cards.join('');
  } catch(e) {
    if (section) section.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initThemeEngine();
  customElements.whenDefined('md-filled-button').then(() => {
    Promise.all([loadMyProfile(), loadMyRepos(), loadFriends()]);
  });
});
