// app.js - Main SPA Router with Role-Based Access Control
const BASE = '/primary_shools';
const API = `${BASE}/api`;
const APP_VER = '2026-06-12-6'; // Bumped for dashboard finance table scroll

let currentPage = '';
let searchTimer = null;
let currentUser = { username: '', role: 'admin', user_id: 0 };
let pageLoadToken = 0;
let notifications = [];
let isLoginAnimating = false;
let _invDataRef = null;  // set by inventory.js for notif checks

// ═══════════════════════════════════════════════════════════════
// PERMISSION MATRIX
// access: 'full' | 'readonly' | 'limited' | 'none'
// For 'staff' role: loaded dynamically from DB per-user
// ═══════════════════════════════════════════════════════════════
const PERMISSIONS = {
  admin: {
    dashboard: 'full', students: 'full', staff: 'full', classes: 'full',
    attendance: 'full', attendance_report: 'full', assessments: 'full', scores: 'full', finance: 'full', transport: 'full',
    meals: 'full', health: 'full', communication: 'full', calendar: 'full',
    schedule: 'full', inventory: 'full', reports: 'full', settings: 'full'
  },
  teacher: {
    dashboard: 'readonly', students: 'readonly', staff: 'none', classes: 'readonly',
    attendance: 'full', attendance_report: 'full', assessments: 'full', scores: 'full', finance: 'none', transport: 'none',
    meals: 'readonly', health: 'full', communication: 'full', calendar: 'full',
    schedule: 'full', inventory: 'none', reports: 'readonly', settings: 'password'
  },
  staff: {
    // Default fallback — overridden by DB values loaded at login
    dashboard: 'readonly', students: 'none', staff: 'none', classes: 'none',
    attendance: 'none', attendance_report: 'none', assessments: 'none', scores: 'none', finance: 'none', transport: 'none',
    meals: 'none', health: 'none', communication: 'none', calendar: 'none',
    schedule: 'readonly', inventory: 'none', reports: 'none', settings: 'none'
  }
};

// Dynamic staff permissions (loaded from DB after login)
let staffPermissions = null;

// Role labels in Lao
const ROLE_LABELS = { admin: 'ຜູ້ດູແລລະບົບ', teacher: 'ຄູສອນ', staff: 'ພະນັກງານ' };

// Sidebar nav items per section
const NAV_ITEMS = [
  {
    section: 'ຫຼັກ', items: [
      { page: 'dashboard', icon: 'fas fa-th-large', label: 'ໜ້າຫຼັກ' },
      { page: 'students', icon: 'fas fa-user-graduate', label: 'ນັກຮຽນ' },
      { page: 'staff', icon: 'fas fa-chalkboard-teacher', label: 'ຄູ ແລະ ພະນັກງານ' },
      { page: 'classes', icon: 'fas fa-door-open', label: 'ຫ້ອງຮຽນ' },
      { page: 'schedule', icon: 'fas fa-calendar-alt', label: 'ຕາລາງຮຽນ' },
      { page: 'attendance', icon: 'fas fa-clipboard-check', label: 'ການເຂົ້າຮຽນ' },
      // { page: 'assessments', icon: 'fas fa-star-half-alt', label: 'ການປະເມີນ' },
      { page: 'scores', icon: 'fas fa-trophy', label: 'ຄະແນນ' },
    ]
  },
  {
    section: 'ບໍລິການ', items: [
      { page: 'finance', icon: 'fas fa-wallet', label: 'ການເງິນ' },
      { page: 'transport', icon: 'fas fa-bus', label: 'ລົດຮັບສົ່ງ' },
      { page: 'meals', icon: 'fas fa-utensils', label: 'ອາຫານ' },
    ]
  },
  {
    section: 'ສຸຂະພາບ & ສື່ສານ', items: [
      { page: 'health', icon: 'fas fa-heartbeat', label: 'ສຸຂະພາບ' },
      // { page: 'communication', icon: 'fas fa-bullhorn', label: 'ການສື່ສານ' },
      { page: 'calendar', icon: 'fas fa-calendar-alt', label: 'ກິດຈະກຳ' },
    ]
  },
  {
    section: 'ລາຍງານ & ລະບົບ', items: [
      { page: 'inventory', icon: 'fas fa-boxes', label: 'ວັດຖຸ & ສາງ' },
      // { page: 'reports', icon: 'fas fa-chart-bar', label: 'ລາຍງານ' },
      { page: 'settings', icon: 'fas fa-cog', label: 'ການຕັ້ງຄ່າ' },
    ]
  },
];

