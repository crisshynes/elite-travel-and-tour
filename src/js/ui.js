// /public/js/ui.js
import { sb } from './supabase.js';

export async function mountShell({ withSidebar = false, requireAdmin = false } = {}) {
  try {
    // Load header and footer partials
    const [headerHtml, footerHtml] = await Promise.all([
      fetch('/views/partials/header.html').then(r => r.text()),
      fetch('/views/partials/footer.html').then(r => r.text())
    ]);

    const h = document.getElementById('header');
    const f = document.getElementById('footer');
    if (h) h.innerHTML = headerHtml;
    if (f) f.innerHTML = footerHtml;

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  } catch (err) {
    console.error('Error mounting shell:', err);
  }

  // --- Notification feed toggle
  document.addEventListener('click', (e) => {
    const feed = document.getElementById('notifFeed');
    if (!feed) return;
    if (e.target.closest('#bellBtn')) {
      feed.classList.toggle('hidden');
    } else if (!e.target.closest('#notifFeed')) {
      feed.classList.add('hidden');
    }
  });

  // --- Mobile menu toggle
  document.addEventListener('click', (e) => {
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');
    if (!menuBtn || !navLinks) return;
    if (e.target.closest('#menuBtn')) {
      navLinks.classList.toggle('hidden');
    }
  });

  // --- Auth state handling
  function setAuthButtons(session) {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    if (session?.user) {
      loginBtn?.classList.add('hidden');
      logoutBtn?.classList.remove('hidden');
    } else {
      loginBtn?.classList.remove('hidden');
      logoutBtn?.classList.add('hidden');
    }
  }

  const { data } = await sb.auth.getSession();
  setAuthButtons(data.session);

  sb.auth.onAuthStateChange((_event, session) => {
    setAuthButtons(session);
    if (session?.user) {
      subscribeNotifications(session.user.id);
    }
  });

  // --- Logout button action
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await sb.auth.signOut();
      location.href = '/views/pages/login.html';
    });
  }

  // --- Subscribe to realtime notifications
  async function subscribeNotifications(userId) {
    sb.channel(`ui-notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const n = payload.new;
        const list = document.getElementById('notifList');
        const bellCount = document.getElementById('bellCount');
        if (list) {
          const el = document.createElement('div');
          el.className = 'card';
          el.innerHTML = `
            <div class="body">
              <strong>${n.title}</strong>
              <div class="muted">${n.message}</div>
              <span class="badge">${new Date(n.created_at).toLocaleString()}</span>
            </div>`;
          list.prepend(el);
        }
        if (bellCount) {
          const count = parseInt(bellCount.textContent || '0', 10) + 1;
          bellCount.textContent = String(count);
          bellCount.classList.remove('hidden');
        }
      })
      .subscribe();
  }

  if (data.session?.user) {
    subscribeNotifications(data.session.user.id);
  }

  // --- Sidebar mounting (optional)
  if (withSidebar) {
    try {
      const sidebarHtml = await fetch('/views/partials/sidebar.html').then(r => r.text());
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.innerHTML = sidebarHtml;
    } catch (err) {
      console.error('Error mounting sidebar:', err);
    }
  }

  // --- Admin role guard (optional)
  if (requireAdmin) {
    const { data: session } = await sb.auth.getSession();
    const user = session.session?.user;
    if (!user) {
      alert('Please log in.');
      location.href = '/views/pages/login.html';
      return;
    }
    const { data: row, error } = await sb.from('users').select('role').eq('id', user.id).limit(1).single();
    if (error || !row || !['admin','owner'].includes(row.role)) {
      alert('Admin access required.');
      location.href = '/views/pages/index.html';
      return;
    }
  }
}
