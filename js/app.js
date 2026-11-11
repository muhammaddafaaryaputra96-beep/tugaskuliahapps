/**
 * app.js — Router SPA & State Management TugasKuliah Apps
 * Arsitektur: GAS Instant UX & GAS Pro API (0ms navigasi, tanpa reload halaman)
 * Mengelola: Shell Layout (Sidebar, Topbar), Dynamic Role-Based Menu, SPA Navigation
 * Versi: 1.0.0
 */

// ============================================================
// GLOBAL APPLICATION STATE
// ============================================================

window.AppState = {
  user: null,
  currentSection: 'dashboard',
  data: {},
  sidebarOpen: false
};

// ============================================================
// 1. INITIATION & BOOTSTRAP
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  const token = getToken();
  
  if (!token) {
    navigateTo('login');
    return;
  }

  // Coba ambil profil dari localStorage dulu untuk Instant UX
  const cachedUser = getCurrentUser();
  if (cachedUser) {
    AppState.user = cachedUser;
    initAppLayout();
    routeInitialSection();
  }

  // Verifikasi token secara background dengan backend
  try {
    const res = await api('auth.verify');
    if (res && res.success && res.data && res.data.user) {
      AppState.user = res.data.user;
      setCurrentUser(res.data.user);
      if (!cachedUser) {
        initAppLayout();
        routeInitialSection();
      } else {
        updateSidebarUserDisplay();
      }
    } else {
      clearToken();
      navigateTo('login');
    }
  } catch (err) {
    if (!cachedUser) {
      clearToken();
      navigateTo('login');
    }
  }
}

function routeInitialSection() {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && hash !== 'login' && hash !== 'register') {
    navigateTo(hash);
  } else {
    navigateTo('dashboard');
  }
}

// Listen to browser hashchange (support Back/Forward button)
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '').trim();
  if (hash && hash !== AppState.currentSection) {
    navigateTo(hash, false);
  }
});

// ============================================================
// 2. SPA NAVIGATION ROUTER (0ms Instant Switch)
// ============================================================

/**
 * navigateTo — Berpindah antar menu tanpa me-reload browser
 * @param {string} sectionId - Target menu ('dashboard', 'buat-tugas-baru', dll)
 * @param {boolean} [updateHash=true] - Update URL hash
 */
