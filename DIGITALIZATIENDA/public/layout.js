// ── layout.js — Sidebar + Toast compartido ──────────────────────────────────

const NAV_ITEMS = [
  { id: 'dashboard',    icon: '📊', label: 'Dashboard',    href: '/dashboard' },
  { id: 'productos',    icon: '📦', label: 'Productos',    href: '/productos' },
  { id: 'categorias',  icon: '🏷️',  label: 'Categorías',  href: '/categorias' },
  { id: 'proveedores', icon: '🚚', label: 'Proveedores',   href: '/proveedores' },
  { id: 'clientes',    icon: '👥', label: 'Clientes',      href: '/clientes' },
  { id: 'facturas',    icon: '🧾', label: 'Facturas',      href: '/facturas' },
  { id: 'estadisticas',icon: '📈', label: 'Estadísticas',  href: '/estadisticas' },
];

let _currentUser = null;

async function initLayout(activeId) {
  // Obtener datos de usuario
  try {
    const r = await fetch('/api/auth/me', { credentials: 'include' });
    if (r.ok) _currentUser = await r.json();
  } catch {}

  const user = _currentUser || {};
  const initials = (user.nombre || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="sidebar-brand">
      <img src="/logo.png" alt="Logo">
      <div>
        <span>Digitaliza<br>Tu Tienda</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section">Menú Principal</div>
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item ${item.id === activeId ? 'active' : ''}">
          <span class="icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="avatar">${initials}</div>
        <div class="sidebar-user-info">
          <strong>${user.nombre || 'Usuario'}</strong>
          <small>${user.rol || 'rol'}</small>
        </div>
      </div>
      <button class="btn-logout" onclick="logout()">🚪 Cerrar sesión</button>
    </div>
  `;

  // Topbar title
  const active = NAV_ITEMS.find(i => i.id === activeId);
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle && active) topbarTitle.textContent = `${active.icon} ${active.label}`;

  // Toast container
  if (!document.getElementById('toast-container')) {
    const tc = document.createElement('div');
    tc.id = 'toast-container';
    document.body.appendChild(tc);
  }
}

async function logout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}

// ── TOASTS ───────────────────────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), duration);
}

// ── API HELPERS ───────────────────────────────────────────────────────────────
async function api(method, url, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── MODAL HELPERS ─────────────────────────────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// ── FORMAT ────────────────────────────────────────────────────────────────────
function fmt(n) { return Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0 }); }
function fmtMoney(n) { return '$' + Number(n ?? 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString('es-CO') : '—'; }
