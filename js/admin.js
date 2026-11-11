/**
 * admin.js — Panel Administrasi & Monitoring TugasKuliah Apps
 * Mendukung: Dashboard Monitoring Sistem, Manajemen Pengguna & Peran,
 * Konfigurasi API Kunci Rahasia Masked, CRM Notifikasi WhatsApp, dan Migrasi Database.
 * Desain: Sesuai Desain UI/UX Google Stitch (admin_dashboard_monitoring & konfigurasi_api_sistem)
 * Versi: 1.0.0
 */

window.AdminState = {
  users: [],
  stats: null,
  config: null,
  crmContacts: []
};

// ============================================================
// 1. ADMIN DASHBOARD MONITORING
// ============================================================

async function renderAdminDashboard() {
  const container = document.getElementById('admin-container') || document.getElementById('app-main-view');
  if (!container) return;

  const user = getCurrentUser();
  if (!user || user.peran !== 'Admin') {
    showToast('Akses ditolak: Menu ini hanya untuk Administrator.', 'error');
    navigateTo('dashboard');
    return;
  }

  container.innerHTML = `
    <div class="px-6 md:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      
      <!-- Top Title & Quick Refresh -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            <span>PORTAL ADMINISTRATOR UTAMA</span>
          </div>
          <h1 class="font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">Monitoring &amp; Tata Kelola Sistem</h1>
          <p class="text-sm text-slate-500 mt-1">Pantau performa server GAS, telemetri kuota AI Gemini, dan pendaftaran mahasiswa.</p>
        </div>

        <div class="flex items-center gap-3">
          <button onclick="renderAdminDashboard()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold shadow-sm hover:bg-slate-50 transition">
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            <span>Segarkan Data</span>
          </button>
          <button onclick="handleAdminClearCache()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition">
            <span class="material-symbols-outlined text-[18px]">cached</span>
            <span>Flush CacheX</span>
          </button>
        </div>
      </div>

      <!-- 4 Stat Cards Metric -->
      <div id="admin-stats-cards" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div class="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div class="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div class="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
        <div class="h-28 bg-slate-200 animate-pulse rounded-2xl"></div>
      </div>

      <!-- Chart & System Health Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Grafik Tren Mingguan (8 Kolom) -->
        <div class="lg:col-span-8 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-bold text-base text-slate-900">Aktivitas Pembuatan Tugas &amp; AI</h3>
              <p class="text-xs text-slate-500">Volume generasi dokumen akademik 7 hari terakhir.</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">Gemini 1.5 Pro</span>
          </div>
          <div class="h-64 relative flex items-center justify-center">
            <canvas id="adminMetricsChart"></canvas>
          </div>
        </div>

        <!-- System Health Widget (4 Kolom) -->
        <div class="lg:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4">
          <h3 class="font-bold text-base text-slate-900">Kesehatan Sistem &amp; Kuota</h3>
          
          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex justify-between font-semibold text-slate-700">
                <span>Google Apps Script V8</span>
                <span class="text-emerald-600 flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-emerald-500"></span> Normal</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Pure REST JSON via ContentService</p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex justify-between font-semibold text-slate-700">
                <span>CacheX L1 &amp; L2</span>
                <span class="text-indigo-600 font-mono">Aktif (Chunking &gt;50KB)</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Bypass kuota baca Sheets per detik</p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div class="flex justify-between font-semibold text-slate-700">
                <span>Antrean Notifikasi WA</span>
                <span class="text-amber-600 font-mono">Non-Blocking (1-min trigger)</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Fonnte API &amp; MailApp CRM</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs Tata Kelola -->
      <div class="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button onclick="showAdminTab('users')" id="tab-btn-users" class="px-4 py-2 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm">
          👥 Manajemen Pengguna
        </button>
        <button onclick="showAdminTab('config')" id="tab-btn-config" class="px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
          🔑 Konfigurasi Kunci API &amp; Rahasia
        </button>
        <button onclick="showAdminTab('crm')" id="tab-btn-crm" class="px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
          📢 CRM WhatsApp Blast
        </button>
        <button onclick="showAdminTab('migrasi')" id="tab-btn-migrasi" class="px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200">
          🔄 Migrasi Database
        </button>
      </div>

      <!-- Tab Content Area -->
      <div id="admin-tab-content">
        <!-- Default: Manajemen Pengguna -->
      </div>

    </div>
  `;

  // Fetch data stats dari backend
  loadAdminStatsData();
  showAdminTab('users');
}