function navigateTo(sectionId, updateHash = true) {
  if (updateHash) {
    window.location.hash = sectionId;
  }
  AppState.currentSection = sectionId;

  // Tutup sidebar mobile jika terbuka
  closeMobileSidebar();

  // Route Khusus Halaman Auth (tanpa Shell Sidebar)
  if (sectionId === 'login') {
    renderLoginPage();
    return;
  }
  if (sectionId === 'register') {
    renderRegisterPage();
    return;
  }

  // Pastikan layout shell sudah ada jika mengakses halaman aplikasi
  if (!document.getElementById('app-sidebar')) {
    initAppLayout();
  }

  // Update visual aktif di sidebar navigation
  updateActiveNavMenu(sectionId);

  // Render view yang sesuai
  const mainView = document.getElementById('app-main-view');
  if (!mainView) return;

  switch (sectionId) {
    case 'dashboard':
      if (typeof renderDashboard === 'function') renderDashboard();
      break;

    case 'buat-tugas-baru':
      if (typeof renderProjectsPage === 'function') renderProjectsPage('new');
      break;

    case 'manajer-draf':
      if (typeof renderProjectsPage === 'function') renderProjectsPage('manager');
      break;

    case 'referensi-sitasi':
    case 'referensi':
      if (typeof renderReferencesPage === 'function') renderReferencesPage();
      break;

    case 'konversi-slide':
      if (typeof renderSlideConverter === 'function') renderSlideConverter();
      break;

    case 'ruang-kelompok':
      if (typeof renderGroupWorkspace === 'function') renderGroupWorkspace();
      break;

    case 'perpustakaan-template':
    case 'template':
      if (typeof renderTemplateLibrary === 'function') renderTemplateLibrary();
      break;

    case 'billing':
    case 'langganan':
      if (typeof renderBillingPage === 'function') renderBillingPage();
      break;

    case 'admin':
      if (typeof renderAdminDashboard === 'function') renderAdminDashboard();
      break;

    default:
      if (typeof renderDashboard === 'function') renderDashboard();
      break;
  }

  // Scroll to top setiap pindah halaman
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function updateActiveNavMenu(sectionId) {
  const links = document.querySelectorAll('#app-sidebar nav a[data-path]');
  links.forEach(a => {
    const p = a.getAttribute('data-path');
    if (p === sectionId || (sectionId === 'referensi' && p === 'referensi-sitasi') || (sectionId === 'template' && p === 'perpustakaan-template')) {
      a.className = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-semibold text-xs border-l-[3px] border-indigo-600 transition shadow-sm';
    } else {
      a.className = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium text-xs transition';
    }
  });
}

// ============================================================
// 3. APP SHELL LAYOUT (Sidebar + Topbar + Container)
// ============================================================

function initAppLayout() {
  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  const user = getCurrentUser() || { nama: 'Mahasiswa', email: 'mahasiswa@univ.ac.id', peran: 'Mahasiswa', planType: 'FREE' };
  const isAdmin = (user.peran === 'Admin');

  appRoot.innerHTML = `
    <div class="min-h-screen bg-[#F5F4FF] text-slate-900 font-sans flex antialiased selection:bg-purple-100 selection:text-indigo-700">
      
      <!-- Mobile Backdrop Overlay -->
      <div id="sidebar-backdrop" onclick="closeMobileSidebar()" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 hidden lg:hidden"></div>

      <!-- FIXED SIDEBAR -->
      <aside id="app-sidebar" class="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 flex flex-col justify-between border-r border-slate-200/80 shadow-[0_2px_12px_rgba(79,70,229,0.04)] transform -translate-x-full lg:translate-x-0 transition-transform duration-300">
        
        <!-- Top Branding & Navigation Items -->
        <div class="flex flex-col flex-1 overflow-y-auto">
          
          <!-- App Logo -->
          <div class="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <div class="flex items-center gap-2.5 cursor-pointer" onclick="navigateTo('dashboard')">
              <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                <span class="material-symbols-outlined text-[20px]">school</span>
              </div>
              <div>
                <div class="font-bold text-base text-slate-900 tracking-tight leading-none">TugasKuliah</div>
                <div class="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Workspace v1.0</div>
              </div>
            </div>
            <button onclick="closeMobileSidebar()" class="lg:hidden p-1 text-slate-400 hover:text-slate-600">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <!-- Menu Mahasiswa Section -->
          <div class="px-3.5 py-4">
            <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">Menu Utama</div>
            <nav class="flex flex-col gap-1">
              <a href="#dashboard" data-path="dashboard" onclick="navigateTo('dashboard'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard Utama</span>
              </a>
              <a href="#buat-tugas-baru" data-path="buat-tugas-baru" onclick="navigateTo('buat-tugas-baru'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                <span>Buat Tugas Baru</span>
              </a>
              <a href="#manajer-draf" data-path="manajer-draf" onclick="navigateTo('manajer-draf'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Manajer Draf Akademik</span>
              </a>
              <a href="#referensi-sitasi" data-path="referensi-sitasi" onclick="navigateTo('referensi-sitasi'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">format_quote</span>
                <span>Referensi &amp; Sitasi AI</span>
              </a>
              <a href="#konversi-slide" data-path="konversi-slide" onclick="navigateTo('konversi-slide'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">slideshow</span>
                <span>Konversi Google Slides</span>
              </a>
              <a href="#ruang-kelompok" data-path="ruang-kelompok" onclick="navigateTo('ruang-kelompok'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">group</span>
                <span>Ruang Kelompok</span>
              </a>
              <a href="#perpustakaan-template" data-path="perpustakaan-template" onclick="navigateTo('perpustakaan-template'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">library_books</span>
                <span>Perpustakaan Template</span>
              </a>
              <a href="#billing" data-path="billing" onclick="navigateTo('billing'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 font-medium text-xs transition">
                <span class="material-symbols-outlined text-[18px]">workspace_premium</span>
                <span>Langganan &amp; Kuota AI</span>
              </a>
            </nav>
          </div>

          <!-- Menu Admin Section (Hanya tampil jika peran Admin) -->
          ${isAdmin ? `
            <div class="px-3.5 py-2 border-t border-slate-100">
              <div class="text-[10px] font-bold uppercase tracking-wider text-indigo-600 px-3 mb-2 flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">admin_panel_settings</span>
                <span>Administrator</span>
              </div>
              <nav class="flex flex-col gap-1">
                <a href="#admin" data-path="admin" onclick="navigateTo('admin'); return false;" class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 font-semibold text-xs transition">
                  <span class="material-symbols-outlined text-[18px]">analytics</span>
                  <span>Monitoring &amp; Kelola</span>
                </a>
              </nav>
            </div>
          ` : ''}

        </div>

        <!-- Bottom User Profile Card & Logout -->
        <div class="p-3 border-t border-slate-100">
          <div class="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                ${escapeHtml((user.nama || 'M')[0].toUpperCase())}
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-bold text-xs text-slate-900 truncate" id="sidebar-user-nama">${escapeHtml(user.nama || 'Mahasiswa')}</div>
                <div class="text-[10px] text-slate-500 truncate" id="sidebar-user-role">${escapeHtml(user.peran)} • ${escapeHtml(user.planType || 'FREE')}</div>
              </div>
            </div>
            <button onclick="handleLogout()" title="Keluar dari akun" class="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition">
              <span class="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>

      </aside>

      <!-- MAIN WRAPPER (Topbar + Dynamic View) -->
      <div class="flex-1 lg:pl-64 flex flex-col min-w-0">
        
        <!-- FIXED TOPBAR -->
        <header class="h-16 bg-white/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 border-b border-slate-200/80">
          
          <!-- Left: Burger Toggle for Mobile -->
          <div class="flex items-center gap-3">
            <button onclick="openMobileSidebar()" class="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100">
              <span class="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div class="relative hidden sm:block w-64 md:w-80">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
              <input type="text" placeholder="Cari tugas, draf, referensi..."
                class="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-100 border-none text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 outline-none transition" />
            </div>
          </div>

          <!-- Right: Status Pill, Notifications & Quick Actions -->
          <div class="flex items-center gap-3">
            
            <!-- AI Quota Pill Badge -->
            <div class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold">
              <span class="material-symbols-outlined text-[15px] text-amber-500 animate-pulse">auto_awesome</span>
              <span>Gemini 1.5 Pro</span>
            </div>

            <!-- Notification Bell -->
            <button onclick="showToast('Tidak ada notifikasi deadline baru.', 'info')" class="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition relative">
              <span class="material-symbols-outlined text-[20px]">notifications</span>
              <span class="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500"></span>
            </button>

            <!-- User Avatar Circle -->
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
              ${escapeHtml((user.nama || 'M')[0].toUpperCase())}
            </div>

          </div>

        </header>

        <!-- DYNAMIC MAIN CONTENT VIEWPORT -->
        <main id="app-main-view" class="flex-1 w-full min-h-[calc(100vh-64px)] pb-12">
          <!-- Halaman aktif akan di-render di sini via navigateTo() -->
        </main>

      </div>

    </div>
  `;
}

function updateSidebarUserDisplay() {
  const user = getCurrentUser();
  if (!user) return;
  const n = document.getElementById('sidebar-user-nama');
  const r = document.getElementById('sidebar-user-role');
  if (n) n.textContent = user.nama || 'Mahasiswa';
  if (r) r.textContent = `${user.peran} • ${user.planType || 'FREE'}`;
}

function openMobileSidebar() {
  const sb = document.getElementById('app-sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  if (sb) sb.classList.remove('-translate-x-full');
  if (bd) bd.classList.remove('hidden');
}

function closeMobileSidebar() {
  const sb = document.getElementById('app-sidebar');
  const bd = document.getElementById('sidebar-backdrop');
  if (sb) sb.classList.add('-translate-x-full');
  if (bd) bd.classList.add('hidden');
}
