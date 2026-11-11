/**
 * projects.js - Manajemen Tugas & Draf Akademik (New Assignment + Draft Manager)
 * Desain: Flowly-inspired, Primary #4F46E5, Radius 12px, Split Layout 35/65
 * Menggunakan api() dari utils.js, navigateTo() dari app.js, dan AppState.
 */

window.ProjectsState = {
  currentProject: null,
  currentDraft: null,
  currentBabIndex: 0,
  activeTab: 'manager', // 'manager' | 'new'
  draftList: [],
  templates: [],
  userGroups: [],
  saveTimeout: null,
  cacheKeyPrefix: 'tk_draft_'
};

/**
 * 13 Pilihan Standar Jenis Tugas Akademik
 */
const JENIS_TUGAS_OPTIONS = [
  'Makalah',
  'Laporan Praktikum',
  'Skripsi/TA',
  'Review Jurnal',
  'Proposal Penelitian',
  'Artikel Ilmiah',
  'Studi Kasus',
  'Esai Akademik',
  'Presentasi/Slide',
  'Resume Buku',
  'Tugas Terstruktur',
  'Proyek Kelompok',
  'Lainnya'
];

/**
 * Render Halaman Utama Projects (Wrapper)
 */
async function renderProjectsPage(mode = 'manager', selectedProjectId = null) {
  const container = document.getElementById('projects-container') || document.getElementById('app-main-view');
  if (!container) return;

  ProjectsState.activeTab = mode;

  container.innerHTML = `
    <div class="projects-wrapper max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      <!-- Top Navigation & Action Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>📚</span> Manajemen Tugas & Draf
          </h1>
          <p class="text-sm text-slate-500">Tulis draf terstruktur, generate outline dengan Gemini AI, dan kelola revisi tugas.</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button class="btn ${ProjectsState.activeTab === 'manager' ? 'btn-primary' : 'btn-secondary'} text-sm flex items-center gap-2 cursor-pointer"
                  onclick="renderProjectsPage('manager')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
            Draf & Editor
          </button>
          <button class="btn ${ProjectsState.activeTab === 'new' ? 'btn-primary' : 'btn-secondary'} text-sm flex items-center gap-2 cursor-pointer"
                  onclick="renderProjectsPage('new')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Buat Tugas Baru
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div id="projects-content-area"></div>
    </div>
  `;

  const contentArea = document.getElementById('projects-content-area');
  if (mode === 'new') {
    renderNewAssignmentForm(contentArea);
  } else {
    renderDraftManager(contentArea, selectedProjectId);
  }
}

/**
 * =========================================================================
 * BAGIAN 1: FORMULIR TUGAS BARU (NEW ASSIGNMENT FORM)
 * =========================================================================
 */
