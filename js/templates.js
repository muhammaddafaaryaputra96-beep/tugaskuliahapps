/**
 * templates.js — Modul Perpustakaan Template Akademik TugasKuliah Apps
 * Menampilkan katalog template standar (Skripsi, Makalah, Laporan Praktikum, Magang, Slide Sidang),
 * filter kategori, pencarian real-time, pratinjau struktur bab pohon interaktif, dan aksi "Gunakan Template".
 * Desain: Persis mengikuti Desain UI/UX Google Stitch (perpustakaan_template_akademik)
 * Versi: 1.0.0
 */

window.TemplatesState = {
  templates: [],
  selectedCategory: 'all',
  searchQuery: '',
  selectedTemplate: null
};

// ============================================================
// 1. RENDER PERPUSTAKAAN TEMPLATE
// ============================================================

async function renderTemplateLibrary() {
  const container = document.getElementById('template-library-container') || document.getElementById('app-main-view');
  if (!container) return;

  // Render Skeleton dulu
  container.innerHTML = `
    <div class="px-6 md:px-8 py-8 flex flex-col gap-6 max-w-7xl mx-auto w-full animate-pulse">
      <div class="h-10 bg-slate-200 rounded w-1/3"></div>
      <div class="h-12 bg-slate-200 rounded-xl"></div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="h-64 bg-slate-200 rounded-2xl"></div>
        <div class="h-64 bg-slate-200 rounded-2xl"></div>
        <div class="h-64 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  `;

  try {
    const res = await api('template.list');
    if (res && res.success && res.data) {
      TemplatesState.templates = res.data;
    } else {
      // Fallback data default jika server offline/baru pertama kali
      TemplatesState.templates = getDefaultTemplatesFallback();
    }
  } catch (err) {
    TemplatesState.templates = getDefaultTemplatesFallback();
  }

  renderTemplateLibraryWithData(container);
}

