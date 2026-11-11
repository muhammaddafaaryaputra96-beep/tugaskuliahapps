/**
 * references.js - Reference Manager (Manajemen Referensi & Sitasi AI)
 * Desain: Flowly-inspired, Primary #4F46E5, Radius 12px, Font Plus Jakarta Sans
 * Menggunakan api() dari utils.js, navigateTo() dari app.js, dan AppState.
 */

window.ReferencesState = {
  currentProjectId: null,
  references: [],
  filteredRefs: [],
  searchQuery: '',
  citationFilter: 'ALL', // 'ALL' | 'APA' | 'IEEE' | 'CHICAGO'
  sortColumn: 'tahun',   // 'judul' | 'pengarang' | 'tahun'
  sortAsc: false,
  extractedPreview: null,
  cacheKey: 'tk_references_cache'
};

/**
 * Render Halaman Utama Reference Manager
 */
async function renderReferencesPage(projectId = null) {
  const container = document.getElementById('references-container') || document.getElementById('app-main-view');
  if (!container) return;

  ReferencesState.currentProjectId = projectId;

  container.innerHTML = `
    <div class="references-wrapper max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      
      <!-- Top Action Bar & Header -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>📖</span> Manajer Referensi & Sitasi AI
          </h1>
          <p class="text-sm text-slate-500">Ekstrak metadata jurnal otomatis via AI, format sitasi standar (APA/IEEE/Chicago), dan unduh daftar pustaka.</p>
        </div>
        <div class="flex items-center gap-2.5">
          <button class="btn btn-secondary text-sm flex items-center gap-1.5 cursor-pointer text-slate-700 hover:bg-slate-100"
                  onclick="handleExportBibliography()">
            <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export Daftar Pustaka (.txt)
          </button>
        </div>
      </div>

      <!-- Formulir Ekstraksi Jurnal/Referensi Otomatis via AI -->
      <div id="add-reference-form-card" class="card p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
        ${renderAddReferenceForm()}
      </div>

      <!-- Container Preview Hasil Ekstraksi AI (Hidden secara default) -->
      <div id="ai-extract-preview-container" class="hidden"></div>

      <!-- Filter Bar: Search, Format Filter, Sort -->
      <div class="card p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <!-- Search Box -->
        <div class="relative flex-1">
          <input type="text" id="ref-search-input" placeholder="Cari judul artikel, pengarang, atau jurnal..."
                 class="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                 oninput="handleSearchReference(this.value)" />
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>

        <!-- Filter Format Sitasi -->
        <div class="flex items-center gap-1 overflow-x-auto">
          <span class="text-xs font-semibold text-slate-500 mr-1 flex-shrink-0">Format:</span>
          ${['ALL', 'APA', 'IEEE', 'CHICAGO'].map(fmt => `
            <button class="px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer
                           ${ReferencesState.citationFilter === fmt ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}"
                    onclick="handleFilterCitationFormat('${fmt}')">
              ${fmt === 'ALL' ? 'Semua' : fmt}
            </button>
          `).join('')}
        </div>

        <!-- Sort Column -->
        <div class="flex items-center gap-2">
          <span class="text-xs font-semibold text-slate-500 flex-shrink-0">Urutkan:</span>
          <select id="ref-sort-select" class="h-10 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onchange="handleSortReference(this.value)">
            <option value="tahun-desc" selected>Tahun Terbit (Terbaru)</option>
            <option value="tahun-asc">Tahun Terbit (Terlama)</option>
            <option value="judul-asc">Judul Artikel (A-Z)</option>
            <option value="pengarang-asc">Nama Pengarang (A-Z)</option>
          </select>
        </div>
      </div>

      <!-- Tabel Daftar Referensi -->
      <div id="references-table-card" class="card bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="p-8 text-center text-slate-400">
          <div class="animate-spin w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p class="text-xs">Memuat daftar referensi...</p>
        </div>
      </div>

    </div>
  `;

  // Ambil data referensi
  await loadReferencesData(projectId);
}

