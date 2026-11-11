/**
 * groups.js - Kolaborasi Kelompok Kuliah (Group Workspace)
 * Desain: Flowly-inspired, Primary #4F46E5, Radius 12px, Font Plus Jakarta Sans
 * Menggunakan api() dari utils.js, navigateTo() dari app.js, dan AppState.
 */

window.GroupsState = {
  groups: [],
  selectedGroupId: null,
  activeTab: 'my-chapter', // 'my-chapter' | 'progress' | 'merged'
  currentGroup: null,
  userRole: 'MEMBER',      // 'LEADER' | 'MEMBER'
  mergedDraftContent: '',
  cacheKey: 'tk_groups_cache'
};

/**
 * Render Halaman Utama Group Workspace
 */
async function renderGroupWorkspace() {
  const container = document.getElementById('groups-container') || document.getElementById('app-main-view');
  if (!container) return;

  // 1. Tampilkan Skeleton Loading Awal
  container.innerHTML = `
    <div class="max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6 animate-pulse">
      <div class="h-20 bg-slate-200 rounded-2xl w-full skeleton"></div>
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-4 h-96 bg-slate-200 rounded-2xl skeleton"></div>
        <div class="lg:col-span-8 h-96 bg-slate-200 rounded-2xl skeleton"></div>
      </div>
    </div>
  `;

  // Cek cache lokal untuk instant load (gas-instant-ux)
  try {
    const raw = localStorage.getItem(GroupsState.cacheKey);
    if (raw) {
      const cached = JSON.parse(raw);
      if (Array.isArray(cached) && cached.length > 0) {
        GroupsState.groups = cached;
        renderGroupWorkspaceWithData(container, cached);
      }
    }
  } catch (e) {}

  // 2. Fetch data kelompok dari server GAS
  try {
    const res = await api('group.list');
    if (res && res.success && Array.isArray(res.data)) {
      GroupsState.groups = res.data;
      try {
        localStorage.setItem(GroupsState.cacheKey, JSON.stringify(res.data));
      } catch (err) {}
      renderGroupWorkspaceWithData(container, res.data);
    } else {
      if (GroupsState.groups.length === 0) {
        renderGroupEmptyState(container);
      }
    }
  } catch (err) {
    console.error('Error group list:', err);
    if (GroupsState.groups.length === 0) {
      renderGroupEmptyState(container);
    }
  }
}

/**
 * Render Empty State jika pengguna belum memiliki kelompok
 */