function renderTemplateLibraryWithData(container) {
  const user = getCurrentUser() || {};
  const isAdmin = (user.peran === 'Admin');

  container.innerHTML = `
    <div class="px-6 md:px-8 py-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <span class="hover:text-indigo-600 cursor-pointer" onclick="navigateTo('dashboard')">Dashboard</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-indigo-600 font-semibold">Perpustakaan Template</span>
        </div>
        
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 class="font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">Perpustakaan Template Akademik</h1>
            <p class="text-sm text-slate-500 mt-1">
              Eksplorasi dan gunakan struktur kerangka standar akademik (Skripsi, Makalah, Laporan, Slide) yang siap pakai dan terintegrasi AI Gemini.
            </p>
          </div>
          
          <div class="flex items-center gap-3 shrink-0">
            ${isAdmin ? `
              <button onclick="showCreateTemplateModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow-md hover:bg-indigo-700 transition">
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Buat Template Baru</span>
              </button>
            ` : `
              <button onclick="showToast('Fitur pengajuan template baru akan ditinjau oleh Admin.', 'info')" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-indigo-600 border border-indigo-200 font-semibold text-sm shadow-sm hover:bg-indigo-50 transition">
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Ajukan Template</span>
              </button>
            `}
          </div>
        </div>
      </div>

      <!-- Filter Bar Card -->
      <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <!-- Category Pills -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 xl:pb-0 scrollbar-none" id="categoryPillGroup">
          <button onclick="setTemplateCategory('all')" class="cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${TemplatesState.selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}">
            Semua Template (${TemplatesState.templates.length})
          </button>
          <button onclick="setTemplateCategory('Karya Ilmiah')" class="cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${TemplatesState.selectedCategory === 'Karya Ilmiah' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}">
            📄 Skripsi &amp; Karya Ilmiah
          </button>
          <button onclick="setTemplateCategory('Makalah')" class="cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${TemplatesState.selectedCategory === 'Makalah' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}">
            📑 Makalah &amp; Literature Review
          </button>
          <button onclick="setTemplateCategory('Laporan')" class="cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${TemplatesState.selectedCategory === 'Laporan' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}">
            📋 Laporan Praktikum &amp; Magang
          </button>
          <button onclick="setTemplateCategory('Presentasi')" class="cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition ${TemplatesState.selectedCategory === 'Presentasi' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}">
            🎞️ Slide Sidang &amp; Ujian
          </button>
        </div>

        <!-- Search Input -->
        <div class="relative min-w-[280px] xl:max-w-xs">
          <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input id="templateSearchInput" type="text" oninput="handleTemplateSearch(this.value)" placeholder="Cari template akademik..."
            class="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-600 transition" />
        </div>
      </div>

      <!-- 3-Column Template Grid -->
      <div id="template-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${renderFilteredTemplateCards()}
      </div>

    </div>

    <!-- Modal Pratinjau Struktur Template -->
    <div id="template-preview-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span class="material-symbols-outlined text-[22px]">account_tree</span>
            </div>
            <div>
              <h3 id="prev-modal-title" class="font-bold text-lg text-slate-900 leading-snug">Pratinjau Struktur</h3>
              <p id="prev-modal-category" class="text-xs text-slate-500">Kategori</p>
            </div>
          </div>
          <button onclick="closeModal('template-preview-modal')" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div id="prev-modal-body" class="p-6 overflow-y-auto flex-1 space-y-4">
          <!-- Pohon Struktur Bab akan dirender di sini -->
        </div>

        <div class="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onclick="closeModal('template-preview-modal')" class="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800">
            Tutup
          </button>
          <button id="prev-modal-use-btn" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm shadow hover:bg-indigo-700 transition flex items-center gap-2">
            <span>Gunakan Template Ini</span>
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderFilteredTemplateCards() {
  const query = TemplatesState.searchQuery.toLowerCase().trim();
  const cat = TemplatesState.selectedCategory;

  let list = TemplatesState.templates.filter(t => {
    const matchesCat = (cat === 'all') || (t.kategori === cat || t.jenisTugas === cat);
    const matchesQuery = !query ||
      (t.namaTemplate && t.namaTemplate.toLowerCase().includes(query)) ||
      (t.jenisTugas && t.jenisTugas.toLowerCase().includes(query)) ||
      (t.kategori && t.kategori.toLowerCase().includes(query));
    return matchesCat && matchesQuery;
  });

  if (list.length === 0) {
    return `
      <div class="col-span-full py-16 text-center text-slate-500">
        <span class="material-symbols-outlined text-[48px] text-slate-300 mb-2">library_books</span>
        <h3 class="font-bold text-base text-slate-700">Tidak ada template yang cocok</h3>
        <p class="text-sm mt-1">Coba gunakan kata kunci pencarian yang lain.</p>
      </div>
    `;
  }

  return list.map(t => {
    let babCount = 0;
    try {
      const parsed = typeof t.strukturKonten === 'string' ? JSON.parse(t.strukturKonten) : t.strukturKonten;
      babCount = Array.isArray(parsed) ? parsed.length : (parsed?.bab?.length || 5);
    } catch (_) {
      babCount = 5;
    }

    const icons = {
      'Skripsi': 'school',
      'Karya Ilmiah': 'school',
      'Makalah': 'article',
      'Laporan': 'lab_profile',
      'Presentasi': 'slideshow',
      'Esai': 'history_edu'
    };
    const icon = icons[t.jenisTugas] || icons[t.kategori] || 'description';

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all border border-slate-100 flex flex-col justify-between group">
        <div class="flex flex-col gap-4">
          
          <div class="flex items-start justify-between">
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
              <span class="material-symbols-outlined text-[26px]">${icon}</span>
            </div>
            <span class="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold tracking-wide uppercase">
              ${escapeHtml(t.kategori || t.jenisTugas || 'Akademik')}
            </span>
          </div>

          <div>
            <h3 class="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition leading-snug">
              ${escapeHtml(t.namaTemplate)}
            </h3>
            <p class="text-xs text-slate-500 mt-2 line-clamp-2">
              Template baku standar Dikti untuk ${escapeHtml(t.jenisTugas || 'tugas akademik')} dengan susunan sub-bab komprehensif siap generate AI.
            </p>
          </div>

          <div class="flex items-center gap-3 pt-2 text-xs text-slate-500">
            <span class="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
              <span class="material-symbols-outlined text-[14px]">view_timeline</span>
              <span>${babCount} Bab Pokok</span>
            </span>
            <span class="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg">
              <span class="material-symbols-outlined text-[14px]">auto_awesome</span>
              <span>Gemini Ready</span>
            </span>
          </div>

        </div>

        <div class="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <button onclick="previewTemplate('${t.templateId}')" class="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 rounded-lg hover:bg-slate-50 transition">
            Lihat Struktur
          </button>
          <button onclick="useTemplate('${t.templateId}')" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1">
            <span>Pakai Template</span>
            <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

      </div>
    `;
  }).join('');
}

// ============================================================
// 2. INTERACTIONS & PREVIEWS
// ============================================================

function setTemplateCategory(cat) {
  TemplatesState.selectedCategory = cat;
  const grid = document.getElementById('template-grid');
  if (grid) grid.innerHTML = renderFilteredTemplateCards();

  // Update pills visual state
  document.querySelectorAll('#categoryPillGroup .cat-pill').forEach(btn => {
    btn.className = `cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600`;
  });
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.className = `cat-pill px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition bg-indigo-600 text-white shadow-sm`;
  }
}

