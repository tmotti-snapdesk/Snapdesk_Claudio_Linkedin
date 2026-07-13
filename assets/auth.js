// ---------------------------------------------------------------------------
// Helpers d'authentification côté client (mini app Snapdesk).
// Le jeton de session est stocké en localStorage et envoyé en Bearer.
// ---------------------------------------------------------------------------
(function () {
  const TOKEN_KEY = 'snapdesk_token';
  const USER_KEY = 'snapdesk_user';

  const Auth = {
    token: () => localStorage.getItem(TOKEN_KEY),
    user: () => localStorage.getItem(USER_KEY),

    setSession(token, user) {
      localStorage.setItem(TOKEN_KEY, token);
      if (user) localStorage.setItem(USER_KEY, user);
    },

    clear() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
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
        `<button class="btn small" id="logout-btn">Déconnexion</button>`;
      const b = el.querySelector('#logout-btn');
      if (b) b.addEventListener('click', () => Auth.logout());
    },
  };

  window.Auth = Auth;
})();
