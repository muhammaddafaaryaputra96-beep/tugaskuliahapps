/**
 * dashboard.js - Halaman Dashboard Utama TugasKuliah Apps
 * Desain: Flowly-inspired, Primary #4F46E5, Radius 12px, Font Plus Jakarta Sans
 * Menggunakan api() dari utils.js, navigateTo() dari app.js, dan AppState.
 */

// State internal Dashboard untuk manajemen tampilan dan kalender
window.DashboardState = {
  currentDate: new Date(),
  selectedDate: null,
  calendarDeadlines: [],
  cacheKey: 'tk_dashboard_cache'
};

/**
 * Render halaman dashboard utama.
 * Mengambil data via api('dashboard.boot'), menerapkan caching di AppState & localStorage,
 * dan menampilkan komponen-komponen dashboard interaktif.
 */
async function renderDashboard() {
  const container = document.getElementById('dashboard-container') || document.getElementById('app-main-view');
  if (!container) return;

  // 1. Tampilkan Skeleton Loading awal
  container.innerHTML = getDashboardSkeletonHTML();

  let cachedData = null;
  // Cek cache localStorage jika ada untuk instant loading (Prinsip Optimistic UX)
  try {
    const rawCache = localStorage.getItem(DashboardState.cacheKey);
    if (rawCache) {
      cachedData = JSON.parse(rawCache);
    }
  } catch (e) {
    console.warn('Gagal membaca cache dashboard:', e);
  }

  // Jika ada cache lokal, render langsung agar instan tanpa blank screen
  if (cachedData) {
    renderDashboardWithData(container, cachedData);
  }

  // 2. Fetch data terbaru dari backend
  try {
    const res = await api('dashboard.boot');
    if (res && res.success && res.data) {
      // Simpan ke AppState dan localStorage
      if (!window.AppState) window.AppState = { data: {} };
      if (!window.AppState.data) window.AppState.data = {};
      window.AppState.data.dashboard = res.data;
      try {
        localStorage.setItem(DashboardState.cacheKey, JSON.stringify(res.data));
      } catch (err) {
        console.warn('Gagal menulis cache dashboard:', err);
      }

      // Render ulang dengan data segar dari server
      renderDashboardWithData(container, res.data);
    } else {
      if (!cachedData) {
        container.innerHTML = `
          <div class="card p-6 text-center text-slate-600">
            <div class="text-4xl mb-3">⚠️</div>
            <h3 class="font-bold text-lg mb-1">Gagal Memuat Dashboard</h3>
            <p class="text-sm mb-4">${res?.message || 'Terjadi kendala saat mengambil data.'}</p>
            <button class="btn btn-primary" onclick="renderDashboard()">Coba Lagi</button>
          </div>
        `;
        showToast(res?.message || 'Gagal memuat data dashboard', 'error');
      }
    }
  } catch (err) {
    console.error('Error renderDashboard:', err);
    if (!cachedData) {
      container.innerHTML = `
        <div class="card p-6 text-center text-slate-600">
          <div class="text-4xl mb-3">📡</div>
          <h3 class="font-bold text-lg mb-1">Koneksi Terputus</h3>
          <p class="text-sm mb-4">Gagal terhubung ke server Google Apps Script.</p>
          <button class="btn btn-primary" onclick="renderDashboard()">Muat Ulang</button>
        </div>
      `;
      showToast('Gagal terhubung ke server', 'error');
    }
  }
}

/**
 * Menyusun template DOM dari data yang diperoleh
 */