function handleTemplateSearch(val) {
  TemplatesState.searchQuery = val;
  const grid = document.getElementById('template-grid');
  if (grid) grid.innerHTML = renderFilteredTemplateCards();
}

function previewTemplate(templateId) {
  const t = TemplatesState.templates.find(item => item.templateId === templateId);
  if (!t) return;

  TemplatesState.selectedTemplate = t;
  document.getElementById('prev-modal-title').textContent = t.namaTemplate;
  document.getElementById('prev-modal-category').textContent = `${t.jenisTugas} • Kategori: ${t.kategori}`;

  let structure = [];
  try {
    structure = typeof t.strukturKonten === 'string' ? JSON.parse(t.strukturKonten) : t.strukturKonten;
  } catch (_) {
    structure = [];
  }

  let htmlTree = '';
  if (Array.isArray(structure) && structure.length > 0) {
    htmlTree = `
      <div class="space-y-3">
        ${structure.map((item, idx) => `
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div class="flex items-center gap-2 font-bold text-sm text-slate-900">
              <span class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">${idx + 1}</span>
              <span>${escapeHtml(item.bab || item.judul || `Bagian ${idx + 1}`)}</span>
            </div>
            ${item.sub && Array.isArray(item.sub) ? `
              <ul class="mt-2 ml-8 space-y-1 text-xs text-slate-600 list-disc">
                ${item.sub.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
              </ul>
            ` : (item.deskripsi ? `<p class="mt-1 ml-8 text-xs text-slate-500">${escapeHtml(item.deskripsi)}</p>` : '')}
          </div>
        `).join('')}
      </div>
    `;
  } else {
    htmlTree = `
      <div class="p-4 bg-slate-50 rounded-xl text-sm text-slate-600">
        <p class="font-semibold mb-2">Struktur Kerangka Standar:</p>
        <ol class="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
          <li><strong>Bab I: Pendahuluan</strong> — Latar Belakang Masalah, Rumusan Masalah, Tujuan &amp; Manfaat Penelitian</li>
          <li><strong>Bab II: Tinjauan Pustaka</strong> — Landasan Teori, Penelitian Terdahulu, Kerangka Berpikir</li>
          <li><strong>Bab III: Metodologi Penelitian</strong> — Desain Penelitian, Sumber Data, Teknik Analisis</li>
          <li><strong>Bab IV: Hasil dan Pembahasan</strong> — Temuan Data, Analisis Komparatif, Diskusi Ilmiah</li>
          <li><strong>Bab V: Penutup</strong> — Kesimpulan dan Rekomendasi/Saran</li>
          <li><strong>Daftar Pustaka</strong> — Standar Format Sitasi APA 7th Edition / IEEE</li>
        </ol>
      </div>
    `;
  }

  document.getElementById('prev-modal-body').innerHTML = htmlTree;
  document.getElementById('prev-modal-use-btn').onclick = () => {
    closeModal('template-preview-modal');
    useTemplate(templateId);
  };

  showModal('template-preview-modal');
}

function useTemplate(templateId) {
  const t = TemplatesState.templates.find(item => item.templateId === templateId);
  if (!t) return;

  // Set ke AppState agar form Buat Tugas Baru otomatis terpilih template ini
  if (!window.AppState) window.AppState = { data: {} };
  if (!window.AppState.data) window.AppState.data = {};
  window.AppState.data.selectedTemplate = t;

  showToast(`Template "${t.namaTemplate}" dipilih. Mengarahkan ke form pembuatan tugas...`, 'info', 2000);
  navigateTo('buat-tugas-baru');
}

