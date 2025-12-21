import { sb } from '../supabase.js';

export async function requireAdmin() {
  const { data } = await sb.auth.getSession();
  const user = data.session?.user;
  if (!user) {
    alert('Please log in.');
    location.href = '/views/pages/login.html';
    return null;
  }
  const { data: rows, error } = await sb.from('users').select('role').eq('id', user.id).limit(1).single();
  if (error || !rows || !['admin','owner'].includes(rows.role)) {
    alert('Admin access required.');
    location.href = '/views/pages/index.html';
    return null;
  }
  return user;
}

export async function mountAdminShell() {
  // mount sidebar
  const sidebarHtml = await fetch('/views/partials/sidebar.html').then(r=>r.text());
  const sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = sidebarHtml;
}

export async function mountDashboard() {
  await mountAdminShell();
  // Realtime counter example for notifications (optional)
  const channel = sb.channel('room:admin-notifs')
    .on('postgres_changes', { event:'INSERT', schema:'public', table:'notifications' }, (payload) => {
      const el = document.getElementById('recentNotifs');
      if (!el) return;
      const n = payload.new;
      const item = document.createElement('div');
      item.className = 'card';
      item.innerHTML = `<div class="body toolbar"><span>${n.title}</span><span class="muted">${new Date(n.created_at).toLocaleString()}</span></div>`;
      el.prepend(item);
    })
    .subscribe();
}
