// ---------------------------------------------------------------------------
// Helpers d'authentification côté client (mini app Snapdesk).
// Le jeton de session est stocké en localStorage et envoyé en Bearer.
// ---------------------------------------------------------------------------
(function () {
  const TOKEN_KEY = 'snapdesk_token';
  const USER_KEY = 'snapdesk_user';
  const ADMIN_KEY = 'snapdesk_admin';
  const COM_KEY = 'snapdesk_commercial';
  const NAME_KEY = 'snapdesk_name';
  const ROLE_KEY = 'snapdesk_role';

  const Auth = {
    token: () => localStorage.getItem(TOKEN_KEY),
    user: () => localStorage.getItem(USER_KEY),
    isAdmin: () => localStorage.getItem(ADMIN_KEY) === '1',
    // Bloc/persona attribué à un non-admin ('' pour un admin ou non attribué).
    commercial: () => localStorage.getItem(COM_KEY) || '',
    name: () => localStorage.getItem(NAME_KEY) || '',
    role: () => localStorage.getItem(ROLE_KEY) || '',

    setSession(token, user, admin, commercial, name, role) {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, user);
      localStorage.setItem(ADMIN_KEY, admin ? '1' : '0');
      localStorage.setItem(COM_KEY, commercial || '');
      localStorage.setItem(NAME_KEY, name || '');
      localStorage.setItem(ROLE_KEY, role || '');
    },

    clear() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ADMIN_KEY);
      localStorage.removeItem(COM_KEY);
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(ROLE_KEY);
    },

    logout() {
      Auth.clear();
      location.replace('/login.html');
    },

    // À appeler en haut d'une page protégée. Redirige vers le login si pas de jeton.
    requireAuth() {
      if (!Auth.token()) {
        location.replace('/login.html');
        return false;
      }
      return true;
    },

    // fetch avec le jeton ; en cas de 401, on déconnecte et on renvoie vers le login.
    async fetch(url, opts) {
      opts = opts || {};
      const headers = Object.assign({}, opts.headers || {}, {
        Authorization: 'Bearer ' + (Auth.token() || ''),
      });
      const res = await fetch(url, Object.assign({}, opts, { headers }));
      if (res.status === 401) {
        Auth.clear();
        location.replace('/login.html');
        throw new Error('Session expirée — reconnecte-toi.');
      }
      return res;
    },

    // Injecte une petite barre "connecté en tant que … · Déconnexion" dans un conteneur.
    renderUserBar(el) {
      if (!el) return;
      const u = Auth.user() || 'connecté';
      el.innerHTML =
        `<span class="userbar-name">${u.replace(/[&<>]/g, '')}</span>` +
        (Auth.isAdmin() ? `<a class="btn small" href="/users.html">👤 Utilisateurs</a>` : '') +
        `<button class="btn small" id="logout-btn">Déconnexion</button>`;
      const b = el.querySelector('#logout-btn');
      if (b) b.addEventListener('click', () => Auth.logout());
    },
  };

  window.Auth = Auth;
})();