function renderDashboardWithData(container, data) {
  const stats = data.stats || {
    tasksCompleted: 12,
    activeProjects: 4,
    savedRefs: 28,
    groupMembers: 8,
    trends: { tasks: '+15%', projects: '+2', refs: '+8', members: '0' }
  };
  const todaysTasks = data.todaysTasks || [];
  const deadlines = data.deadlines || [];
  const activeProjects = data.activeProjects || [];
  const chartData = data.chartData || {
    sevenDays: [2, 4, 3, 5, 2, 6, 8],
    categories: [
      { label: 'Makalah', count: 5, color: '#4F46E5' },
      { label: 'Laporan', count: 3, color: '#06B6D4' },
      { label: 'Skripsi', count: 2, color: '#10B981' },
      { label: 'Lainnya', count: 2, color: '#F59E0B' }
    ]
  };
  const aiUsage = data.aiUsage || { used: 4, limit: 10 };

  DashboardState.calendarDeadlines = deadlines;

  container.innerHTML = `
    <div class="dashboard-wrapper flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      <!-- 1. Hero Banner -->
      <div id="dash-hero"></div>

      <!-- 2. AI Usage Alert Widget -->
      <div id="dash-ai-usage"></div>

      <!-- 3. Stat Cards (4 Cards) -->
      <div id="dash-stats"></div>

      <!-- Grid Kolom: Kiri Konten Utama (65%), Kanan Panel Kalender & Widget (35%) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Kolom Kiri -->
        <div class="lg:col-span-8 flex flex-col gap-6">
          <!-- Tugas Hari Ini (Checklist Interaktif) -->
          <div id="dash-todays-tasks" class="card"></div>

          <!-- Progress Target Proyek Aktif -->
          <div id="dash-progress-goals" class="card"></div>

          <!-- Statistik & Grafik -->
          <div id="dash-statistics" class="card"></div>
        </div>

        <!-- Kolom Kanan -->
        <div class="lg:col-span-4 flex flex-col gap-6">
          <!-- Kalender Mini Interaktif -->
          <div id="dash-calendar" class="card"></div>

          <!-- Tenggat Waktu Terdekat -->
          <div id="dash-upcoming-deadlines" class="card"></div>
        </div>

      </div>
    </div>
  `;

  // Render masing-masing sub-komponen
  renderHeroBanner(document.getElementById('dash-hero'));
  renderAIUsageWidget(aiUsage.used, aiUsage.limit, document.getElementById('dash-ai-usage'));
  renderStatCards(stats, document.getElementById('dash-stats'));
  renderTodaysTasks(todaysTasks, document.getElementById('dash-todays-tasks'));
  renderProgressGoals(activeProjects, document.getElementById('dash-progress-goals'));
  renderStatisticsCharts(chartData, document.getElementById('dash-statistics'));
  renderCalendar(deadlines, document.getElementById('dash-calendar'));
  renderUpcomingDeadlines(deadlines, document.getElementById('dash-upcoming-deadlines'));
}

/**
 * 1. Hero Banner: Gradient Card Flowly-inspired "Kuasai Deadline, Raih Prestasi"
 */
function renderHeroBanner(container) {
  if (!container) return;
  const user = window.AppState?.user || { nama: 'Mahasiswa' };
  const namaPanggilan = (user.nama || 'Mahasiswa').split(' ')[0];

  container.innerHTML = `
    <div class="hero-banner relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
         style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);">
      <div class="relative z-10 max-w-xl">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3">
          ✨ Halo, ${escapeHtml(namaPanggilan)}! Semangat Semester Baru
        </span>
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
          Kuasai Deadline, Raih Prestasi Akademik
        </h1>
        <p class="text-indigo-100 text-sm md:text-base leading-relaxed">
          Kelola tugas kuliah, buat draf terstruktur dengan bantuan AI cerdas, simpan referensi terformat otomatis, dan kolaborasi tanpa hambatan.
        </p>
      </div>
      <div class="relative z-10 flex flex-wrap gap-3 w-full md:w-auto">
        <button class="btn bg-white text-indigo-700 hover:bg-indigo-50 font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-2 flex-1 md:flex-none cursor-pointer"
                onclick="navigateTo('projects-new')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Tugas Baru
        </button>
        <button class="btn bg-indigo-500/30 hover:bg-indigo-500/40 text-white font-medium px-4 py-2.5 rounded-lg backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 flex-1 md:flex-none cursor-pointer"
                onclick="navigateTo('references')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
          Cari Referensi
        </button>
      </div>
      <!-- Dekorasi Pola Lingkaran Latar Belakang -->
      <div class="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
      <div class="absolute right-40 -top-10 w-32 h-32 rounded-full bg-purple-400/20 blur-xl pointer-events-none"></div>
    </div>
  `;
}

/**
 * 2. Widget Penggunaan AI Harian (Quota Bar)
 */