const pageHeadings = {
  dashboard: 'ໜ້າຫຼັກ', students: 'ນັກຮຽນ', staff: 'ຄູ ແລະ ພະນັກງານ',
  classes: 'ຫ້ອງຮຽນ', attendance: 'ການເຂົ້າຮຽນ', attendance_report: 'ລາຍງານການເຂົ້າຮຽນ',  scores: 'ຄະແນນ',
  finance: 'ການເງິນ', transport: 'ລົດຮັບສົ່ງ', meals: 'ອາຫານ',
  health: 'ສຸຂະພາບ', calendar: 'ກິດຈະກຳ', schedule: 'ຕາລາງຮຽນ',
  inventory: 'ວັດຖຸ & ສາງ',  settings: 'ການຕັ້ງຄ່າ'
};

// Helper: get current role's permission for a page
function can(page) {
  const role = currentUser.role || 'staff';
  // Staff: use dynamic DB permissions if loaded
  if (role === 'staff' && staffPermissions) {
    return staffPermissions[page] || 'none';
  }
  const perms = PERMISSIONS[role] || PERMISSIONS.staff;
  return perms[page] || 'none';
}

// ═══════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════
async function boot() {
  try {
    const res = await fetch(`${API}/auth.php?action=check`).then(r => r.json());
    if (res.logged_in) {
      currentUser = { username: res.username, role: res.role, user_id: res.user_id };

      // ── Load staff permissions from DB ──────────────────────
      if (res.role === 'staff') {
        try {
          const pdata = await fetch(`${API}/permissions.php?action=mine`).then(r => r.json());
          if (pdata && !pdata.error) {
            staffPermissions = pdata;
          }
        } catch (e) { console.warn('Could not load staff permissions', e); }
      } else {
        staffPermissions = null;
      }
      // ────────────────────────────────────────────────────────

      document.getElementById('login-page').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      document.getElementById('user-name').textContent = res.username;
      document.getElementById('user-role').textContent = ROLE_LABELS[res.role] || res.role;
      document.getElementById('user-avatar').textContent = (res.username || 'A')[0].toUpperCase();
      setTopbarUser(res.username, res.role);
      setTopbarDate();
      buildSidebar();
      await loadSchoolBrand();
      await loadNotifications();
      
      // Poll notifications every 10 seconds
      if (window._notifTimer) clearInterval(window._notifTimer);
      window._notifTimer = setInterval(loadNotifications, 10000);

      navigateTo('dashboard');
    } else {
      document.getElementById('login-page').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
    }
  } catch (e) {
    console.error('Boot failed:', e);
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR - render based on role
// ═══════════════════════════════════════════════════════════════
function buildSidebar() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) return;
  let html = '';
  for (const section of NAV_ITEMS) {
    const visible = section.items.filter(i => can(i.page) !== 'none');
    if (!visible.length) continue;
    html += `<div class="sidebar-section-label">${section.section}</div>`;
    for (const item of visible) {
      html += `<a class="nav-item" data-page="${item.page}" onclick="navigateTo('${item.page}')">
        <span class="nav-icon"><i class="${item.icon}"></i></span> <span class="nav-text">${item.label}</span>
      </a>`;
    }
  }
  nav.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════
// SCHOOL BRAND - load school name & logo into sidebar
// ═══════════════════════════════════════════════════════════════
async function loadSchoolBrand() {
  try {
    const r = await fetch(`${API}/settings.php?action=get`).then(res => res.json());
    if (r && r.success && r.data) {
      const d = r.data;
      const nameLo = (d.school_name_lo || '').trim();
      const nameEn = (d.school_name_en || '').trim();
      const displayName = nameLo || nameEn || 'ສີຄຳ ພັດທະນາ';
      const subName    = nameEn && nameLo ? nameEn : 'ໂຮງຮຽນ';

      const nameEl = document.getElementById('sidebar-school-name');
      const subEl  = document.getElementById('sidebar-school-sub');
      if (nameEl) nameEl.textContent = displayName;
      if (subEl)  subEl.textContent  = subName;
    }
  } catch (e) {
    console.warn('Could not load school brand', e);
  }
}

function setTopbarUser(username, role) {
  const nameEl = document.getElementById('topbar-user-name');
  const roleEl = document.getElementById('topbar-user-role');
  const avatarEl = document.getElementById('topbar-user-avatar');
  const safeName = (username || 'User').trim() || 'User';

  if (nameEl) nameEl.textContent = safeName;
  if (roleEl) roleEl.textContent = ROLE_LABELS[role] || role || '-';
  if (avatarEl) avatarEl.textContent = safeName[0].toUpperCase();
}

function setTopbarDate() {
  const dateEl = document.getElementById('topbar-date-inline');
  const greetEl = document.getElementById('topbar-day-greeting');
  if (!dateEl && !greetEl) return;

  const d = new Date();
  const weekdayIdx = d.getDay();
  const weekdays = ['ວັນອາທິດ', 'ວັນຈັນ', 'ວັນອັງຄານ', 'ວັນພຸດ', 'ວັນພະຫັດ', 'ວັນສຸກ', 'ວັນເສົາ'];
  const months = ['ມັງກອນ', 'ກຸມພາ', 'ມີນາ', 'ເມສາ', 'ພຶດສະພາ', 'ມິຖຸນາ', 'ກໍລະກົດ', 'ສິງຫາ', 'ກັນຍາ', 'ຕຸລາ', 'ພະຈິກ', 'ທັນວາ'];

  const weekday = weekdays[weekdayIdx] || '';
  const day = d.getDate();
  const month = months[d.getMonth()] || '';
  const year = d.getFullYear() + 543;
  const greeting = weekdayIdx === 5 ? 'ສະບາຍດີວັນສຸກ' : `ສະບາຍດີ${weekday}`;

  if (greetEl) greetEl.textContent = greeting;
  if (dateEl) dateEl.innerHTML = `<i class="fas fa-calendar-day"></i> ${weekday} ${day} ${month} ${year}`;
}

function playLoginDoorAnimation() {
  const loginPage = document.getElementById('login-page');
  if (!loginPage || isLoginAnimating) return Promise.resolve();
  isLoginAnimating = true;
  loginPage.classList.add('login-opening');
  return new Promise(resolve => {
    setTimeout(() => {
      loginPage.classList.remove('login-opening');
      isLoginAnimating = false;
      resolve();
    }, 920);
  });
}

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  boot();
  setTopbarDate();
  setInterval(setTopbarDate, 60000);

  // ── Password show/hide toggle ──────────────────────────────
  const toggleBtn = document.getElementById('toggle-password');
  const pwInput = document.getElementById('login-password');
  const eyeIcon = document.getElementById('eye-icon');
  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwInput.type === 'password';
      pwInput.type = isHidden ? 'text' : 'password';
      eyeIcon.className = isHidden ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  }

  // ── Login form submit ─────────────────────────────────────
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btnText = document.getElementById('login-btn-text');
    const btnLoading = document.getElementById('login-btn-loading');
    const submitBtn = document.getElementById('login-submit-btn');
    const errorEl = document.getElementById('login-error');

    // Show loading state
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    if (submitBtn) submitBtn.disabled = true;
    errorEl.style.display = 'none';

    const fd = new FormData();
    fd.append('username', document.getElementById('login-username').value.trim());
    fd.append('password', document.getElementById('login-password').value);

    try {
      const res = await fetch(`${API}/auth.php?action=login`, { method: 'POST', body: fd }).then(r => r.json());
      if (res.success) {
        await playLoginDoorAnimation();
        await boot();
      } else {
        errorEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ';
        errorEl.style.display = 'flex';
      }
    } catch (err) {
      errorEl.innerHTML = '<i class="fas fa-wifi"></i> ບໍ່ສາມາດເຊື່ອມຕໍ່ Server ໄດ້';
      errorEl.style.display = 'flex';
    } finally {
      // Restore button
      if (btnText) btnText.style.display = '';
      if (btnLoading) btnLoading.style.display = 'none';
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

// Prevent browser back-forward cache from showing stale loading screens
window.addEventListener('pageshow', (e) => {
  if (e.persisted) location.reload();
});

async function handleLogout() {
  await fetch(`${API}/auth.php?action=logout`);
  location.reload();
}

// ═══════════════════════════════════════════════════════════════
// ROUTER
// ═══════════════════════════════════════════════════════════════
function navigateTo(page) {
  // Permission check
  const perm = can(page);
  if (perm === 'none') {
    document.getElementById('page-content').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <h3>ບໍ່ມີສິດເຂົ້າເຖິງ</h3>
        <p>ສິດຂອງທ່ານ (${ROLE_LABELS[currentUser.role] || currentUser.role}) ບໍ່ອະນຸຍາດໃຫ້ເຂົ້າໜ້ານີ້</p>
      </div>`;
    return;
  }
  currentPage = page;
  document.getElementById('page-heading').textContent = pageHeadings[page] || page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.getElementById('global-search').value = '';
  document.getElementById('notif-panel').style.display = 'none';
  loadPage(page, perm);
}

async function loadPage(page, perm) {
  const el = document.getElementById('page-content');
  const token = ++pageLoadToken;
  el.innerHTML = '<div class="loading-state"><div class="loading-spinner"></div><p>ກຳລັງໂຫຼດ...</p></div>';
  try {
    const mod = await import(`./views/${page}.js?v=${APP_VER}`);
    if (token !== pageLoadToken) return;

    await Promise.race([
      Promise.resolve(mod.render(el, perm)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Page load timeout')), 10000))
    ]);
  } catch (e) {
    if (token !== pageLoadToken) return;
    el.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error</h3><p>${e.message}</p></div>`;
    console.error(e);
  }
}

function reloadCurrentPage() { if (currentPage) loadPage(currentPage, can(currentPage)); }

function onSearch(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    document.dispatchEvent(new CustomEvent('app:search', { detail: val }));
  }, 300);
}