/**
 * Render Form Ekstraksi Referensi via AI
 */
function renderAddReferenceForm() {
  return `
    <div class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>⚡</span> Tambah & Ekstrak Referensi Cepat dengan AI
        </h2>
        <span class="text-xs text-indigo-600 font-medium">Mendukung DOI, URL ArXiv/IEEE, atau Judul Paper</span>
      </div>

      <div class="flex flex-col sm:flex-row gap-2.5">
        <div class="relative flex-1">
          <input type="text" id="ref-input-query"
                 placeholder="Tempel URL Jurnal, DOI (misal: 10.1145/...), atau ketik Judul Lengkap Paper..."
                 class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>
        <button id="btn-extract-ai" class="btn btn-primary text-sm flex items-center justify-center gap-2 px-5 py-2.5 cursor-pointer flex-shrink-0"
                onclick="handleExtractReference()">
          <span>✨ Ekstrak dengan AI</span>
        </button>
      </div>
      <p class="text-[11px] text-slate-400">
        Tips: AI akan otomatis mencari nama penulis, tahun terbit, nama jurnal, menyusun intisari ringkas, serta memformat sitasi dalam standar akademik.
      </p>
    </div>
  `;
}

/**
 * Handle Ekstraksi Referensi dengan AI
 */
async function handleExtractReference() {
  const input = document.getElementById('ref-input-query');
  const btn = document.getElementById('btn-extract-ai');
  const previewContainer = document.getElementById('ai-extract-preview-container');

  const query = input ? input.value.trim() : '';
  if (!query) {
    showToast('Masukkan URL, DOI, atau Judul Jurnal terlebih dahulu!', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-1.5">⏳</span> Mengekstrak...`;

  try {
    const res = await api('reference.extractAI', {
      query: query,
      projectId: ReferencesState.currentProjectId
    });

    if (res && res.success && res.data) {
      ReferencesState.extractedPreview = res.data;
      renderExtractedPreview(res.data, previewContainer);
      showToast('Metadata dan sitasi berhasil diekstrak!', 'success');
    } else {
      throw new Error(res?.message || 'AI tidak berhasil menemukan metadata referensi tersebut.');
    }
  } catch (err) {
    console.error('Extract error:', err);
    showToast(err.message || 'Gagal mengekstrak referensi dengan AI.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<span>✨ Ekstrak dengan AI</span>`;
  }
}

/**
 * Render Preview Hasil Ekstraksi AI dengan Tab Sitasi (APA / IEEE / Chicago)
 */
function renderExtractedPreview(data, container) {
  if (!container) return;

  container.classList.remove('hidden');

  const apaCitation = data.sitasiAPA || `${data.pengarang || 'Penulis'}. (${data.tahun || '2024'}). ${data.judulArtikel}. ${data.sumberJurnal || 'Jurnal Ilmiah'}.`;
  const ieeeCitation = data.sitasiIEEE || `[1] ${data.pengarang || 'Penulis'}, "${data.judulArtikel}," ${data.sumberJurnal || 'Jurnal'}, vol. 1, ${data.tahun || '2024'}.`;
  const chicagoCitation = data.sitasiChicago || `${data.pengarang || 'Penulis'}. "${data.judulArtikel}." ${data.sumberJurnal || 'Jurnal'} (${data.tahun || '2024'}).`;

  container.innerHTML = `
    <div class="card p-6 bg-indigo-50/40 rounded-2xl border border-indigo-200 shadow-md flex flex-col gap-4 animate-scaleUp">
      <div class="flex items-center justify-between border-b border-indigo-100 pb-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">✓</span>
          <div>
            <h3 class="text-sm font-bold text-slate-800">Pratinjau Hasil Ekstraksi AI</h3>
            <p class="text-xs text-slate-500">Periksa detail metadata sebelum menyimpannya ke daftar referensi.</p>
          </div>
        </div>
        <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" onclick="closeExtractedPreview()">&times;</button>
      </div>

      <!-- Metadata Ekstraksi -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-xl border border-indigo-100">
        <div>
          <span class="text-slate-400 font-semibold block">Judul Artikel / Paper:</span>
          <span class="font-bold text-slate-800 text-sm">${escapeHtml(data.judulArtikel || '-')}</span>
        </div>
        <div>
          <span class="text-slate-400 font-semibold block">Pengarang:</span>
          <span class="font-bold text-slate-800">${escapeHtml(data.pengarang || '-')}</span>
        </div>
        <div>
          <span class="text-slate-400 font-semibold block">Tahun Terbit:</span>
          <span class="font-bold text-slate-800">${escapeHtml(data.tahun || '-')}</span>
        </div>
        <div>
          <span class="text-slate-400 font-semibold block">Jurnal / Penerbit:</span>
          <span class="font-bold text-slate-800">${escapeHtml(data.sumberJurnal || '-')}</span>
        </div>
      </div>

      <!-- Intisari Otomatis -->
      <div class="bg-white p-4 rounded-xl border border-indigo-100">
        <span class="text-xs font-bold text-indigo-700 block mb-1">💡 Intisari Ringkas (AI Summary):</span>
        <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(data.intisariOtomatis || 'Tidak ada intisari ringkas.')}</p>
      </div>

      <!-- Tab Format Sitasi Akademik -->
      <div class="bg-white p-4 rounded-xl border border-indigo-100 flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5" id="preview-citation-tabs">
            <button class="px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 text-white cursor-pointer" onclick="switchCitationPreviewTab('apa')">APA 7th</button>
            <button class="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" onclick="switchCitationPreviewTab('ieee')">IEEE</button>
            <button class="px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer" onclick="switchCitationPreviewTab('chicago')">Chicago</button>
          </div>
          <button class="btn btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 cursor-pointer"
                  onclick="copyPreviewCitation()">
            📋 Salin Sitasi
          </button>
        </div>

        <div id="preview-citation-text" class="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 break-words">
          ${escapeHtml(apaCitation)}
        </div>
      </div>

      <!-- Tombol Aksi Simpan -->
      <div class="flex items-center justify-end gap-2 pt-2">
        <button class="btn btn-secondary text-xs" onclick="closeExtractedPreview()">Abaikan</button>
        <button class="btn btn-primary text-xs flex items-center gap-1.5 px-4" onclick="saveExtractedReference()">
          <span>💾 Simpan ke Daftar Referensi</span>
        </button>
      </div>
    </div>
  `;

  // Simpan data sitasi ke window agar bisa diakses tab switcher
  window._curPreview = {
    apa: apaCitation,
    ieee: ieeeCitation,
    chicago: chicagoCitation,
    currentTab: 'apa'
  };
}

function switchCitationPreviewTab(tab) {
  if (!window._curPreview) return;
  window._curPreview.currentTab = tab;
  const box = document.getElementById('preview-citation-text');
  if (box) box.textContent = window._curPreview[tab];

  const buttons = document.querySelectorAll('#preview-citation-tabs button');
  buttons.forEach((b, idx) => {
    const isTarget = (idx === 0 && tab === 'apa') || (idx === 1 && tab === 'ieee') || (idx === 2 && tab === 'chicago');
    b.className = isTarget
      ? 'px-2.5 py-1 text-xs font-bold rounded bg-indigo-600 text-white cursor-pointer'
      : 'px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer';
  });
}

function copyPreviewCitation() {
  if (!window._curPreview) return;
  const text = window._curPreview[window._curPreview.currentTab];
  navigator.clipboard.writeText(text);
  showToast('Sitasi disalin ke clipboard!', 'success', 2000);
}

function closeExtractedPreview() {
  const container = document.getElementById('ai-extract-preview-container');
  if (container) container.classList.add('hidden');
}

/**
 * Simpan data ekstraksi ke database Google Sheets
 */
async function saveExtractedReference() {
  const data = ReferencesState.extractedPreview;
  if (!data) return;

  const payload = {
    refId: 'ref_' + Date.now(),
    projectId: ReferencesState.currentProjectId || '',
    judulArtikel: data.judulArtikel || 'Tanpa Judul',
    pengarang: data.pengarang || 'Anonim',
    tahun: data.tahun || new Date().getFullYear(),
    sumberJurnal: data.sumberJurnal || '',
    urlDOI: data.urlDOI || '',
    intisariOtomatis: data.intisariOtomatis || '',
    formatSitasi: (window._curPreview?.currentTab || 'APA').toUpperCase(),
    hasilSitasi: window._curPreview ? window._curPreview[window._curPreview.currentTab] : ''
  };

  // Optimistic UI Update
  ReferencesState.references.unshift(payload);
  applyFiltersAndRenderTable();
  closeExtractedPreview();
  showToast('Referensi berhasil ditambahkan!', 'success');

  // Bersihkan input
  const inp = document.getElementById('ref-input-query');
  if (inp) inp.value = '';

  try {
    const res = await api('reference.create', payload);
    if (!res || !res.success) {
      throw new Error(res?.message || 'Gagal menyimpan ke server');
    }
  } catch (err) {
    showToast('Gagal menyinkronkan referensi ke server', 'error');
  }
}

/**
 * Muat data daftar referensi dari server atau cache
 */
async function loadReferencesData(projectId = null) {
  const card = document.getElementById('references-table-card');
  if (!card) return;

  // Cek cache lokal
  try {
    const rawCache = localStorage.getItem(ReferencesState.cacheKey);
    if (rawCache) {
      const cached = JSON.parse(rawCache);
      if (Array.isArray(cached) && cached.length > 0) {
        ReferencesState.references = cached;
        applyFiltersAndRenderTable();
      }
    }
  } catch (e) {}

  try {
    const res = await api('reference.list', { projectId });
    if (res && res.success && Array.isArray(res.data)) {
      ReferencesState.references = res.data;
      try {
        localStorage.setItem(ReferencesState.cacheKey, JSON.stringify(res.data));
      } catch (e) {}
      applyFiltersAndRenderTable();
    } else {
      if (ReferencesState.references.length === 0) {
        renderReferenceTable([]);
      }
    }
  } catch (err) {
    console.error('Error loadReferencesData:', err);
    if (ReferencesState.references.length === 0) {
      card.innerHTML = `
        <div class="p-6 text-center text-rose-500 bg-rose-50">
          Gagal memuat referensi dari server.
        </div>
      `;
    }
  }
}

/**
 * Terapkan pencarian, filter format sitasi, dan pengurutan
 */
function applyFiltersAndRenderTable() {
  let list = [...ReferencesState.references];

  // 1. Filter Pencarian Teks
  if (ReferencesState.searchQuery) {
    const q = ReferencesState.searchQuery.toLowerCase();
    list = list.filter(r =>
      (r.judulArtikel || '').toLowerCase().includes(q) ||
      (r.pengarang || '').toLowerCase().includes(q) ||
      (r.sumberJurnal || '').toLowerCase().includes(q)
    );
  }

  // 2. Filter Format Sitasi
  if (ReferencesState.citationFilter !== 'ALL') {
    list = list.filter(r => (r.formatSitasi || 'APA').toUpperCase() === ReferencesState.citationFilter);
  }

  // 3. Sorting
  const sort = ReferencesState.sortColumn;
  const isAsc = ReferencesState.sortAsc;

  list.sort((a, b) => {
    let valA = a[sort] || '';
    let valB = b[sort] || '';
    if (sort === 'tahun') {
      valA = parseInt(valA, 10) || 0;
      valB = parseInt(valB, 10) || 0;
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return isAsc ? -1 : 1;
    if (valA > valB) return isAsc ? 1 : -1;
    return 0;
  });

  ReferencesState.filteredRefs = list;
  renderReferenceTable(list);
}

/**
 * Render Tabel Referensi (Desktop Table & Mobile Card-List)
 */
function renderReferenceTable(refs) {
  const container = document.getElementById('references-table-card');
  if (!container) return;

  if (refs.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400">
        <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
        <p class="text-sm font-semibold text-slate-600">Belum Ada Referensi</p>
        <p class="text-xs text-slate-400 mt-1">Gunakan formulir AI di atas untuk mengekstrak dan menyimpan referensi karya ilmiah.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <!-- Header Status Jumlah Data -->
    <div class="px-6 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
      <span class="font-bold text-slate-700">Daftar Sumber Pustaka (${refs.length})</span>
      <span>Klik sitasi untuk menyalin instan</span>
    </div>

    <!-- Tampilan Desktop: Table (Tersembunyi di layar HP < 768px) -->
    <div class="hidden md:block overflow-x-auto">
      <table class="w-full text-left border-collapse text-xs">
        <thead>
          <tr class="border-b border-slate-100 bg-slate-50/30 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
            <th class="py-3 px-4">Judul Artikel</th>
            <th class="py-3 px-4">Pengarang</th>
            <th class="py-3 px-3 text-center">Tahun</th>
            <th class="py-3 px-4">Jurnal / Penerbit</th>
            <th class="py-3 px-3 text-center">Format</th>
            <th class="py-3 px-4 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 text-slate-700">
          ${refs.map(r => `
            <tr class="hover:bg-slate-50/70 transition-colors">
              <td class="py-3 px-4 max-w-xs">
                <div class="font-bold text-slate-800 line-clamp-2" title="${escapeHtml(r.judulArtikel)}">
                  ${escapeHtml(r.judulArtikel)}
                </div>
                ${r.urlDOI ? `<a href="${escapeHtml(r.urlDOI)}" target="_blank" class="text-[10px] text-indigo-600 hover:underline">DOI/Link &rarr;</a>` : ''}
              </td>
              <td class="py-3 px-4 max-w-[160px] truncate" title="${escapeHtml(r.pengarang)}">
                ${escapeHtml(r.pengarang || '-')}
              </td>
              <td class="py-3 px-3 text-center font-semibold text-slate-600">
                ${r.tahun || '-'}
              </td>
              <td class="py-3 px-4 max-w-[160px] truncate text-slate-500" title="${escapeHtml(r.sumberJurnal)}">
                ${escapeHtml(r.sumberJurnal || '-')}
              </td>
              <td class="py-3 px-3 text-center">
                <span class="badge ${r.formatSitasi === 'IEEE' ? 'badge-warning' : r.formatSitasi === 'CHICAGO' ? 'badge-danger' : 'badge-info'} text-[10px] font-bold">
                  ${r.formatSitasi || 'APA'}
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1.5">
                  <button class="btn btn-secondary text-[11px] py-1 px-2.5 cursor-pointer text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                          onclick="copyCitation('${r.refId}')" title="Salin Sitasi Lengkap">
                    📋 Salin
                  </button>
                  <button class="p-1 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"
                          onclick="handleDeleteReference('${r.refId}')" title="Hapus Referensi">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Tampilan Mobile (< 768px): Card-List Responsive -->
    <div class="block md:hidden divide-y divide-slate-100">
      ${refs.map(r => `
        <div class="p-4 flex flex-col gap-2 bg-white">
          <div class="flex items-start justify-between gap-2">
            <h3 class="font-bold text-xs text-slate-800 line-clamp-2">${escapeHtml(r.judulArtikel)}</h3>
            <span class="badge badge-info text-[9px] flex-shrink-0">${r.formatSitasi || 'APA'}</span>
          </div>
          <div class="text-[11px] text-slate-500">
            <span>${escapeHtml(r.pengarang || 'Anonim')}</span> • <span>${r.tahun || '-'}</span> • <span>${escapeHtml(r.sumberJurnal || '')}</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-slate-50 mt-1">
            <button class="btn btn-secondary text-xs py-1 px-3 text-indigo-600 bg-indigo-50" onclick="copyCitation('${r.refId}')">
              📋 Salin Sitasi
            </button>
            <button class="text-rose-500 text-xs px-2 py-1" onclick="handleDeleteReference('${r.refId}')">
              Hapus
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Salin Sitasi ke Clipboard
 */
function copyCitation(refId) {
  const ref = ReferencesState.references.find(r => r.refId === refId);
  if (!ref) return;

  const text = ref.hasilSitasi || `${ref.pengarang} (${ref.tahun}). ${ref.judulArtikel}. ${ref.sumberJurnal}.`;
  navigator.clipboard.writeText(text);
  showToast('Sitasi berhasil disalin ke clipboard!', 'success', 2000);
}

/**
 * Hapus Referensi (Optimistic UI)
 */
async function handleDeleteReference(refId) {
  if (!confirm('Hapus referensi ini dari daftar pustaka?')) return;

  // Optimistic Remove
  const oldRefs = [...ReferencesState.references];
  ReferencesState.references = ReferencesState.references.filter(r => r.refId !== refId);
  applyFiltersAndRenderTable();
  showToast('Referensi dihapus.', 'info', 2000);

  try {
    const res = await api('reference.delete', { refId });
    if (!res || !res.success) {
      throw new Error(res?.message || 'Gagal menghapus');
    }
  } catch (err) {
    ReferencesState.references = oldRefs;
    applyFiltersAndRenderTable();
    showToast('Gagal menghapus referensi di server', 'error');
  }
}

/**
 * Filter Pencarian Inline
 */
function handleSearchReference(query) {
  ReferencesState.searchQuery = query;
  applyFiltersAndRenderTable();
}

/**
 * Filter Format Sitasi
 */
function handleFilterCitationFormat(format) {
  ReferencesState.citationFilter = format;
  applyFiltersAndRenderTable();
}

/**
 * Handler Sort Dropdown
 */
function handleSortReference(sortVal) {
  const [col, dir] = sortVal.split('-');
  ReferencesState.sortColumn = col;
  ReferencesState.sortAsc = (dir === 'asc');
  applyFiltersAndRenderTable();
}

/**
 * Export Semua Referensi menjadi Dokumen Daftar Pustaka .txt
 */
async function handleExportBibliography() {
  if (ReferencesState.references.length === 0) {
    showToast('Belum ada referensi untuk diekspor.', 'warning');
    return;
  }

  showToast('Menyiapkan daftar pustaka...', 'info', 2000);

  try {
    const res = await api('reference.exportBibliography', {
      projectId: ReferencesState.currentProjectId
    });

    let contentText = '';
    if (res && res.success && res.data && res.data.content) {
      contentText = res.data.content;
    } else {
      // Fallback format dari array lokal jika API tidak mengembalikan konten
      contentText = "DAFTAR PUSTAKA\n=========================================\n\n" +
        ReferencesState.references.map((r, idx) => {
          const cit = r.hasilSitasi || `${r.pengarang} (${r.tahun}). ${r.judulArtikel}. ${r.sumberJurnal}.`;
          return `[${idx + 1}] ${cit}`;
        }).join('\n\n');
    }

    // Trigger download file .txt di browser
    const blob = new Blob([contentText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daftar_Pustaka_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Daftar pustaka berhasil diunduh sebagai .txt!', 'success');
  } catch (err) {
    console.error('Export bib error:', err);
    showToast('Gagal mengekspor daftar pustaka', 'error');
  }
}