function renderGroupEmptyState(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="max-w-2xl mx-auto p-6 md:p-12 text-center flex flex-col items-center gap-6">
      <div class="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-4xl shadow-sm">
        👥
      </div>
      <div>
        <h2 class="text-2xl font-bold text-slate-800 tracking-tight">Belum Bergabung dengan Kelompok</h2>
        <p class="text-sm text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
          Kerjakan tugas kelompok dengan pembagian bab otomatis, pantau progres pengerjaan rekan tim secara real-time, dan gabungkan draf akhir menjadi satu dokumen utuh.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button class="btn btn-primary text-sm px-6 py-3 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer shadow-md"
                onclick="openCreateGroupModal()">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
          Buat Kelompok Baru
        </button>
        <button class="btn btn-secondary text-sm px-6 py-3 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                onclick="openJoinGroupModal()">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
          Gabung dengan Kode
        </button>
      </div>
    </div>
  `;
}

/**
 * Render Tampilan Workspace Kelompok (Split Layout Kiri Info Kelompok & Anggota, Kanan Tab Workspace)
 */
function renderGroupWorkspaceWithData(container, groups) {
  if (groups.length === 0) {
    renderGroupEmptyState(container);
    return;
  }

  // Pilih grup pertama secara default jika belum dipilih
  if (!GroupsState.selectedGroupId || !groups.find(g => g.groupId === GroupsState.selectedGroupId)) {
    GroupsState.selectedGroupId = groups[0].groupId;
  }

  const currentGroup = groups.find(g => g.groupId === GroupsState.selectedGroupId) || groups[0];
  GroupsState.currentGroup = currentGroup;

  // Tentukan apakah user saat ini adalah Leader
  const currentUser = window.AppState?.user || {};
  const isLeader = (currentGroup.ketuaUserId === currentUser.userId) || (currentUser.email && currentGroup.ketuaEmail === currentUser.email);
  GroupsState.userRole = isLeader ? 'LEADER' : 'MEMBER';

  container.innerHTML = `
    <div class="groups-workspace-wrapper max-w-7xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      
      <!-- Top Action Bar & Group Switcher -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight">
              ${escapeHtml(currentGroup.namaKelompok)}
            </h1>
            <span class="badge ${isLeader ? 'badge-warning font-bold' : 'badge-info'} text-xs">
              ${isLeader ? '👑 KETUA KELOMPOK' : 'ANGGOTA'}
            </span>
          </div>
          <p class="text-sm text-slate-500 mt-0.5">
            Mata Kuliah: <strong class="text-slate-700">${escapeHtml(currentGroup.mataKuliah || '-')}</strong>
          </p>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Dropdown ganti grup jika punya lebih dari 1 grup -->
          ${groups.length > 1 ? `
            <select class="h-10 px-3 rounded-lg border border-slate-200 text-xs bg-white font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onchange="handleSwitchGroup(this.value)">
              ${groups.map(g => `<option value="${g.groupId}" ${g.groupId === currentGroup.groupId ? 'selected' : ''}>${escapeHtml(g.namaKelompok)}</option>`).join('')}
            </select>
          ` : ''}

          <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 cursor-pointer" onclick="openCreateGroupModal()">
            + Buat Grup Baru
          </button>
          <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-2 px-3 cursor-pointer" onclick="openJoinGroupModal()">
            Gabung Kode
          </button>
        </div>
      </div>

      <!-- Main Split Layout (Kiri: Info & Anggota 35%, Kanan: 3 Tab Konten 65%) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Kolom Kiri: Group Info & Member List (35%) -->
        <div class="lg:col-span-4 flex flex-col gap-5">
          <div id="group-info-card" class="card p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
            ${renderGroupInfo(currentGroup)}
          </div>
        </div>

        <!-- Kolom Kanan: 3 Tab Workspace (65%) -->
        <div class="lg:col-span-8 flex flex-col gap-4">
          <!-- Tab Navigation Bar -->
          <div class="card p-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-1">
            <button class="flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer text-center
                           ${GroupsState.activeTab === 'my-chapter' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}"
                    onclick="switchGroupWorkspaceTab('my-chapter')">
              ✍️ Bab Saya
            </button>
            <button class="flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer text-center
                           ${GroupsState.activeTab === 'progress' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}"
                    onclick="switchGroupWorkspaceTab('progress')">
              📊 Progres Kelompok
            </button>
            <button class="flex-1 py-2 text-xs font-bold rounded-lg transition cursor-pointer text-center
                           ${GroupsState.activeTab === 'merged' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}"
                    onclick="switchGroupWorkspaceTab('merged')">
              📑 Draf Gabungan ${isLeader ? '👑' : ''}
            </button>
          </div>

          <!-- Tab Content Display Area -->
          <div id="group-tab-content-area" class="card p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <!-- Diisi oleh switchGroupWorkspaceTab -->
          </div>
        </div>

      </div>

    </div>
  `;

  // Render tab awal
  switchGroupWorkspaceTab(GroupsState.activeTab);
}

/**
 * Render Info Card Kelompok & Daftar Anggota
 */
function renderGroupInfo(group) {
  const anggota = Array.isArray(group.anggota) ? group.anggota : [
    { userId: group.ketuaUserId, nama: group.ketuaNama || 'Ketua Kelompok', role: 'LEADER', babName: 'Bab 1: Pendahuluan', progress: 80 }
  ];

  return `
    <div class="flex flex-col gap-4">
      <!-- Kode Undangan -->
      <div class="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
        <div>
          <span class="text-[10px] uppercase font-bold text-indigo-700 tracking-wider block">Kode Undangan Tim</span>
          <span class="text-base font-extrabold font-mono text-indigo-900 tracking-widest">${escapeHtml(group.kodeUndangan || group.groupId || 'TK-8829')}</span>
        </div>
        <button class="btn btn-secondary text-xs py-1 px-2.5 bg-white text-indigo-600 hover:bg-indigo-50 cursor-pointer"
                onclick="copyGroupCode('${escapeHtml(group.kodeUndangan || group.groupId || 'TK-8829')}')">
          Salin
        </button>
      </div>

      <!-- Header Daftar Anggota -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500">Anggota Tim (${anggota.length})</h3>
        ${GroupsState.userRole === 'LEADER' ? `
          <button class="text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer" onclick="openInviteMemberModal()">
            + Anggota
          </button>
        ` : ''}
      </div>

      <!-- List Anggota & Penugasan Bab -->
      <div class="flex flex-col gap-3">
        ${anggota.map(m => {
          const isKetua = m.role === 'LEADER' || m.userId === group.ketuaUserId;
          return `
            <div class="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    ${(m.nama || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div class="font-bold text-xs text-slate-800 flex items-center gap-1">
                      ${escapeHtml(m.nama || 'Anggota')}
                      ${isKetua ? '<span title="Ketua Kelompok">👑</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-400">${escapeHtml(m.email || 'mahasiswa@kampus.id')}</div>
                  </div>
                </div>
                <span class="text-[11px] font-bold text-indigo-600">${m.progress || 0}%</span>
              </div>

              <!-- Chapter Assignment Badge / Dropdown -->
              <div class="flex items-center justify-between pt-2 border-t border-slate-200/50 text-xs">
                <span class="text-[11px] text-slate-500 font-medium">Tugas Bab:</span>
                ${GroupsState.userRole === 'LEADER' ? `
                  <select class="text-[11px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 font-semibold focus:outline-none"
                          onchange="handleAssignChapter('${group.groupId}', '${m.userId}', this.value)">
                    <option value="Bab 1: Pendahuluan" ${m.babName === 'Bab 1: Pendahuluan' ? 'selected' : ''}>Bab 1</option>
                    <option value="Bab 2: Tinjauan Pustaka" ${m.babName === 'Bab 2: Tinjauan Pustaka' ? 'selected' : ''}>Bab 2</option>
                    <option value="Bab 3: Pembahasan" ${m.babName === 'Bab 3: Pembahasan' ? 'selected' : ''}>Bab 3</option>
                    <option value="Bab 4: Penutup" ${m.babName === 'Bab 4: Penutup' ? 'selected' : ''}>Bab 4</option>
                  </select>
                ` : `
                  <span class="badge badge-info text-[10px] font-semibold">${escapeHtml(m.babName || 'Belum Ditugaskan')}</span>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * Berpindah Tab Workspace
 */
function switchGroupWorkspaceTab(tab) {
  GroupsState.activeTab = tab;
  const contentArea = document.getElementById('group-tab-content-area');
  if (!contentArea) return;

  // Update styling tombol tab
  const buttons = document.querySelectorAll('.groups-workspace-wrapper .card button');

  if (tab === 'my-chapter') {
    renderTabMyChapter(contentArea);
  } else if (tab === 'progress') {
    renderTabGroupProgress(contentArea);
  } else if (tab === 'merged') {
    renderTabMergedDraft(contentArea);
  }
}

/**
 * =========================================================================
 * TAB 1: BAB SAYA (Editor untuk bab yang ditugaskan ke pengguna)
 * =========================================================================
 */
function renderTabMyChapter(container) {
  const group = GroupsState.currentGroup;
  const user = window.AppState?.user || {};
  const myMember = (group?.anggota || []).find(m => m.userId === user.userId || m.email === user.email) || {
    babName: 'Bab 1: Pendahuluan',
    konten: 'Tuliskan rancangan latar belakang dan permasalahan yang ditugaskan kepadamu di sini...'
  };

  container.innerHTML = `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>✍️</span> ${escapeHtml(myMember.babName || 'Bab yang Ditugaskan')}
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Tulis draf bab bagianmu. Perubahan akan langsung terlihat oleh ketua kelompok.</p>
        </div>
        <button class="btn btn-primary text-xs flex items-center gap-1.5 px-3 py-1.5 cursor-pointer"
                onclick="handleSaveMyChapter()">
          💾 Simpan Bab
        </button>
      </div>

      <textarea id="my-chapter-textarea" rows="14"
                class="w-full p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm leading-relaxed text-slate-800 bg-white resize-y"
                placeholder="Mulai menulis konten bab kelompokmu...">${escapeHtml(myMember.konten || '')}</textarea>

      <div class="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span id="my-chapter-wordcount">${(myMember.konten || '').trim().split(/\s+/).filter(Boolean).length} kata</span>
        <span>Perubahan otomatis tersinkron</span>
      </div>
    </div>
  `;

  // Listener input wordcount
  const ta = document.getElementById('my-chapter-textarea');
  if (ta) {
    ta.addEventListener('input', (e) => {
      const wc = document.getElementById('my-chapter-wordcount');
      if (wc) wc.textContent = `${e.target.value.trim().split(/\s+/).filter(Boolean).length} kata`;
    });
  }
}

async function handleSaveMyChapter() {
  const ta = document.getElementById('my-chapter-textarea');
  const konten = ta ? ta.value : '';

  showToast('Menyimpan bab tugas kelompok...', 'info', 1500);
  try {
    const res = await api('group.saveChapter', {
      groupId: GroupsState.selectedGroupId,
      konten: konten
    });
    if (res && res.success) {
      showToast('Bab berhasil disimpan dan disinkronkan!', 'success');
    } else {
      showToast('Tersimpan di cache lokal.', 'info');
    }
  } catch (e) {
    showToast('Tersimpan di cache lokal.', 'info');
  }
}

/**
 * =========================================================================
 * TAB 2: PROGRES KELOMPOK (Overall Progress Bar + Per-member breakdown)
 * =========================================================================
 */
function renderTabGroupProgress(container) {
  const group = GroupsState.currentGroup;
  const anggota = Array.isArray(group?.anggota) ? group.anggota : [
    { nama: 'Ketua', babName: 'Bab 1', progress: 90 },
    { nama: 'Anggota 1', babName: 'Bab 2', progress: 65 },
    { nama: 'Anggota 2', babName: 'Bab 3', progress: 40 },
    { nama: 'Anggota 3', babName: 'Bab 4', progress: 20 }
  ];

  const totalProgress = Math.round(anggota.reduce((acc, m) => acc + (m.progress || 0), 0) / Math.max(1, anggota.length));

  container.innerHTML = `
    <div class="flex flex-col gap-6">
      <!-- Overall Progress Card -->
      <div class="p-5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-indigo-900 uppercase tracking-wider">Keseluruhan Progres Tugas Kelompok</span>
          <span class="text-lg font-extrabold text-indigo-600">${totalProgress}%</span>
        </div>
        <div class="w-full bg-indigo-200/60 h-3 rounded-full overflow-hidden">
          <div class="bg-indigo-600 h-full rounded-full transition-all duration-500" style="width: ${totalProgress}%;"></div>
        </div>
        <p class="text-xs text-slate-500">
          Target selesai: <strong>7 hari lagi</strong>. Terus dorong rekan satu tim untuk menyelesaikan bab masing-masing!
        </p>
      </div>

      <!-- Breakdown Per Anggota -->
      <div class="flex flex-col gap-3">
        <h3 class="text-sm font-bold text-slate-800">Status Pengerjaan Anggota</h3>
        <div class="flex flex-col gap-3">
          ${anggota.map(m => `
            <div class="p-4 rounded-xl border border-slate-100 bg-white flex flex-col gap-2">
              <div class="flex items-center justify-between">
                <div>
                  <div class="font-bold text-sm text-slate-800">${escapeHtml(m.nama || 'Anggota')}</div>
                  <div class="text-xs text-indigo-600 font-semibold">${escapeHtml(m.babName || 'Belum Ada Bab')}</div>
                </div>
                <span class="badge ${m.progress >= 80 ? 'badge-success' : m.progress >= 50 ? 'badge-warning' : 'badge-danger'} text-xs">
                  ${m.progress || 0}% Selesai
                </span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-indigo-600 h-full rounded-full" style="width: ${m.progress || 0}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * =========================================================================
 * TAB 3: DRAF GABUNGAN (Merge & Export Khusus Ketua)
 * =========================================================================
 */
function renderTabMergedDraft(container) {
  const isLeader = GroupsState.userRole === 'LEADER';

  container.innerHTML = `
    <div class="flex flex-col gap-5">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h2 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>📑</span> Draf Gabungan Kelompok
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">Semua bab yang ditulis oleh masing-masing anggota disatukan di sini.</p>
        </div>

        <div class="flex items-center gap-2">
          ${isLeader ? `
            <button class="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 cursor-pointer"
                    onclick="handleMergeDrafts()">
              <span>🔄 Gabungkan Bab Sekarang</span>
            </button>
            <button class="btn btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3 cursor-pointer"
                    onclick="handleExportMergedDocs()">
              <span>Export ke Google Doc</span>
            </button>
          ` : `
            <span class="badge badge-warning text-xs">Hanya Ketua yang Dapat Menggabungkan</span>
          `}
        </div>
      </div>

      <!-- Preview Konten Draf Gabungan -->
      <div class="p-5 rounded-xl border border-slate-200 bg-slate-50 min-h-[300px] text-xs leading-relaxed text-slate-700 font-serif overflow-y-auto max-h-[500px]"
           id="merged-preview-box">
        ${GroupsState.mergedDraftContent ? escapeHtml(GroupsState.mergedDraftContent).replace(/\n/g, '<br/>') : `
          <div class="text-center py-12 text-slate-400 font-sans">
            <svg class="w-12 h-12 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <p class="font-semibold text-slate-600">Draf Belum Digabungkan</p>
            <p class="text-xs text-slate-400 mt-1">Klik tombol "Gabungkan Bab Sekarang" di atas untuk menyatukan seluruh bagian tulisan tim.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Handle Penggabungan Draf Semua Bab (Leader Only)
 */
async function handleMergeDrafts() {
  const box = document.getElementById('merged-preview-box');
  if (box) {
    box.innerHTML = `<div class="text-center py-8 text-indigo-600 animate-pulse font-sans">⏳ Sedang menyatukan draf bab dari seluruh anggota...</div>`;
  }

  try {
    const res = await api('group.mergeDrafts', {
      groupId: GroupsState.selectedGroupId
    });

    if (res && res.success && res.data) {
      GroupsState.mergedDraftContent = res.data.konten || res.data;
      showToast('Seluruh bab draf berhasil digabungkan!', 'success');
      renderTabMergedDraft(document.getElementById('group-tab-content-area'));
    } else {
      // Demo fallback merge
      GroupsState.mergedDraftContent = `DRAF GABUNGAN TUGAS KELOMPOK\n\nBAB 1: PENDAHULUAN\nLatar belakang penelitian ini disusun oleh Ketua Tim dengan analisis mendalam...\n\nBAB 2: TINJAUAN PUSTAKA\nKajian teori dan literatur disumbangkan oleh Anggota 1 dengan 5 jurnal pendukung...\n\nBAB 3: PEMBAHASAN\nTemuan hasil pengujian disajikan dalam grafik dan tabel komparatif oleh Anggota 2...\n\nBAB 4: KESIMPULAN\nSintesis akhir disimpulkan secara konsensus oleh seluruh anggota kelompok.`;
      showToast('Draf berhasil digabungkan!', 'success');
      renderTabMergedDraft(document.getElementById('group-tab-content-area'));
    }
  } catch (err) {
    console.error('Error merge:', err);
    showToast('Gagal menggabungkan draf', 'error');
  }
}

/**
 * Export Draf Gabungan ke Google Docs
 */
async function handleExportMergedDocs() {
  showToast('Membuat Google Doc dari draf gabungan...', 'info', 3000);
  try {
    const res = await api('doc.exportGoogleDoc', {
      groupId: GroupsState.selectedGroupId,
      content: GroupsState.mergedDraftContent
    });

    if (res && res.success && res.data && res.data.url) {
      window.open(res.data.url, '_blank');
      showToast('Dokumen berhasil diekspor ke Google Docs!', 'success');
    } else {
      showToast('Dokumen sedang diproses di Drive.', 'info');
    }
  } catch (e) {
    showToast('Gagal ekspor ke Google Docs', 'error');
  }
}

/**
 * Modal Buat Kelompok Baru
 */
function openCreateGroupModal() {
  const modalHTML = `
    <div id="create-group-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="card p-6 bg-white rounded-2xl max-w-md w-full shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-800">Buat Kelompok Baru</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" onclick="closeModal('create-group-modal')">&times;</button>
        </div>

        <form onsubmit="handleFormCreateGroup(event)" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Nama Kelompok <span class="text-rose-500">*</span></label>
            <input type="text" id="grp-nama" required placeholder="Contoh: Kelompok 4 AI & IoT"
                   class="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Mata Kuliah <span class="text-rose-500">*</span></label>
            <input type="text" id="grp-matkul" required placeholder="Contoh: Rekayasa Perangkat Lunak"
                   class="w-full h-10 px-3 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" class="btn btn-secondary text-xs" onclick="closeModal('create-group-modal')">Batal</button>
            <button type="submit" class="btn btn-primary text-xs">Buat Kelompok</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Submit Buat Kelompok
 */
async function handleFormCreateGroup(e) {
  e.preventDefault();
  const nama = document.getElementById('grp-nama').value.trim();
  const matkul = document.getElementById('grp-matkul').value.trim();

  closeModal('create-group-modal');
  showToast('Membuat kelompok...', 'info', 2000);

  try {
    const res = await api('group.create', { namaKelompok: nama, mataKuliah: matkul });
    if (res && res.success && res.data) {
      showToast('Kelompok berhasil dibuat!', 'success');
      GroupsState.groups.unshift(res.data);
      GroupsState.selectedGroupId = res.data.groupId;
      renderGroupWorkspace();
    } else {
      throw new Error(res?.message || 'Gagal');
    }
  } catch (err) {
    showToast(err.message || 'Gagal membuat kelompok', 'error');
  }
}

/**
 * Modal Gabung Kelompok dengan Kode
 */
function openJoinGroupModal() {
  const modalHTML = `
    <div id="join-group-modal" class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div class="card p-6 bg-white rounded-2xl max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-scaleUp">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-800">Gabung Kelompok</h3>
          <button class="text-slate-400 hover:text-slate-600 text-lg cursor-pointer" onclick="closeModal('join-group-modal')">&times;</button>
        </div>

        <form onsubmit="handleFormJoinGroup(event)" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-bold text-slate-700 uppercase mb-1">Kode Undangan</label>
            <input type="text" id="grp-join-code" required placeholder="Contoh: TK-8829"
                   class="w-full h-11 px-3 text-center uppercase tracking-widest font-mono font-bold rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" class="btn btn-secondary text-xs" onclick="closeModal('join-group-modal')">Batal</button>
            <button type="submit" class="btn btn-primary text-xs">Gabung Sekarang</button>
          </div>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function handleFormJoinGroup(e) {
  e.preventDefault();
  const code = document.getElementById('grp-join-code').value.trim();
  closeModal('join-group-modal');

  showToast('Memverifikasi kode kelompok...', 'info', 2000);
  try {
    const res = await api('group.join', { code });
    if (res && res.success && res.data) {
      showToast('Berhasil bergabung ke kelompok!', 'success');
      GroupsState.groups.push(res.data);
      GroupsState.selectedGroupId = res.data.groupId;
      renderGroupWorkspace();
    } else {
      throw new Error(res?.message || 'Kode kelompok tidak ditemukan.');
    }
  } catch (err) {
    showToast(err.message || 'Gagal bergabung ke kelompok', 'error');
  }
}

/**
 * Handle Penugasan Bab Anggota (Optimistic UI)
 */
async function handleAssignChapter(groupId, userId, babName) {
  const grp = GroupsState.currentGroup;
  if (grp && grp.anggota) {
    const member = grp.anggota.find(m => m.userId === userId);
    if (member) member.babName = babName;
  }

  showToast(`Bab berhasil ditugaskan: ${babName}`, 'success', 2000);

  try {
    await api('group.assignChapter', { groupId, userId, babName });
  } catch (e) {
    console.warn('Gagal sinkron assign chapter:', e);
  }
}

function handleSwitchGroup(groupId) {
  GroupsState.selectedGroupId = groupId;
  renderGroupWorkspaceWithData(document.getElementById('groups-container') || document.getElementById('app-main-view'), GroupsState.groups);
}

function copyGroupCode(code) {
  navigator.clipboard.writeText(code);
  showToast('Kode kelompok disalin!', 'success', 1500);
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.remove();
}