// ═══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════
async function loadNotifications() {
  try {
    const res = await apiFetch(`${API}/notifications.php`);
    const raw = (res && Array.isArray(res.notifications)) ? res.notifications : [];

    // Filter out internal flags
    const fromServer = raw.filter(n => n.id !== '__inv_flag__');
    const hasInvFlag = raw.some(n => n.id === '__inv_flag__');

    // ── Static inventory check (frontend JS array) ──────────────
    const invNotifs = [];
    if (hasInvFlag && typeof window.getInventoryData === 'function') {
      const invData = window.getInventoryData();
      if (Array.isArray(invData)) {
        invData.forEach(item => {
          if (item.status === 'ໝົດ') {
            invNotifs.push({
              id: 'inv_js_' + item.id,
              icon: '🔴',
              title: 'ວັດຖຸ: ' + item.name + ' — ໝົດ!',
              body: 'ຈຳນວນ 0 ' + (item.unit || '') + ' (ຂັ້ນຕ່ຳ: ' + item.min + ')',
              time: 'ສາງ', type: 'inventory', read: false,
            });
          } else if (item.status === 'ໃກ້ໝົດ') {
            invNotifs.push({
              id: 'inv_js_' + item.id,
              icon: '📦',
              title: 'ວັດຖຸ: ' + item.name + ' — ໃກ້ໝົດ',
              body: 'ຈຳນວນ ' + item.qty + ' ' + (item.unit || '') + ' (ຂັ້ນຕ່ຳ: ' + item.min + ')',
              time: 'ສາງ', type: 'inventory', read: false,
            });
          }
        });
      }
    }

    // Preserve read state from previous load
    const prevRead = {};
    const oldIds = new Set(notifications.map(n => n.id));
    const isInitialLoad = notifications.length === 0;
    
    notifications.forEach(n => { if (n.read) prevRead[n.id] = true; });

    notifications = [...fromServer, ...invNotifs].map(n => ({
      ...n,
      read: prevRead[n.id] || false,
    }));

    // Auto popup for new unread notifications
    const newUnread = notifications.filter(n => !n.read && !oldIds.has(n.id));
    if (!isInitialLoad && newUnread.length > 0) {
      newUnread.forEach(n => toast('🔔 ' + n.title));
    }

    updateNotifBadge();
    
    // Auto update panel if open
    const panel = document.getElementById('notif-panel');
    if (panel && panel.style.display === 'block') {
      renderNotifications();
    }
  } catch(e) {
    console.warn('loadNotifications error:', e);
  }
}
function updateNotifBadge() {
  if (!Array.isArray(notifications)) notifications = [];
  const unread = notifications.filter(n => n && !n.read).length;
  const badge = document.getElementById('notif-badge');
  if (badge) { badge.textContent = unread; badge.style.display = unread > 0 ? 'flex' : 'none'; }
}