async function renderNewAssignmentForm(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-3xl mx-auto card p-6 md:p-8 bg-white shadow-sm border border-slate-100 rounded-2xl">
      <div class="border-b border-slate-100 pb-4 mb-6">
        <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
          <span>✨</span> Buat Tugas Kuliah Baru
        </h2>
        <p class="text-xs text-slate-500 mt-1">Lengkapi data tugas dan biarkan AI menyusun kerangka penulisan awal secara otomatis.</p>
      </div>

      <form id="new-assignment-form" onsubmit="handleFormCreateProject(event)" class="flex flex-col gap-5">
        
        <!-- Baris 1: Judul Tugas -->
        <div>
          <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Judul Tugas / Topik Penelitian <span class="text-rose-500">*</span>
          </label>
          <input type="text" id="proj-judul" required placeholder="Contoh: Analisis Penerapan Machine Learning pada IoT"
                 class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>

        <!-- Baris 2: Mata Kuliah & Jenis Tugas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mata Kuliah <span class="text-rose-500">*</span>
            </label>
            <input type="text" id="proj-matkul" required placeholder="Contoh: Kecerdasan Buatan"
                   class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Jenis Tugas <span class="text-rose-500">*</span>
            </label>
            <select id="proj-jenis" required class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
              ${JENIS_TUGAS_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Baris 3: Deadline & Prioritas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tenggat Waktu (Deadline) <span class="text-rose-500">*</span>
            </label>
            <input type="date" id="proj-deadline" required
                   class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tingkat Prioritas
            </label>
            <select id="proj-prioritas" class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
              <option value="Tinggi">Tinggi 🔴 (Mendesak)</option>
              <option value="Sedang" selected>Sedang 🟡 (Normal)</option>
              <option value="Rendah">Rendah 🟢 (Fleksibel)</option>
            </select>
          </div>
        </div>

        <!-- Baris 4: Kelompok & Template -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kelompok Kerja
            </label>
            <select id="proj-group" class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
              <option value="">Individu (Bukan Tugas Kelompok)</option>
              <option value="loading" disabled>Memuat kelompok...</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Template Struktur
            </label>
            <select id="proj-template" class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white">
              <option value="standard">Struktur Standar (Bab 1 s.d. Bab 5)</option>
              <option value="paper">Format Format Paper Ilmiah (IMRAD)</option>
              <option value="praktikum">Format Laporan Percobaan / Praktikum</option>
              <option value="review">Format Review Jurnal Kritis</option>
            </select>
          </div>
        </div>

        <!-- Baris 5: AI & Reminder Toggles -->
        <div class="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row gap-4 justify-between">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="proj-toggle-ai" checked class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            <div>
              <span class="text-sm font-bold text-slate-800">Generate Outline Otomatis (Gemini AI)</span>
              <p class="text-xs text-slate-500">AI menyusun struktur bab, sub-bab, dan poin bahasan.</p>
            </div>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" id="proj-toggle-reminder" checked class="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
            <div>
              <span class="text-sm font-bold text-slate-800">Pengingat WhatsApp H-3 & H-0</span>
              <p class="text-xs text-slate-500">Kirim notifikasi otomatis saat mendekati tenggat.</p>
            </div>
          </label>
        </div>

        <!-- Container Loading Shimmer saat AI Bekerja -->
        <div id="ai-generating-feedback" class="hidden p-4 rounded-xl border border-purple-200 bg-purple-50 flex items-center gap-3">
          <div class="animate-spin w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full flex-shrink-0"></div>
          <div class="text-xs text-purple-800">
            <strong>Sedang menyusun outline akademik dengan AI...</strong> Mohon tunggu beberapa detik, sistem sedang memetakan bab dan referensi awal.
          </div>
        </div>

        <!-- Tombol Aksi Submit -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button type="button" class="btn btn-secondary text-sm" onclick="renderProjectsPage('manager')">Batal</button>
          <button type="submit" id="btn-submit-project" class="btn btn-primary text-sm flex items-center gap-2">
            <span>🚀 Buat Proyek & Draf</span>
          </button>
        </div>

      </form>
    </div>
  `;

  // Set default deadline = 7 hari ke depan
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const dateInput = document.getElementById('proj-deadline');
  if (dateInput) dateInput.value = d.toISOString().split('T')[0];

  // Load Groups ke dropdown di background
  loadGroupsIntoDropdown();
}

/**
 * Muat daftar kelompok ke dropdown
 */
async function loadGroupsIntoDropdown() {
  const select = document.getElementById('proj-group');
  if (!select) return;

  try {
    const res = await api('group.list');
    if (res && res.success && Array.isArray(res.data)) {
      ProjectsState.userGroups = res.data;
      select.innerHTML = `<option value="">Individu (Bukan Tugas Kelompok)</option>` +
        res.data.map(g => `<option value="${g.groupId}">${escapeHtml(g.namaKelompok)} (${escapeHtml(g.mataKuliah || '')})</option>`).join('');
    } else {
      select.innerHTML = `<option value="">Individu (Bukan Tugas Kelompok)</option>`;
    }
  } catch (e) {
    select.innerHTML = `<option value="">Individu (Bukan Tugas Kelompok)</option>`;
  }
}

/**
 * Handler Submit Form Pembuatan Tugas Baru
 */
async function handleFormCreateProject(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-submit-project');
  const aiFeedback = document.getElementById('ai-generating-feedback');

  const payload = {
    judulTugas: document.getElementById('proj-judul').value.trim(),
    mataKuliah: document.getElementById('proj-matkul').value.trim(),
    jenisTugas: document.getElementById('proj-jenis').value,
    deadline: document.getElementById('proj-deadline').value,
    prioritas: document.getElementById('proj-prioritas').value,
    groupId: document.getElementById('proj-group').value || null,
    template: document.getElementById('proj-template').value,
    generateOutline: document.getElementById('proj-toggle-ai').checked,
    reminder: document.getElementById('proj-toggle-reminder').checked
  };

  if (!payload.judulTugas || !payload.mataKuliah) {
    showToast('Harap isi judul tugas dan mata kuliah!', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Menyimpan...`;

  if (payload.generateOutline && aiFeedback) {
    aiFeedback.classList.remove('hidden');
  }

  try {
    // 1. Simpan Project Baru
    const res = await api('project.create', payload);
    if (!res || !res.success) {
      throw new Error(res?.message || 'Gagal membuat proyek tugas.');
    }

    const newProject = res.data;
    showToast('Proyek tugas berhasil dibuat!', 'success');

    // 2. Jika AI Generate Outline aktif, buat outline draf otomatis
    if (payload.generateOutline) {
      try {
        const outlineRes = await api('ai.generateOutline', {
          projectId: newProject.projectId,
          judulTugas: payload.judulTugas,
          jenisTugas: payload.jenisTugas,
          mataKuliah: payload.mataKuliah
        });
        if (outlineRes && outlineRes.success) {
          showToast('Outline cerdas berhasil dibuat oleh AI!', 'success');
        }
      } catch (outlineErr) {
        console.warn('Gagal generate outline AI:', outlineErr);
        showToast('Proyek tersimpan, namun outline AI mengalami antrean.', 'warning');
      }
    }

    // Arahkan langsung ke editor draf proyek yang baru dibuat
    renderProjectsPage('manager', newProject.projectId);
  } catch (err) {
    console.error('handleCreateProject error:', err);
    showToast(err.message || 'Terjadi kesalahan sistem saat membuat tugas.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<span>🚀 Buat Proyek & Draf</span>`;
    if (aiFeedback) aiFeedback.classList.add('hidden');
  }
}

/**
 * =========================================================================
 * BAGIAN 2: DRAFT MANAGER (SPLIT LAYOUT 35/65)
 * =========================================================================
 */
async function renderDraftManager(container, targetProjectId = null) {
  if (!container) return;

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Kolom Kiri: Daftar Kartu Draf (35%) -->
      <div class="lg:col-span-4 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-bold text-slate-800">Daftar Draf Tugas</h2>
          <span class="text-xs text-slate-400" id="draft-count-badge">Memuat...</span>
        </div>
        <div id="draft-cards-list" class="flex flex-col gap-3 min-h-[300px]">
          <!-- Shimmer skeleton -->
          <div class="h-28 bg-slate-100 rounded-xl skeleton"></div>
          <div class="h-28 bg-slate-100 rounded-xl skeleton"></div>
          <div class="h-28 bg-slate-100 rounded-xl skeleton"></div>
        </div>
      </div>

      <!-- Kolom Kanan: Draf Editor (65%) -->
      <div class="lg:col-span-8 flex flex-col gap-4" id="draft-editor-wrapper">
        <div class="card p-8 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
          <h3 class="text-base font-semibold text-slate-700">Pilih Salah Satu Draf di Sebelah Kiri</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto mt-1">Klik tugas yang ingin kamu tulis atau revisi untuk membuka editor per bab terstruktur.</p>
        </div>
      </div>
    </div>
  `;

  // Ambil daftar draf
  await loadDraftList(targetProjectId);
}

/**
 * Mengambil daftar proyek/draf dari backend
 */
async function loadDraftList(targetProjectId = null) {
  const listContainer = document.getElementById('draft-cards-list');
  const countBadge = document.getElementById('draft-count-badge');
  if (!listContainer) return;

  try {
    const res = await api('project.list');
    if (res && res.success && Array.isArray(res.data)) {
      ProjectsState.draftList = res.data;
      if (countBadge) countBadge.textContent = `${res.data.length} Tugas`;
      renderDraftList(res.data, listContainer, targetProjectId);
    } else {
      listContainer.innerHTML = `
        <div class="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
          Belum ada proyek tugas aktif.
        </div>
      `;
      if (countBadge) countBadge.textContent = '0 Tugas';
    }
  } catch (err) {
    console.error('Error loadDraftList:', err);
    listContainer.innerHTML = `
      <div class="p-4 text-xs text-rose-500 bg-rose-50 rounded-xl">
        Gagal memuat daftar draf.
      </div>
    `;
  }
}

/**
 * Render kartu-kartu draf di sidebar kiri
 */
function renderDraftList(drafts, container, targetProjectId = null) {
  if (!container) return;

  if (drafts.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
        <p class="text-xs mb-3">Kamu belum memiliki tugas kuliah aktif.</p>
        <button class="btn btn-primary text-xs" onclick="renderProjectsPage('new')">+ Buat Tugas Pertama</button>
      </div>
    `;
    return;
  }

  container.innerHTML = drafts.map(d => {
    const isSelected = targetProjectId ? (d.projectId === targetProjectId) : false;
    const deadlineText = d.deadline ? formatDate(d.deadline, 'relative') : 'Tidak ada tenggat';

    return `
      <div class="card p-4 rounded-xl border cursor-pointer transition-all duration-150 relative
                  ${isSelected ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' : 'border-slate-100 hover:border-indigo-200 bg-white'}"
           id="draft-card-${d.projectId}"
           onclick="loadDraft('${d.projectId}')">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="badge badge-info text-[10px] font-semibold">${escapeHtml(d.jenisTugas || 'Tugas')}</span>
          <span class="text-[11px] font-medium text-amber-600">${deadlineText}</span>
        </div>
        <h3 class="text-sm font-bold text-slate-800 line-clamp-2 mb-1">${escapeHtml(d.judulTugas)}</h3>
        <div class="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
          <span class="truncate max-w-[140px]">${escapeHtml(d.mataKuliah || '-')}</span>
          <span class="badge ${d.statusProgres === 'Selesai' ? 'badge-success' : 'badge-warning'} text-[10px]">
            ${d.statusProgres || 'Draf'}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Auto-pilih draft jika ditargetkan atau jika ada data pertama
  if (targetProjectId) {
    loadDraft(targetProjectId);
  } else if (drafts.length > 0) {
    loadDraft(drafts[0].projectId);
  }
}

/**
 * =========================================================================
 * BAGIAN 3: DRAFT EDITOR DENGAN TAB BAB & TOOLBAR
 * =========================================================================
 */
async function loadDraft(projectId) {
  const editorWrapper = document.getElementById('draft-editor-wrapper');
  if (!editorWrapper) return;

  // Highlight kartu aktif di sidebar
  document.querySelectorAll('[id^="draft-card-"]').forEach(el => {
    el.classList.remove('border-indigo-600', 'bg-indigo-50/40', 'shadow-sm');
  });
  const activeCard = document.getElementById(`draft-card-${projectId}`);
  if (activeCard) {
    activeCard.classList.add('border-indigo-600', 'bg-indigo-50/40', 'shadow-sm');
  }

  // Tampilkan Skeleton Editor
  editorWrapper.innerHTML = `
    <div class="card p-6 bg-white rounded-2xl border border-slate-100 animate-pulse flex flex-col gap-4">
      <div class="h-8 bg-slate-200 rounded w-1/2 skeleton"></div>
      <div class="h-10 bg-slate-200 rounded w-full skeleton"></div>
      <div class="h-64 bg-slate-200 rounded w-full skeleton"></div>
    </div>
  `;

  // Cek cache draf lokal terlebih dahulu untuk instant edit (gas-instant-ux)
  let cachedDraft = null;
  try {
    const raw = localStorage.getItem(ProjectsState.cacheKeyPrefix + projectId);
    if (raw) cachedDraft = JSON.parse(raw);
  } catch (e) {}

  if (cachedDraft) {
    ProjectsState.currentDraft = cachedDraft;
    ProjectsState.currentProject = { projectId };
    renderDraftEditor(cachedDraft, editorWrapper);
  }

  // Fetch data draft dari server
  try {
    const res = await api('draft.get', { projectId });
    if (res && res.success && res.data) {
      ProjectsState.currentDraft = res.data;
      ProjectsState.currentProject = { projectId, ...(res.data.project || {}) };
      // Simpan ke cache lokal
      try {
        localStorage.setItem(ProjectsState.cacheKeyPrefix + projectId, JSON.stringify(res.data));
      } catch (err) {}
      renderDraftEditor(res.data, editorWrapper);
    } else {
      // Jika draft belum ada, inisialisasi draf default baru
      const defaultDraft = createInitialDraftStructure(projectId);
      ProjectsState.currentDraft = defaultDraft;
      renderDraftEditor(defaultDraft, editorWrapper);
    }
  } catch (err) {
    console.error('Error loadDraft:', err);
    if (!cachedDraft) {
      editorWrapper.innerHTML = `
        <div class="card p-6 text-center text-rose-600 bg-rose-50 rounded-2xl">
          <p class="text-sm font-semibold">Gagal memuat draf dari server.</p>
          <button class="btn btn-secondary text-xs mt-3" onclick="loadDraft('${projectId}')">Coba Lagi</button>
        </div>
      `;
    }
  }
}

/**
 * Inisialisasi struktur bab draf standar jika baru dibuat
 */
function createInitialDraftStructure(projectId) {
  const proj = (ProjectsState.draftList || []).find(p => p.projectId === projectId) || {};
  return {
    draftId: 'draft_' + projectId,
    projectId: projectId,
    judulTugas: proj.judulTugas || 'Tugas Kuliah',
    versi: 1,
    kontenDraf: [
      { id: 'bab_1', judul: 'Bab 1: Pendahuluan', konten: 'Latar belakang permasalahan, rumusan masalah, dan tujuan penulisan draf ini...' },
      { id: 'bab_2', judul: 'Bab 2: Tinjauan Pustaka', konten: 'Kajian teori, landasan konseptual, dan tinjauan literatur terkait...' },
      { id: 'bab_3', judul: 'Bab 3: Pembahasan', konten: 'Analisis mendalam terhadap studi kasus dan temuan utama...' },
      { id: 'bab_4', judul: 'Bab 4: Penutup', konten: 'Kesimpulan akhir dan rekomendasi akademis...' }
    ],
    versions: [
      { versi: 1, tanggal: new Date().toISOString(), catatan: 'Versi Awal Dibuat' }
    ]
  };
}

/**
 * Render Tampilan Editor Draf Lengkap
 */
function renderDraftEditor(draft, container) {
  if (!container) return;

  const kontenList = Array.isArray(draft.kontenDraf) ? draft.kontenDraf : [];
  if (ProjectsState.currentBabIndex >= kontenList.length) {
    ProjectsState.currentBabIndex = 0;
  }
  const currentBab = kontenList[ProjectsState.currentBabIndex] || { id: 'bab_1', judul: 'Bab 1', konten: '' };

  // Hitung jumlah kata
  const totalWords = kontenList.reduce((sum, b) => sum + (b.konten ? b.konten.trim().split(/\s+/).filter(Boolean).length : 0), 0);

  container.innerHTML = `
    <div class="card p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
      
      <!-- Header Editor: Judul & Action Bar -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-800">${escapeHtml(draft.judulTugas || 'Editor Draf')}</h2>
            <span class="badge badge-success text-[10px]" id="save-status-indicator">Tersimpan</span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Total ${totalWords} Kata • Versi ${draft.versi || 1}</p>
        </div>

        <!-- Tombol Aksi Toolbar -->
        <div class="flex items-center flex-wrap gap-2">
          <!-- Dropdown Version History -->
          <div class="relative" id="version-history-dropdown-wrapper">
            <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onclick="toggleVersionHistoryDropdown()">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Riwayat Versi
            </button>
            <div id="version-history-menu" class="hidden absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30">
              ${renderVersionHistory(draft.versions || [])}
            </div>
          </div>

          <!-- Export Docs -->
          <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                  onclick="handleExport('docs')">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Doc
          </button>

          <!-- Export PDF -->
          <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100"
                  onclick="handleExport('pdf')">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            PDF
          </button>
        </div>
      </div>

      <!-- Tab Per Bab (Bab 1, Bab 2, ..., + Tambah Bab) -->
      <div class="flex items-center gap-1.5 overflow-x-auto border-b border-slate-100 pb-2 scrollbar-none">
        ${kontenList.map((bab, idx) => `
          <button class="px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer
                         ${idx === ProjectsState.currentBabIndex ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                  onclick="switchBabTab(${idx})">
            ${escapeHtml(bab.judul || `Bab ${idx + 1}`)}
          </button>
        `).join('')}
        <button class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-200 cursor-pointer whitespace-nowrap"
                onclick="handleAddBab()">
          + Tambah Bab
        </button>
      </div>

      <!-- Editor Content Area -->
      <div class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <input type="text" id="current-bab-title" value="${escapeHtml(currentBab.judul)}"
                 class="font-bold text-sm text-slate-800 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5 transition"
                 onchange="handleUpdateBabTitle(this.value)" />
          
          <div class="flex items-center gap-2">
            <!-- Tombol AI Regenerate Section -->
            <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-1 px-2.5 text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100 cursor-pointer"
                    onclick="handleOpenRegenerateModal('${currentBab.id}', '${escapeHtml(currentBab.judul)}')">
              <span>✨</span> Tulis Ulang dengan AI
            </button>
          </div>
        </div>

        <!-- Textarea Draf Bab -->
        <div class="relative">
          <textarea id="current-bab-textarea" rows="12"
                    class="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed font-normal text-slate-800 bg-white resize-y"
                    placeholder="Mulai menulis draf seksi ini, atau gunakan AI Assistant untuk membantumu menyusun kalimat..."
                    oninput="handleDraftContentInput(event)">${escapeHtml(currentBab.konten || '')}</textarea>
          
          <!-- Indikator Mengetik AI (Shimmer/Typewriter) -->
          <div id="ai-typewriter-shimmer" class="hidden absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center rounded-xl">
            <div class="animate-pulse flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
              <span>🤖</span> Gemini AI sedang menulis seksi ini...
            </div>
            <p class="text-xs text-slate-500 max-w-sm">Mohon tidak menutup halaman saat teks sedang ditransmisikan.</p>
          </div>
        </div>

        <!-- Status Bar Bawah Editor -->
        <div class="flex items-center justify-between text-xs text-slate-400 pt-2">
          <span id="bab-wordcount">${(currentBab.konten || '').trim().split(/\s+/).filter(Boolean).length} kata</span>
          <span>Draf otomatis disimpan di peramban</span>
        </div>
      </div>

    </div>
  `;
}

/**
 * Berpindah tab bab
 */
function switchBabTab(index) {
  ProjectsState.currentBabIndex = index;
  renderDraftEditor(ProjectsState.currentDraft, document.getElementById('draft-editor-wrapper'));
}

/**
 * Tambah Bab Baru
 */
function handleAddBab() {
  const draft = ProjectsState.currentDraft;
  if (!draft) return;
  if (!Array.isArray(draft.kontenDraf)) draft.kontenDraf = [];

  const nextNum = draft.kontenDraf.length + 1;
  draft.kontenDraf.push({
    id: `bab_${Date.now()}`,
    judul: `Bab ${nextNum}: Pembahasan Lanjutan`,
    konten: ''
  });

  ProjectsState.currentBabIndex = draft.kontenDraf.length - 1;
  saveDraftOptimistic(draft);
  renderDraftEditor(draft, document.getElementById('draft-editor-wrapper'));
  showToast(`Bab ${nextNum} berhasil ditambahkan`, 'info', 2000);
}

/**
 * Update Judul Bab
 */
function handleUpdateBabTitle(newTitle) {
  const draft = ProjectsState.currentDraft;
  if (!draft || !draft.kontenDraf) return;
  const bab = draft.kontenDraf[ProjectsState.currentBabIndex];
  if (bab) {
    bab.judul = newTitle;
    saveDraftOptimistic(draft);
  }
}

/**
 * Handle Ketik pada Textarea Draf dengan Debounce Sync ke Server
 */
function handleDraftContentInput(e) {
  const newContent = e.target.value;
  const draft = ProjectsState.currentDraft;
  if (!draft || !draft.kontenDraf) return;

  const currentBab = draft.kontenDraf[ProjectsState.currentBabIndex];
  if (currentBab) {
    currentBab.konten = newContent;
  }

  // Update indikator jumlah kata
  const wc = document.getElementById('bab-wordcount');
  if (wc) {
    wc.textContent = `${newContent.trim().split(/\s+/).filter(Boolean).length} kata`;
  }

  // Update indikator status simpan
  const ind = document.getElementById('save-status-indicator');
  if (ind) {
    ind.className = 'badge badge-warning text-[10px]';
    ind.textContent = 'Menyimpan...';
  }

  // Simpan secara instan ke localStorage (Optimistic UX)
  saveDraftOptimistic(draft);

  // Debounce sinkronisasi ke server (1 detik jeda setelah selesai mengetik)
  if (ProjectsState.saveTimeout) clearTimeout(ProjectsState.saveTimeout);
  ProjectsState.saveTimeout = setTimeout(() => {
    syncDraftToServer(draft);
  }, 1000);
}

/**
 * Simpan Optimistik ke localStorage
 */
function saveDraftOptimistic(draft) {
  try {
    localStorage.setItem(ProjectsState.cacheKeyPrefix + draft.projectId, JSON.stringify(draft));
  } catch (e) {
    console.warn('Gagal menyimpan cache draf lokal:', e);
  }
}

/**
 * Sinkronisasi Draf ke Server GAS
 */
async function syncDraftToServer(draft) {
  const ind = document.getElementById('save-status-indicator');
  try {
    const res = await api('draft.update', {
      draftId: draft.draftId,
      projectId: draft.projectId,
      kontenDraf: draft.kontenDraf,
      versi: draft.versi
    });

    if (res && res.success) {
      if (ind) {
        ind.className = 'badge badge-success text-[10px]';
        ind.textContent = 'Tersimpan';
      }
    }
  } catch (err) {
    if (ind) {
      ind.className = 'badge badge-danger text-[10px]';
      ind.textContent = 'Gagal sinkron';
    }
  }
}

/**
 * Modal untuk Regenerate Seksi Draf dengan Prompt Kustom ke AI
 */
function handleOpenRegenerateModal(seksiId, babJudul) {
  const modalHTML = `
    <div id="ai-regenerate-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="card p-6 bg-white rounded-2xl max-w-lg w-full shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>✨</span> Tulis Ulang dengan AI: ${escapeHtml(babJudul)}
          </h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" onclick="closeAiRegenerateModal()">&times;</button>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-700 mb-1">Instruksi Khusus untuk AI (Opsional)</label>
          <textarea id="ai-custom-prompt" rows="3" class="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                    placeholder="Contoh: Fokuskan pembahasan pada perbandingan algoritma Random Forest dan SVM, sertakan contoh implementasi kasus nyata..."></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button class="btn btn-secondary text-xs" onclick="closeAiRegenerateModal()">Batal</button>
          <button class="btn btn-primary text-xs flex items-center gap-1.5" onclick="executeRegenerateSection('${seksiId}', '${escapeHtml(babJudul)}')">
            <span>🚀 Tuliskan Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('ai-regenerate-modal');
  if (existing) existing.remove();
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAiRegenerateModal() {
  const m = document.getElementById('ai-regenerate-modal');
  if (m) m.remove();
}

/**
 * Eksekusi Regenerate Section dengan efek Typewriter Streaming
 */
async function executeRegenerateSection(seksiId, babJudul) {
  const promptInput = document.getElementById('ai-custom-prompt');
  const customPrompt = promptInput ? promptInput.value.trim() : '';
  closeAiRegenerateModal();

  const shimmer = document.getElementById('ai-typewriter-shimmer');
  const textarea = document.getElementById('current-bab-textarea');
  if (shimmer) shimmer.classList.remove('hidden');

  const draft = ProjectsState.currentDraft;
  const currentBab = draft.kontenDraf[ProjectsState.currentBabIndex];

  try {
    const res = await api('ai.generateSection', {
      projectId: draft.projectId,
      seksiId: seksiId,
      babJudul: babJudul,
      customPrompt: customPrompt,
      konteksJudul: draft.judulTugas
    });

    if (res && res.success && res.data && res.data.konten) {
      if (shimmer) shimmer.classList.add('hidden');
      
      // Simulasi Typewriter Effect agar pengalaman UX responsif
      const hasilTeks = res.data.konten;
      let charIdx = 0;
      textarea.value = '';
      
      const interval = setInterval(() => {
        const chunk = hasilTeks.slice(charIdx, charIdx + 8);
        textarea.value += chunk;
        charIdx += 8;
        if (charIdx >= hasilTeks.length) {
          clearInterval(interval);
          textarea.value = hasilTeks;
          currentBab.konten = hasilTeks;
          saveDraftOptimistic(draft);
          syncDraftToServer(draft);
          showToast('Seksi draf berhasil ditulis ulang oleh AI!', 'success');
        }
      }, 20);

    } else {
      throw new Error(res?.message || 'Gagal memproses hasil AI.');
    }
  } catch (err) {
    if (shimmer) shimmer.classList.add('hidden');
    console.error('Regenerate error:', err);
    showToast(err.message || 'Gagal generate seksi dengan AI.', 'error');
  }
}

/**
 * Handle Export Google Docs atau PDF
 */
async function handleExport(type) {
  const draft = ProjectsState.currentDraft;
  if (!draft || !draft.projectId) {
    showToast('Pilih atau buka draf terlebih dahulu.', 'warning');
    return;
  }

  showToast(`Sedang menyiapkan dokumen ${type.toUpperCase()}...`, 'info', 3000);

  try {
    const action = type === 'docs' ? 'doc.exportGoogleDoc' : 'doc.exportPDF';
    const res = await api(action, {
      draftId: draft.draftId,
      projectId: draft.projectId
    });

    if (res && res.success && res.data && res.data.url) {
      showToast(`Dokumen ${type.toUpperCase()} siap dibuka!`, 'success');
      window.open(res.data.url, '_blank');
    } else {
      throw new Error(res?.message || 'Gagal mengekspor dokumen.');
    }
  } catch (err) {
    console.error('Export error:', err);
    showToast(err.message || `Gagal mengekspor ${type.toUpperCase()}`, 'error');
  }
}

/**
 * Tampilkan dropdown riwayat versi
 */
function toggleVersionHistoryDropdown() {
  const menu = document.getElementById('version-history-menu');
  if (menu) menu.classList.toggle('hidden');
}

/**
 * Render List Riwayat Versi
 */
function renderVersionHistory(versions = []) {
  if (versions.length === 0) {
    return `<div class="p-3 text-xs text-slate-400 text-center">Belum ada riwayat versi.</div>`;
  }

  return `
    <div class="text-xs font-bold text-slate-700 px-2 py-1 border-b border-slate-100 mb-1">
      Riwayat Revisi
    </div>
    <div class="max-h-48 overflow-y-auto flex flex-col gap-1">
      ${versions.map(v => `
        <div class="p-2 rounded hover:bg-slate-50 flex items-center justify-between gap-2">
          <div>
            <div class="font-bold text-slate-800 text-[11px]">Versi ${v.versi}</div>
            <div class="text-[10px] text-slate-400">${v.tanggal ? formatDate(v.tanggal, 'short') : '-'}</div>
          </div>
          <button class="btn btn-secondary text-[10px] py-0.5 px-2 cursor-pointer"
                  onclick="handleRestoreVersion(${v.versi})">
            Restore
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Restore Versi Sebelumnya
 */
async function handleRestoreVersion(versionNum) {
  toggleVersionHistoryDropdown();
  const draft = ProjectsState.currentDraft;
  if (!draft) return;

  if (!confirm(`Apakah kamu yakin ingin mengembalikan draf ke Versi ${versionNum}? Perubahan yang belum disimpan akan tertimpa.`)) {
    return;
  }

  try {
    const res = await api('draft.restore', {
      projectId: draft.projectId,
      versi: versionNum
    });

    if (res && res.success && res.data) {
      ProjectsState.currentDraft = res.data;
      saveDraftOptimistic(res.data);
      renderDraftEditor(res.data, document.getElementById('draft-editor-wrapper'));
      showToast(`Draf berhasil dikembalikan ke Versi ${versionNum}`, 'success');
    } else {
      throw new Error(res?.message || 'Gagal restore versi.');
    }
  } catch (err) {
    showToast(err.message || 'Gagal memulihkan versi draf.', 'error');
  }
}