// Fallback template jika database baru
function getDefaultTemplatesFallback() {
  return [
    {
      templateId: 'TPL-SKRIPSI-01',
      namaTemplate: 'Template Skripsi & Tugas Akhir (Standar Dikti)',
      jenisTugas: 'Karya Ilmiah',
      kategori: 'Karya Ilmiah',
      strukturKonten: JSON.stringify([
        { bab: 'Bab I: Pendahuluan', sub: ['Latar Belakang Masalah', 'Identifikasi Masalah', 'Tujuan Penelitian', 'Manfaat Penelitian'] },
        { bab: 'Bab II: Kajian Pustaka', sub: ['Kajian Teoretis', 'Penelitian Relevan Sebelumnya', 'Kerangka Pemikiran', 'Hipotesis'] },
        { bab: 'Bab III: Metodologi', sub: ['Metode Penelitian', 'Populasi dan Sampel', 'Instrumen Pengumpulan Data', 'Teknik Analisis'] },
        { bab: 'Bab IV: Hasil dan Pembahasan', sub: ['Deskripsi Data Hasil Penelitian', 'Pengujian Hipotesis', 'Pembahasan Hasil Temuan'] },
        { bab: 'Bab V: Kesimpulan & Saran', sub: ['Kesimpulan Menjawab Rumusan Masalah', 'Saran bagi Peneliti Selanjutnya'] }
      ]),
      aktif: 'true'
    },
    {
      templateId: 'TPL-MAKALAH-01',
      namaTemplate: 'Format Makalah Ilmiah & Literature Review',
      jenisTugas: 'Makalah',
      kategori: 'Makalah',
      strukturKonten: JSON.stringify([
        { bab: 'Bagian Awal', sub: ['Judul Makalah', 'Abstrak (Bahasa Indonesia & Inggris)', 'Kata Kunci'] },
        { bab: 'Pendahuluan', sub: ['Latar Belakang Urgensi Topik', 'Rumusan Masalah Utama'] },
        { bab: 'Pembahasan Kritis', sub: ['Sintesis Literatur Utama', 'Analisis Argumentasi', 'Studi Komparasi'] },
        { bab: 'Penutup', sub: ['Sintesis Kesimpulan', 'Rekomendasi Kebijakan/Praktis'] },
        { bab: 'Daftar Pustaka', sub: ['Sitasi APA 7th Edition'] }
      ]),
      aktif: 'true'
    },
    {
      templateId: 'TPL-PRAKTIKUM-01',
      namaTemplate: 'Laporan Praktikum Laboratorium & Eksperimen',
      jenisTugas: 'Laporan',
      kategori: 'Laporan',
      strukturKonten: JSON.stringify([
        { bab: 'Tujuan Percobaan & Landasan Teori', sub: ['Tujuan Praktikum', 'Dasar Teori Singkat'] },
        { bab: 'Alat dan Bahan', sub: ['Daftar Alat Laboratorium', 'Bahan Eksperimen'] },
        { bab: 'Prosedur Kerja', sub: ['Langkah Kerja Sistematis'] },
        { bab: 'Data Pengamatan & Analisis', sub: ['Tabel Hasil Pengukuran', 'Perhitungan & Grafik'] },
        { bab: 'Kesimpulan & Diskusi', sub: ['Jawaban Pertanyaan Pascapercobaan', 'Faktor Kesalahan'] }
      ]),
      aktif: 'true'
    },
    {
      templateId: 'TPL-MAGANG-01',
      namaTemplate: 'Laporan Praktik Kerja Lapangan (PKL) / Magang',
      jenisTugas: 'Laporan',
      kategori: 'Laporan',
      strukturKonten: JSON.stringify([
        { bab: 'Bab I: Gambaran Umum Instansi', sub: ['Profil Perusahaan/Lembaga', 'Struktur Organisasi'] },
        { bab: 'Bab II: Ruang Lingkup Penugasan', sub: ['Posisi & Tanggung Jawab', 'Jadwal Aktivitas Mingguan'] },
        { bab: 'Bab III: Pelaksanaan Kerja & Masalah', sub: ['Proyek yang Dikerjakan', 'Kendala Lapangan & Solusi'] },
        { bab: 'Bab IV: Pembelajaran & Kesimpulan', sub: ['Keterampilan Baru', 'Saran untuk Program Studi'] }
      ]),
      aktif: 'true'
    },
    {
      templateId: 'TPL-SLIDES-01',
      namaTemplate: 'Slide Presentasi Sidang Skripsi (10 Slide Siap Sidang)',
      jenisTugas: 'Presentasi',
      kategori: 'Presentasi',
      strukturKonten: JSON.stringify([
        { bab: 'Slide 1: Judul & Identitas', sub: ['Judul Skripsi', 'Nama & NIM', 'Nama Dosen Pembimbing'] },
        { bab: 'Slide 2: Latar Belakang & Urgensi', sub: ['Problem Statement', 'Fakta Kunci'] },
        { bab: 'Slide 3: Rumusan Masalah & Batasan', sub: ['Pertanyaan Penelitian'] },
        { bab: 'Slide 4: Metodologi Penelitian', sub: ['Alur Riset', 'Teknik Analisis'] },
        { bab: 'Slide 5-7: Hasil Utama Penelitian', sub: ['Temuan Kunci', 'Visualisasi Grafik'] },
        { bab: 'Slide 8: Pembahasan & Diskusi', sub: ['Komparasi Teori'] },
        { bab: 'Slide 9: Kesimpulan & Kontribusi', sub: ['Point Jawaban Masalah'] },
        { bab: 'Slide 10: Sesi Tanya Jawab (Q&A)', sub: ['Ucapan Terima Kasih'] }
      ]),
      aktif: 'true'
    }
  ];
}