function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    // Refresh before showing
    loadNotifications().then(() => renderNotifications());
    setTimeout(() => document.addEventListener('click', function h(e) {
      if (!panel.contains(e.target) && e.target.id !== 'notif-btn') { panel.style.display = 'none'; }
      document.removeEventListener('click', h);
    }), 100);
  }
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!Array.isArray(notifications)) notifications = [];
  const unread = notifications.filter(n => !n.read);
  const read   = notifications.filter(n =>  n.read);
  const ordered = [...unread, ...read];
  list.innerHTML = ordered.length
    ? ordered.map(n => {
        const navPage = n.type === 'calendar' ? 'calendar' : n.type === 'finance' ? 'finance' : n.type === 'inventory' ? 'inventory' : '';
        return `
        <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;gap:12px;background:${n.read ? 'transparent' : '#f0fdf4'};cursor:pointer"
             onclick="markRead('${n.id}')${navPage ? `;navigateTo('${navPage}')` : ''}">
          <span style="font-size:24px">${n.icon}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:${n.read ? '500' : '700'};color:var(--text-primary)">${n.title}</div>
            <div style="font-size:12px;color:var(--text-secondary)">${n.body}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:2px">${n.time}</div>
          </div>
          ${!n.read ? '<span style="width:8px;height:8px;background:var(--accent-green);border-radius:50%;margin-top:4px;flex-shrink:0"></span>' : ''}
        </div>`;
      }).join('')
    : '<div style="padding:40px;text-align:center;color:var(--text-muted)">ບໍ່ມີການແຈ້ງເຕືອນ</div>';
}