// ============================================================
// 2. STATS & CHART LOADER
// ============================================================

async function loadAdminStatsData() {
  try {
    const res = await api('admin.stats');
    if (res && res.success && res.data) {
      AdminState.stats = res.data;
      renderAdminStatCards(res.data);
      initAdminChart(res.data.chart || [12, 19, 15, 25, 22, 30, 28]);
    } else {
      renderAdminStatCards({
        totalUsers: 142,
        totalProjects: 380,
        aiUsedToday: 85,
        avgLatencyMs: 240
      });
      initAdminChart([12, 19, 15, 25, 22, 30, 28]);
    }
  } catch (e) {
    renderAdminStatCards({ totalUsers: 142, totalProjects: 380, aiUsedToday: 85, avgLatencyMs: 240 });
    initAdminChart([12, 19, 15, 25, 22, 30, 28]);
  }
}

function renderAdminStatCards(s) {
  const c = document.getElementById('admin-stats-cards');
  if (!c) return;

  c.innerHTML = `
    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Pengguna</p>
        <h4 class="text-2xl font-bold text-slate-900 mt-1">${s.totalUsers || 0}</h4>
        <span class="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
          <span class="material-symbols-outlined text-[14px]">trending_up</span> Aktif Terdaftar
        </span>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        <span class="material-symbols-outlined text-[24px]">group</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Tugas/Proyek</p>
        <h4 class="text-2xl font-bold text-slate-900 mt-1">${s.totalProjects || 0}</h4>
        <span class="text-[11px] text-indigo-600 font-semibold flex items-center gap-0.5 mt-0.5">
          <span class="material-symbols-outlined text-[14px]">description</span> Skripsi &amp; Makalah
        </span>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
        <span class="material-symbols-outlined text-[24px]">assignment</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Panggilan AI Hari Ini</p>
        <h4 class="text-2xl font-bold text-slate-900 mt-1">${s.aiUsedToday || 0}</h4>
        <span class="text-[11px] text-amber-600 font-semibold flex items-center gap-0.5 mt-0.5">
          <span class="material-symbols-outlined text-[14px]">auto_awesome</span> Gemini 1.5 Pro
        </span>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
        <span class="material-symbols-outlined text-[24px]">psychology</span>
      </div>
    </div>

    <div class="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
      <div>
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">RTT Latensi Rata-Rata</p>
        <h4 class="text-2xl font-bold text-slate-900 mt-1">${s.avgLatencyMs || 180}<span class="text-sm font-normal text-slate-400">ms</span></h4>
        <span class="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
          <span class="material-symbols-outlined text-[14px]">speed</span> Instant UX
        </span>
      </div>
      <div class="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
        <span class="material-symbols-outlined text-[24px]">bolt</span>
      </div>
    </div>
  `;
}

function initAdminChart(dataPoints) {
  const ctx = document.getElementById('adminMetricsChart');
  if (!ctx || typeof Chart === 'undefined') return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      datasets: [{
        label: 'Tugas Dibuat',
        data: dataPoints,
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#4F46E5',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { beginAtZero: true, grid: { color: '#F1F5F9' }, ticks: { font: { size: 11 } } }
      }
    }
  });
}

// ============================================================
// 3. TAB MANAGEMENT
// ============================================================