function renderAIUsageWidget(used = 0, limit = 10, container) {
  if (!container) return;
  const sisa = Math.max(0, limit - used);
  const persen = Math.min(100, Math.round((used / limit) * 100));
  const isNearLimit = sisa <= 2;

  container.innerHTML = `
    <div class="card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-indigo-50 shadow-sm rounded-xl">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg ${isNearLimit ? 'bg-amber-100 text-amber-700' : 'bg-indigo-50 text-indigo-600'}">
          ✨
        </div>
        <div>
          <div class="text-sm font-bold text-slate-800 flex items-center gap-2">
            AI Assistant Kuota Harian
            <span class="badge ${isNearLimit ? 'badge-warning' : 'badge-info'} text-xs">
              ${used}/${limit} Terpakai
            </span>
          </div>
          <p class="text-xs text-slate-500">
            Tersisa <strong class="text-indigo-600">${sisa}</strong> request AI cerdas untuk hari ini. Reset setiap pukul 00:00 WIB.
          </p>
        </div>
      </div>
      <div class="w-full sm:w-48 flex flex-col gap-1.5">
        <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div class="h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-amber-500' : 'bg-indigo-600'}"
               style="width: ${persen}%;"></div>
        </div>
        <div class="flex justify-between items-center text-[11px] text-slate-400 font-medium">
          <span>${persen}% Terpakai</span>
          <a href="#billing" onclick="navigateTo('billing')" class="text-indigo-600 hover:underline">Upgrade PRO</a>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. 4 Stat Cards: Tugas Selesai, Proyek Aktif, Referensi Tersimpan, Anggota Kelompok
 */
function renderStatCards(stats, container) {
  if (!container) return;

  const cardItems = [
    {
      title: 'Tugas Selesai',
      value: stats.tasksCompleted ?? 0,
      trend: stats.trends?.tasks || '+12%',
      isUp: true,
      icon: `<svg class="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    {
      title: 'Proyek Aktif',
      value: stats.activeProjects ?? 0,
      trend: stats.trends?.projects || 'Stabil',
      isUp: true,
      icon: `<svg class="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>`,
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100'
    },
    {
      title: 'Referensi Tersimpan',
      value: stats.savedRefs ?? 0,
      trend: stats.trends?.refs || '+5 baru',
      isUp: true,
      icon: `<svg class="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>`,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    {
      title: 'Anggota Kelompok',
      value: stats.groupMembers ?? 0,
      trend: stats.trends?.members || 'Aktif',
      isUp: true,
      icon: `<svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100'
    }
  ];

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${cardItems.map(item => `
        <div class="card p-5 bg-white rounded-xl border ${item.borderColor} shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">${item.title}</span>
            <div class="w-10 h-10 rounded-lg ${item.bgColor} flex items-center justify-center">
              ${item.icon}
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <div class="text-2xl md:text-3xl font-extrabold text-slate-800">${item.value}</div>
            <span class="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${item.isUp ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}">
              ${item.trend}
            </span>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * 4. Tugas Hari Ini: Checklist Interaktif dengan Optimistic UI Update
 */
function renderTodaysTasks(tasks = [], container) {
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>✅</span> Target Tugas Hari Ini
          </h2>
          <span class="text-xs text-slate-400">0 Tugas</span>
        </div>
        <div class="text-center py-8 text-slate-400">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p class="text-sm">Tidak ada tugas mendesak hari ini. Santai sejenak atau cicil bab berikutnya!</p>
          <button class="btn btn-secondary mt-3 text-xs" onclick="navigateTo('projects')">Lihat Semua Proyek</button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>✅</span> Target Tugas Hari Ini
          </h2>
          <p class="text-xs text-slate-500">Centang untuk memperbarui status pengerjaan secara instan.</p>
        </div>
        <button class="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onclick="navigateTo('projects')">
          Kelola Proyek &rarr;
        </button>
      </div>

      <div class="flex flex-col gap-2.5" id="todays-task-list">
        ${tasks.map(task => {
          const isDone = task.statusProgres === 'Selesai' || task.completed === true;
          return `
            <div class="task-item p-3.5 rounded-lg border border-slate-100 hover:border-indigo-200 transition-all duration-150 flex items-center justify-between gap-3 ${isDone ? 'bg-slate-50 opacity-75' : 'bg-white'}"
                 id="task-row-${task.projectId}">
              <div class="flex items-center gap-3 min-w-0">
                <input type="checkbox"
                       class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                       ${isDone ? 'checked' : ''}
                       onchange="handleToggleTaskStatus('${task.projectId}', this.checked)" />
                <div class="min-w-0">
                  <div class="text-sm font-semibold text-slate-800 truncate ${isDone ? 'line-through text-slate-400' : ''}" id="task-title-${task.projectId}">
                    ${escapeHtml(task.judulTugas || 'Tugas Tanpa Judul')}
                  </div>
                  <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span class="font-medium text-slate-500">${escapeHtml(task.mataKuliah || '-')}</span>
                    <span>•</span>
                    <span class="badge ${task.prioritas === 'Tinggi' ? 'badge-danger' : 'badge-info'} text-[10px] py-0 px-1.5">
                      ${task.prioritas || 'Sedang'}
                    </span>
                  </div>
                </div>
              </div>
              <div class="text-right flex-shrink-0">
                <span class="text-xs font-medium ${isDone ? 'text-emerald-600' : 'text-amber-600'}">
                  ${isDone ? 'Selesai' : (task.deadline ? formatDate(task.deadline, 'relative') : 'Hari ini')}
                </span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Handle checkbox toggle tugas hari ini dengan OPTIMISTIC UI
 */
async function handleToggleTaskStatus(projectId, isChecked) {
  const row = document.getElementById(`task-row-${projectId}`);
  const title = document.getElementById(`task-title-${projectId}`);
  const newStatus = isChecked ? 'Selesai' : 'Sedang Dikerjakan';

  // 1. Optimistic Update pada DOM langsung
  if (row && title) {
    if (isChecked) {
      row.classList.add('bg-slate-50', 'opacity-75');
      row.classList.remove('bg-white');
      title.classList.add('line-through', 'text-slate-400');
    } else {
      row.classList.remove('bg-slate-50', 'opacity-75');
      row.classList.add('bg-white');
      title.classList.remove('line-through', 'text-slate-400');
    }
  }

  // Update di cache lokal
  try {
    const rawCache = localStorage.getItem(DashboardState.cacheKey);
    if (rawCache) {
      const data = JSON.parse(rawCache);
      if (data.todaysTasks) {
        const item = data.todaysTasks.find(t => t.projectId === projectId);
        if (item) {
          item.statusProgres = newStatus;
          item.completed = isChecked;
          localStorage.setItem(DashboardState.cacheKey, JSON.stringify(data));
        }
      }
    }
  } catch (e) {
    console.warn(e);
  }

  showToast(`Status tugas diubah: ${newStatus}`, 'info', 2000);

  // 2. Sinkronisasi ke server di background
  try {
    const res = await api('project.updateStatus', { projectId, statusProgres: newStatus });
    if (!res || !res.success) {
      throw new Error(res?.message || 'Gagal menyimpan ke server');
    }
  } catch (err) {
    console.error('Rollback optimistic update:', err);
    showToast('Gagal memperbarui status ke server, mengembalikan status awal...', 'error');
    // Rollback jika server gagal
    if (row && title) {
      if (!isChecked) {
        row.classList.add('bg-slate-50', 'opacity-75');
        title.classList.add('line-through', 'text-slate-400');
      } else {
        row.classList.remove('bg-slate-50', 'opacity-75');
        title.classList.remove('line-through', 'text-slate-400');
      }
    }
  }
}

/**
 * 5. Mini Calendar Grid 7 Kolom Interaktif
 * Menandai deadline dengan titik amber dan hari ini dengan lingkaran indigo
 */
function renderCalendar(deadlines = [], container) {
  if (!container) return;

  const cur = DashboardState.currentDate;
  const year = cur.getFullYear();
  const month = cur.getMonth(); // 0-indexed

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Hitung hari pertama dan jumlah hari
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Minggu
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  // Parsing deadline dates untuk lookup cepat YYYY-MM-DD
  const deadlineMap = {};
  deadlines.forEach(d => {
    if (d.deadline) {
      const dateStr = d.deadline.split('T')[0];
      deadlineMap[dateStr] = (deadlineMap[dateStr] || 0) + 1;
    }
  });

  let daysHTML = '';
  // Kosong untuk offset hari sebelum tanggal 1
  for (let i = 0; i < firstDayIndex; i++) {
    daysHTML += `<div class="h-8 flex items-center justify-center text-xs text-slate-300"></div>`;
  }

  // Tanggal 1 s.d. terakhir
  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
    const hasDeadline = !!deadlineMap[dStr];

    daysHTML += `
      <div class="h-8 flex flex-col items-center justify-center relative cursor-pointer group"
           onclick="handleSelectCalendarDay('${dStr}')" title="${hasDeadline ? `${deadlineMap[dStr]} deadline tugas` : ''}">
        <span class="w-7 h-7 flex items-center justify-center rounded-full text-xs transition-colors duration-150
                     ${isToday ? 'bg-indigo-600 text-white font-bold shadow-sm' : 'text-slate-700 hover:bg-indigo-50'}">
          ${day}
        </span>
        ${hasDeadline ? `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 absolute bottom-0.5"></span>` : ''}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="p-5">
      <!-- Header Kalender: Bulan, Tahun, Tombol Prev/Next -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-800">
          ${monthNames[month]} ${year}
        </h3>
        <div class="flex items-center gap-1">
          <button class="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer" onclick="changeCalendarMonth(-1)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button class="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer" onclick="changeCalendarMonth(1)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>

      <!-- Nama Hari 7 Kolom -->
      <div class="grid grid-cols-7 gap-1 text-center mb-2">
        <span class="text-[11px] font-semibold text-rose-500">Min</span>
        <span class="text-[11px] font-semibold text-slate-400">Sen</span>
        <span class="text-[11px] font-semibold text-slate-400">Sel</span>
        <span class="text-[11px] font-semibold text-slate-400">Rab</span>
        <span class="text-[11px] font-semibold text-slate-400">Kam</span>
        <span class="text-[11px] font-semibold text-slate-400">Jum</span>
        <span class="text-[11px] font-semibold text-slate-400">Sab</span>
      </div>

      <!-- Grid Tanggal -->
      <div class="grid grid-cols-7 gap-1 text-center">
        ${daysHTML}
      </div>

      <!-- Keterangan Legend -->
      <div class="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
          <span>Hari ini</span>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Ada Deadline</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Mengubah navigasi bulan pada kalender
 */
function changeCalendarMonth(delta) {
  DashboardState.currentDate.setMonth(DashboardState.currentDate.getMonth() + delta);
  renderCalendar(DashboardState.calendarDeadlines, document.getElementById('dash-calendar'));
}

/**
 * Handle klik pada hari tertentu di kalender
 */
function handleSelectCalendarDay(dateStr) {
  const matches = (DashboardState.calendarDeadlines || []).filter(d => (d.deadline || '').startsWith(dateStr));
  if (matches.length > 0) {
    const listJudul = matches.map(m => `• ${m.judulTugas} (${m.mataKuliah})`).join('\n');
    showToast(`Deadline pada ${dateStr}:\n${listJudul}`, 'info', 4000);
  } else {
    showToast(`Tidak ada deadline pada ${dateStr}`, 'info', 2000);
  }
}

/**
 * 6. Tenggat Waktu Terdekat (Upcoming Deadlines: 3 Event Rows dengan Date Box Warna-Warni)
 */
function renderUpcomingDeadlines(deadlines = [], container) {
  if (!container) return;

  const top3 = deadlines.slice(0, 3);
  const colors = [
    { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200' },
    { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200' }
  ];

  if (top3.length === 0) {
    container.innerHTML = `
      <div class="p-5">
        <h3 class="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span>⏰</span> Tenggat Terdekat
        </h3>
        <p class="text-xs text-slate-400 py-3 text-center">Belum ada deadline mendesak.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-5">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>⏰</span> Tenggat Terdekat
        </h3>
        <span class="text-xs text-slate-400">${deadlines.length} Total</span>
      </div>

      <div class="flex flex-col gap-3">
        ${top3.map((item, idx) => {
          const c = colors[idx % colors.length];
          const dObj = item.deadline ? new Date(item.deadline) : new Date();
          const dayNum = dObj.getDate();
          const monthShort = dObj.toLocaleString('id-ID', { month: 'short' });

          return `
            <div class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 transition bg-white shadow-2xs">
              <!-- Date Box -->
              <div class="w-12 h-12 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${c.bg} ${c.text} ${c.border} border font-bold">
                <span class="text-base leading-none">${dayNum}</span>
                <span class="text-[10px] uppercase tracking-wider">${monthShort}</span>
              </div>
              <!-- Detail Info -->
              <div class="min-w-0 flex-1">
                <div class="text-xs font-bold text-slate-800 truncate" title="${escapeHtml(item.judulTugas)}">
                  ${escapeHtml(item.judulTugas)}
                </div>
                <div class="text-[11px] text-slate-500 truncate">
                  ${escapeHtml(item.mataKuliah || 'Mata Kuliah')}
                </div>
                <div class="text-[10px] font-semibold ${c.text} mt-0.5">
                  ${formatDate(item.deadline, 'relative')}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 7. Progress Target Proyek Aktif
 */
function renderProgressGoals(projects = [], container) {
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="p-6">
        <h2 class="text-lg font-bold text-slate-800 mb-2">🎯 Target Pengerjaan Proyek</h2>
        <p class="text-xs text-slate-400">Belum ada proyek aktif. Silakan buat tugas baru untuk mulai memantau progres.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🎯</span> Target Pengerjaan Proyek
          </h2>
          <p class="text-xs text-slate-500">Pantau penyelesaian bab dan seksi per mata kuliah.</p>
        </div>
        <button class="text-xs font-semibold text-indigo-600 hover:text-indigo-800" onclick="navigateTo('projects')">
          Semua Proyek &rarr;
        </button>
      </div>

      <div class="flex flex-col gap-4">
        ${projects.slice(0, 4).map(p => {
          const persen = p.progressPercent ?? (p.statusProgres === 'Selesai' ? 100 : p.statusProgres === 'Sedang Dikerjakan' ? 45 : 15);
          return `
            <div class="p-3.5 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 transition">
              <div class="flex items-center justify-between mb-1.5">
                <div class="font-semibold text-sm text-slate-800 truncate max-w-[70%]">
                  ${escapeHtml(p.judulTugas)}
                </div>
                <span class="text-xs font-bold text-indigo-600">${persen}%</span>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>${escapeHtml(p.mataKuliah || '-')} • ${escapeHtml(p.jenisTugas || 'Tugas')}</span>
                <span>${p.completedSections ?? '3'}/${p.totalSections ?? '5'} Bab</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${persen}%;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 8. Statistik & Grafik (Vanilla Canvas / Inline SVG)
 * - Line Chart: Penyelesaian Tugas 7 Hari Terakhir
 * - Pie Chart (Donut): Distribusi Jenis Tugas
 */
function renderStatisticsCharts(chartData, container) {
  if (!container) return;

  const sevenDays = chartData.sevenDays || [2, 4, 3, 5, 2, 6, 8];
  const categories = chartData.categories || [
    { label: 'Makalah', count: 5, color: '#4F46E5' },
    { label: 'Laporan', count: 3, color: '#06B6D4' },
    { label: 'Skripsi', count: 2, color: '#10B981' },
    { label: 'Lainnya', count: 2, color: '#F59E0B' }
  ];

  // SVG Line Chart Calculation
  const maxVal = Math.max(...sevenDays, 5);
  const width = 360;
  const height = 120;
  const padding = 20;

  const points = sevenDays.map((val, idx) => {
    const x = padding + (idx * ((width - 2 * padding) / (sevenDays.length - 1)));
    const y = height - padding - (val / maxVal) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');

  // SVG Donut Chart Calculation
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0) || 1;
  let accumulatedAngle = 0;
  const donutArcs = categories.map(cat => {
    const fraction = cat.count / totalCount;
    const dashLength = fraction * 283; // 2 * PI * r (r=45 -> ~282.7)
    const strokeDash = `${dashLength} ${283 - dashLength}`;
    const offset = -accumulatedAngle;
    accumulatedAngle += dashLength;
    return { ...cat, strokeDash, offset };
  });

  container.innerHTML = `
    <div class="p-6">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>📊</span> Analitik Aktivitas Akademik
          </h2>
          <p class="text-xs text-slate-500">Visualisasi produktivitas dan variasi penugasan kuliah.</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <!-- Grafik 1: Line Chart (7 Hari Terakhir) -->
        <div class="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Tugas Diselesaikan (7 Hari)</span>
            <span class="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Konsisten</span>
          </div>
          <div class="w-full overflow-hidden flex items-center justify-center">
            <svg viewBox="0 0 ${width} ${height}" class="w-full h-28 overflow-visible">
              <!-- Grid Lines -->
              <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#E2E8F0" stroke-width="1" />
              <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="#F1F5F9" stroke-width="1" stroke-dasharray="3,3" />
              
              <!-- Polyline Line -->
              <polyline fill="none" stroke="#4F46E5" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${points}" />
              
              <!-- Dots -->
              ${sevenDays.map((val, idx) => {
                const x = padding + (idx * ((width - 2 * padding) / (sevenDays.length - 1)));
                const y = height - padding - (val / maxVal) * (height - 2 * padding);
                return `
                  <circle cx="${x}" cy="${y}" r="4" fill="#FFFFFF" stroke="#4F46E5" stroke-width="2" class="cursor-pointer hover:r-6 transition-all">
                    <title>${val} tugas selesai</title>
                  </circle>
                `;
              }).join('')}
            </svg>
          </div>
          <div class="flex justify-between text-[10px] text-slate-400 font-medium px-2">
            <span>H-6</span><span>H-5</span><span>H-4</span><span>H-3</span><span>H-2</span><span>Kemarin</span><span>Hari ini</span>
          </div>
        </div>

        <!-- Grafik 2: Donut Chart (Distribusi Jenis Tugas) -->
        <div class="flex flex-col gap-2 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-700">Distribusi Jenis Tugas</span>
            <span class="text-xs text-slate-400">${totalCount} Proyek</span>
          </div>
          <div class="flex items-center justify-around gap-4 py-1">
            <!-- Donut SVG -->
            <div class="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#F1F5F9" stroke-width="10" />
                ${donutArcs.map(arc => `
                  <circle cx="50" cy="50" r="45" fill="none" stroke="${arc.color}" stroke-width="10"
                          stroke-dasharray="${arc.strokeDash}" stroke-dashoffset="${arc.offset}" />
                `).join('')}
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-base font-extrabold text-slate-800">${totalCount}</span>
                <span class="text-[9px] text-slate-400 leading-none">Total</span>
              </div>
            </div>

            <!-- Legend List -->
            <div class="flex flex-col gap-1.5 min-w-0 flex-1">
              ${categories.map(cat => `
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5 truncate">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${cat.color};"></span>
                    <span class="text-slate-600 truncate">${cat.label}</span>
                  </div>
                  <span class="font-bold text-slate-800 ml-2">${cat.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Skeleton Loading State untuk Dashboard
 */
function getDashboardSkeletonHTML() {
  return `
    <div class="p-6 flex flex-col gap-6 max-w-7xl mx-auto animate-pulse">
      <!-- Hero Skeleton -->
      <div class="h-44 bg-slate-200 rounded-2xl w-full skeleton"></div>

      <!-- AI Usage Skeleton -->
      <div class="h-16 bg-slate-200 rounded-xl w-full skeleton"></div>

      <!-- Stats Skeleton -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="h-28 bg-slate-200 rounded-xl skeleton"></div>
        <div class="h-28 bg-slate-200 rounded-xl skeleton"></div>
        <div class="h-28 bg-slate-200 rounded-xl skeleton"></div>
        <div class="h-28 bg-slate-200 rounded-xl skeleton"></div>
      </div>

      <!-- Main Layout Skeleton -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-8 flex flex-col gap-6">
          <div class="h-56 bg-slate-200 rounded-xl skeleton"></div>
          <div class="h-48 bg-slate-200 rounded-xl skeleton"></div>
        </div>
        <div class="lg:col-span-4 flex flex-col gap-6">
          <div class="h-64 bg-slate-200 rounded-xl skeleton"></div>
          <div class="h-48 bg-slate-200 rounded-xl skeleton"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Helper pencegah XSS sederhana
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