function markRead(id) {
  const n = notifications.find(x => x.id === id); if (n) n.read = true;
  renderNotifications(); updateNotifBadge();
}
function markAllRead() {
  notifications.forEach(n => n.read = true); renderNotifications(); updateNotifBadge();
}

// ═══════════════════════════════════════════════════════════════
// SHARED UTILITIES
// ═══════════════════════════════════════════════════════════════
function toast(msg, type = 'success') {
  if (typeof Swal !== 'undefined') {
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toastEl) => {
        toastEl.onmouseenter = Swal.stopTimer;
        toastEl.onmouseleave = Swal.resumeTimer;
      }
    });
    Toast.fire({ icon: type, title: msg });
  } else {
    // Fallback if Swal not loaded
    const c = document.getElementById('toast-container');
    if(!c) return;
    const d = document.createElement('div');
    d.className = `toast toast-${type}`;
    d.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    c.appendChild(d);
    setTimeout(() => d.remove(), 3000);
  }
}

window.awaitConfirm = async function(title, text) {
  if (typeof Swal !== 'undefined') {
    const result = await Swal.fire({
      title: title || 'ຢືນຢັນການລົບ',
      text: text || 'ການກະທຳນີ້ບໍ່ສາມາດກູ້ຄືນໄດ້!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: '<i class="fas fa-trash"></i> ຢືນຢັນລົບ',
      cancelButtonText: 'ຍົກເລີກ',
      background: '#ffffff',
      backdrop: `rgba(15, 23, 42, 0.5)`
    });
    return result.isConfirmed;
  }
  // Fallback
  return confirm(text || title || 'ຢືນຢັນ?');
}

function openModal(html) {
  document.getElementById('modal-container').innerHTML =
    `<div class="modal-overlay" onclick="if(event.target===this)closeModal()">${html}</div>`;
}
function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

async function apiFetch(url, opts = {}) {
  // Add cache busting for GET requests
  if (!opts.method || opts.method.toUpperCase() === 'GET') {
    const sep = url.includes('?') ? '&' : '?';
    url += `${sep}_t=${Date.now()}`;
    opts.cache = 'no-store';
  }
  return (await fetch(url, opts)).json();
}
async function apiPost(url, data) {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => fd.append(k, v ?? ''));
  return apiFetch(url, { method: 'POST', body: fd });
}

function fmtDate(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  const months = ['ມ.ກ.', 'ກ.ພ.', 'ມີ.ນ.', 'ເມ.ສ.', 'ພ.ພ.', 'ມິ.ຖ.', 'ກ.ລ.', 'ສ.ຫ.', 'ກ.ຍ.', 'ຕ.ລ.', 'ພ.ຈ.', 'ທ.ວ.'];
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear() + 543}`;
}
function fmtDateNumeric(d) {
  if (!d) return '-';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '-';
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}
function numFmt(n) { return Number(parseFloat(n) || 0).toLocaleString('en-US'); }

// ─── Exports to global ─────────────────────────────────────────
Object.assign(window, {
  navigateTo, handleLogout, closeModal, toast, openModal, awaitConfirm,
  apiFetch, apiPost, fmtDate, fmtDateNumeric, numFmt, reloadCurrentPage, onSearch,
  toggleNotifications, markRead, markAllRead, loadNotifications,
  BASE, API,
  currentUser: () => currentUser,
  can,
});