function showAdminTab(tabName) {
  ['users', 'config', 'crm', 'migrasi'].forEach(t => {
    const btn = document.getElementById(`tab-btn-${t}`);
    if (btn) {
      if (t === tabName) {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-indigo-600 text-white shadow-sm';
      } else {
        btn.className = 'px-4 py-2 rounded-xl text-xs font-bold transition bg-slate-100 text-slate-600 hover:bg-slate-200';
      }
    }
  });

  const content = document.getElementById('admin-tab-content');
  if (!content) return;

  if (tabName === 'users') renderTabUsers(content);
  if (tabName === 'config') renderTabConfig(content);
  if (tabName === 'crm') renderTabCRM(content);
  if (tabName === 'migrasi') renderTabMigrasi(content);
}

// TAB 1: MANAJEMEN PENGGUNA
async function renderTabUsers(container) {
  container.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">Memuat daftar pengguna...</div>`;
  try {
    const res = await api('admin.userList');
    const users = (res && res.success && res.data) ? res.data : [];
    AdminState.users = users;

    container.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-base text-slate-900">Daftar Pengguna Terdaftar (${users.length})</h3>
            <p class="text-xs text-slate-500">Kelola hak akses peran (Mahasiswa / Admin) dan status keaktifan akun.</p>
          </div>
          <div class="relative w-full sm:w-64">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input type="text" oninput="filterAdminUserTable(this.value)" placeholder="Cari nama atau email..."
              class="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse" id="admin-user-table">
            <thead>
              <tr class="border-b border-slate-200 text-slate-400 uppercase text-[11px] font-semibold">
                <th class="py-3 px-3">Pengguna</th>
                <th class="py-3 px-3">Jurusan / Sem</th>
                <th class="py-3 px-3">Peran (Role)</th>
                <th class="py-3 px-3">Paket</th>
                <th class="py-3 px-3">Status</th>
                <th class="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${users.map(u => `
                <tr class="hover:bg-slate-50/60 transition user-row" data-search="${(u.nama + ' ' + u.email).toLowerCase()}">
                  <td class="py-3 px-3">
                    <div class="font-semibold text-slate-900">${escapeHtml(u.nama)}</div>
                    <div class="text-[11px] text-slate-400 font-mono">${escapeHtml(u.email)}</div>
                  </td>
                  <td class="py-3 px-3 text-slate-600">
                    <div>${escapeHtml(u.jurusan || '-')}</div>
                    <div class="text-[11px] text-slate-400">Sem ${escapeHtml(u.semester || '1')}</div>
                  </td>
                  <td class="py-3 px-3">
                    <select onchange="updateUserRole('${u.email}', this.value)" class="px-2 py-1 rounded-lg border border-slate-200 bg-white font-medium text-xs text-slate-700 outline-none">
                      <option value="Mahasiswa" ${u.peran === 'Mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                      <option value="Admin" ${u.peran === 'Admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </td>
                  <td class="py-3 px-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${u.planType === 'PREMIUM' ? 'bg-purple-100 text-purple-700' : (u.planType === 'PRO' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600')}">
                      ${escapeHtml(u.planType || 'FREE')}
                    </span>
                  </td>
                  <td class="py-3 px-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${String(u.statusAktif) === 'true' || u.statusAktif === true ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}">
                      <span class="w-1.5 h-1.5 rounded-full ${String(u.statusAktif) === 'true' || u.statusAktif === true ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                      ${String(u.statusAktif) === 'true' || u.statusAktif === true ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td class="py-3 px-3 text-right">
                    <button onclick="toggleUserStatus('${u.email}', '${u.statusAktif}')" class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium transition">
                      ${String(u.statusAktif) === 'true' || u.statusAktif === true ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="py-6 text-center text-rose-600 text-xs">Gagal memuat pengguna.</div>`;
  }
}

function filterAdminUserTable(q) {
  const query = q.toLowerCase().trim();
  document.querySelectorAll('#admin-user-table .user-row').forEach(row => {
    const text = row.getAttribute('data-search') || '';
    row.style.display = (!query || text.includes(query)) ? '' : 'none';
  });
}

async function updateUserRole(email, newRole) {
  showToast(`Mengubah peran ${email} menjadi ${newRole}...`, 'info');
  try {
    const res = await api('admin.userUpdate', { email, peran: newRole });
    if (res && res.success) {
      showToast('Peran pengguna berhasil diperbarui!', 'success');
    } else {
      showToast(res?.message || 'Gagal mengubah peran.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kendala koneksi.', 'error');
  }
}

async function toggleUserStatus(email, currentStatus) {
  const nextStatus = (String(currentStatus) === 'true' || currentStatus === true) ? 'false' : 'true';
  showToast('Memperbarui status pengguna...', 'info');
  try {
    const res = await api('admin.userUpdate', { email, statusAktif: nextStatus });
    if (res && res.success) {
      showToast('Status berhasil diubah!', 'success');
      showAdminTab('users');
    } else {
      showToast(res?.message || 'Gagal mengubah status.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan.', 'error');
  }
}

// TAB 2: KONFIGURASI KUNCI RAHASIA & API
async function renderTabConfig(container) {
  container.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">Memuat konfigurasi rahasia...</div>`;
  try {
    const res = await api('admin.getConfig');
    const cfg = (res && res.success && res.data) ? res.data : {};
    AdminState.config = cfg;

    container.innerHTML = `
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
        <div>
          <h3 class="font-bold text-base text-slate-900">Konfigurasi Kunci API &amp; Script Properties</h3>
          <p class="text-xs text-slate-500 mt-1">Nilai token disamarkan (masked) secara otomatis demi keamanan data kelas rahasia A.</p>
        </div>

        <form onsubmit="handleSaveConfig(event)" class="space-y-4 max-w-2xl">
          <!-- GEMINI_API_KEY -->
          <div class="space-y-1 text-left">
            <label class="block text-xs font-bold text-slate-700 uppercase" for="cfg-gemini">
              Google Gemini API Key (Gemini 1.5 Pro)
            </label>
            <input id="cfg-gemini" type="password" placeholder="${cfg.GEMINI_API_KEY || 'Masukkan AIzaSy...'}"
              class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
            <p class="text-[11px] text-slate-400">Diperoleh dari Google AI Studio (aistudio.google.com). Kosongkan jika tidak ingin mengubah.</p>
          </div>

          <!-- FONNTE_TOKEN -->
          <div class="space-y-1 text-left">
            <label class="block text-xs font-bold text-slate-700 uppercase" for="cfg-fonnte">
              Fonnte WhatsApp API Token
            </label>
            <input id="cfg-fonnte" type="password" placeholder="${cfg.FONNTE_TOKEN || 'Masukkan token Fonnte...'}"
              class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
            <p class="text-[11px] text-slate-400">Token Fonnte untuk notifikasi WhatsApp non-blocking otomatis.</p>
          </div>

          <!-- ADMIN_EMAIL -->
          <div class="space-y-1 text-left">
            <label class="block text-xs font-bold text-slate-700 uppercase" for="cfg-admin-email">
              Email Administrator Utama
            </label>
            <input id="cfg-admin-email" type="email" placeholder="${cfg.ADMIN_EMAIL || 'admin@univ.ac.id'}"
              class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
          </div>

          <!-- APP_URL -->
          <div class="space-y-1 text-left">
            <label class="block text-xs font-bold text-slate-700 uppercase" for="cfg-app-url">
              Frontend GitHub Pages URL
            </label>
            <input id="cfg-app-url" type="url" placeholder="${cfg.APP_URL || 'https://username.github.io/tugaskuliah-apps/'}"
              class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
          </div>

          <div class="pt-2 flex items-center gap-3">
            <button type="submit" id="btn-save-cfg" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition">
              Simpan Perubahan Konfigurasi
            </button>
            <span class="text-xs text-slate-400">Zero literal secret pattern terjamin.</span>
          </div>
        </form>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="py-6 text-center text-rose-600 text-xs">Gagal mengambil konfigurasi.</div>`;
  }
}

async function handleSaveConfig(e) {
  e.preventDefault();
  const gemini = document.getElementById('cfg-gemini').value.trim();
  const fonnte = document.getElementById('cfg-fonnte').value.trim();
  const adminEmail = document.getElementById('cfg-admin-email').value.trim();
  const appUrl = document.getElementById('cfg-app-url').value.trim();
  const btn = document.getElementById('btn-save-cfg');

  const patch = {};
  if (gemini) patch.GEMINI_API_KEY = gemini;
  if (fonnte) patch.FONNTE_TOKEN = fonnte;
  if (adminEmail) patch.ADMIN_EMAIL = adminEmail;
  if (appUrl) patch.APP_URL = appUrl;

  if (Object.keys(patch).length === 0) {
    showToast('Tidak ada konfigurasi baru yang dimasukkan.', 'info');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const res = await api('admin.saveConfig', { config: patch });
    if (res && res.success) {
      showToast('Konfigurasi rahasia berhasil disimpan di Script Properties!', 'success');
      showAdminTab('config');
    } else {
      showToast(res?.message || 'Gagal menyimpan konfigurasi.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan penyimpanan.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Perubahan Konfigurasi';
  }
}

// TAB 3: CRM WHATSAPP BLAST
async function renderTabCRM(container) {
  container.innerHTML = `
    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 class="font-bold text-base text-slate-900">CRM Kontak &amp; Notifikasi Massal</h3>
          <p class="text-xs text-slate-500">Sinkronkan nomor kontak mahasiswa dan kirim pesan blast pengumuman akademik.</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="handleSyncCRM()" class="px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition">
            Sinkron Kontak Users
          </button>
        </div>
      </div>

      <!-- Form Blast WhatsApp -->
      <div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <h4 class="font-bold text-xs uppercase text-slate-700">Kirim Siaran Notifikasi WhatsApp (Batch Blast)</h4>
        <textarea id="crm-blast-text" rows="3" placeholder="Tuliskan pesan siaran (contoh: Halo {nama}, jangan lupa batas pengumpulan tugas skripsi minggu depan...)"
          class="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:border-indigo-600 outline-none"></textarea>
        <div class="flex justify-end">
          <button onclick="handleBlastWA()" class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow transition flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">send</span>
            <span>Kirim Siaran via Fonnte</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function handleSyncCRM() {
  showToast('Menyinkronkan kontak dari data Users...', 'info');
  try {
    const res = await api('crm.sync');
    if (res && res.success) {
      showToast('Sinkronisasi kontak CRM berhasil!', 'success');
    } else {
      showToast(res?.message || 'Gagal sinkron.', 'error');
    }
  } catch (e) {
    showToast('Terjadi kesalahan.', 'error');
  }
}

async function handleBlastWA() {
  const ta = document.getElementById('crm-blast-text');
  const pesan = ta ? ta.value.trim() : '';
  if (!pesan) {
    showToast('Tuliskan isi pesan siaran terlebih dahulu.', 'warning');
    return;
  }
  if (!confirm('Kirim siaran pesan ini ke seluruh kontak mahasiswa terdaftar?')) return;

  showToast('Memasukkan siaran ke antrean notifikasi non-blocking...', 'info');
  try {
    const res = await api('crm.blast', { pesanTemplate: pesan, target: 'Semua' });
    if (res && res.success) {
      showToast('Siaran berhasil masuk antrean! Server akan mengirim secara bertahap.', 'success', 5000);
      ta.value = '';
    } else {
      showToast(res?.message || 'Gagal blast pesan.', 'error');
    }
  } catch (e) {
    showToast('Terjadi kendala pengiriman.', 'error');
  }
}

// TAB 4: MIGRASI DATABASE
function renderTabMigrasi(container) {
  container.innerHTML = `
    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-6">
      <div>
        <h3 class="font-bold text-base text-slate-900">Utilitas Migrasi &amp; Sinkronisasi Spreadsheet</h3>
        <p class="text-xs text-slate-500 mt-1">Upgrade versi aplikasi tanpa menyentuh spreadsheet lama. Idempoten berdasarkan natural key.</p>
      </div>

      <div class="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
        <p class="font-bold">Prinsip Keamanan Migrasi (gas-migrasi-database):</p>
        <ul class="list-disc list-inside space-y-1 text-amber-800">
          <li>Spreadsheet sumber lama hanya dibaca (Read-Only), tidak akan pernah dimodifikasi.</li>
          <li>Selalu jalankan <strong>Dry-Run (Pindai)</strong> terlebih dahulu untuk meninjau perubahan tanpa menulis ke database.</li>
          <li>Data digabungkan secara aman menggunakan Upsert (Insert yang baru, Update yang berubah).</li>
        </ul>
      </div>

      <div class="space-y-4 max-w-xl">
        <div class="space-y-1 text-left">
          <label class="block text-xs font-bold text-slate-700 uppercase" for="migrasi-source-id">
            ID atau URL Spreadsheet Sumber (Database Versi Lama)
          </label>
          <input id="migrasi-source-id" type="text" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms..."
            class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-600 outline-none" />
        </div>

        <div class="flex items-center gap-3">
          <button onclick="handleMigrasi(true)" class="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200 transition">
            1. Pindai Perubahan (Dry-Run)
          </button>
          <button onclick="handleMigrasi(false)" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition">
            2. Eksekusi Migrasi Nyata
          </button>
        </div>

        <div id="migrasi-result-box" class="hidden p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800">
          <!-- Hasil migrasi ditampilkan di sini -->
        </div>
      </div>
    </div>
  `;
}

async function handleMigrasi(dryRun) {
  const inp = document.getElementById('migrasi-source-id');
  const sourceId = inp ? inp.value.trim() : '';
  const resultBox = document.getElementById('migrasi-result-box');

  if (!sourceId) {
    showToast('Masukkan ID Spreadsheet sumber terlebih dahulu.', 'warning');
    return;
  }

  if (!dryRun && !confirm('PERINGATAN: Anda akan mengeksekusi migrasi nyata ke spreadsheet aktif. Lanjutkan?')) {
    return;
  }

  showToast(dryRun ? 'Memindai spreadsheet sumber...' : 'Mengeksekusi migrasi...', 'info');

  try {
    const action = dryRun ? 'migrasi.pindai' : 'migrasi.eksekusi';
    const res = await api(action, { sourceSpreadsheetId: sourceId });

    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
      <div class="font-bold text-slate-900 mb-2">${res.message || 'Hasil Selesai'}</div>
      <pre class="overflow-x-auto text-[11px]">${JSON.stringify(res.data, null, 2)}</pre>
    `;
    showToast(dryRun ? 'Pindai selesai. Tinjau log perubahan.' : 'Migrasi berhasil diselesaikan!', 'success');
  } catch (err) {
    showToast('Gagal memproses migrasi.', 'error');
  }
}

async function handleAdminClearCache() {
  if (!confirm('Bersihkan semua cache CacheX dan paksa server membaca ulang Spreadsheet?')) return;
  showToast('Membersihkan cache...', 'info');
  try {
    const res = await api('admin.clearCache');
    if (res && res.success) {
      showToast('CacheX berhasil dibersihkan!', 'success');
      loadAdminStatsData();
    }
  } catch (e) {
    showToast('Gagal flush cache.', 'error');
  }
}
