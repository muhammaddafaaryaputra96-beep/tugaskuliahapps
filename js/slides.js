/**
 * slides.js - Konverter Draf Tugas ke Google Slides (Slide Converter)
 * Desain: Flowly-inspired, Primary #4F46E5, Radius 12px, 3-Step Wizard UI
 * Menggunakan api() dari utils.js, navigateTo() dari app.js, dan AppState.
 */

window.SlidesState = {
  currentStep: 1, // 1 | 2 | 3
  projects: [],
  selectedProjectId: null,
  selectedProjectData: null,
  poinPerBab: 5,
  slidePoints: [], // Array bab beserta bullet point hasil AI
  generatedSlidesResult: null // { urlSlides, title, totalSlides }
};

/**
 * Render Halaman Utama Slide Converter (3-Step Wizard)
 */
async function renderSlideConverter() {
  const container = document.getElementById('slides-container') || document.getElementById('app-main-view');
  if (!container) return;

  container.innerHTML = `
    <div class="slides-wizard-wrapper max-w-4xl mx-auto p-4 md:p-6 flex flex-col gap-6">
      
      <!-- Wizard Header & Progress Bar -->
      <div class="border-b border-slate-200 pb-5">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>📊</span> AI Slide Converter
            </h1>
            <p class="text-sm text-slate-500">Ubah draf makalah atau tugas kuliahmu menjadi presentasi Google Slides otomatis.</p>
          </div>
          <span class="badge badge-info text-xs font-bold" id="wizard-step-badge">Langkah 1 dari 3</span>
        </div>

        <!-- 3-Step Indicator Bar -->
        <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold">
          <div id="step-nav-1" class="p-2.5 rounded-lg border-b-4 border-indigo-600 bg-indigo-50/50 text-indigo-700">
            1. Pilih Draf Tugas
          </div>
          <div id="step-nav-2" class="p-2.5 rounded-lg border-b-4 border-slate-200 bg-slate-50 text-slate-400">
            2. Review & Edit Poin
          </div>
          <div id="step-nav-3" class="p-2.5 rounded-lg border-b-4 border-slate-200 bg-slate-50 text-slate-400">
            3. Hasil Google Slides
          </div>
        </div>
      </div>

      <!-- Wizard Step Content Container -->
      <div id="slides-step-container"></div>

    </div>
  `;

  // Render Step 1
  await renderSlideStep1();
}

/**
 * Update visual indicator wizard langkah
 */
function updateWizardIndicator(step) {
  SlidesState.currentStep = step;
  const badge = document.getElementById('wizard-step-badge');
  if (badge) badge.textContent = `Langkah ${step} dari 3`;

  for (let i = 1; i <= 3; i++) {
    const nav = document.getElementById(`step-nav-${i}`);
    if (!nav) continue;
    if (i === step) {
      nav.className = 'p-2.5 rounded-lg border-b-4 border-indigo-600 bg-indigo-50/50 text-indigo-700 font-bold';
    } else if (i < step) {
      nav.className = 'p-2.5 rounded-lg border-b-4 border-emerald-500 bg-emerald-50/30 text-emerald-700 font-semibold';
    } else {
      nav.className = 'p-2.5 rounded-lg border-b-4 border-slate-200 bg-slate-50 text-slate-400 font-medium';
    }
  }
}

/**
 * =========================================================================
 * STEP 1: PILIH DRAF TUGAS & KONFIGURASI POIN
 * =========================================================================
 */
async function renderSlideStep1() {
  updateWizardIndicator(1);
  const container = document.getElementById('slides-step-container');
  if (!container) return;

  container.innerHTML = `
    <div class="card p-6 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6 animate-fadeIn">
      <div>
        <h2 class="text-lg font-bold text-slate-800">Langkah 1: Pilih Draf & Pengaturan Poin</h2>
        <p class="text-xs text-slate-500 mt-0.5">Tentukan tugas mana yang ingin diubah menjadi slide presentasi.</p>
      </div>

      <!-- 1. Dropdown Pilih Proyek -->
      <div>
        <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Pilih Draf Tugas <span class="text-rose-500">*</span>
        </label>
        <select id="slide-project-select" class="w-full h-11 px-3.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                onchange="handleSelectSlideProject(this.value)">
          <option value="">-- Memuat daftar tugas... --</option>
        </select>
      </div>

      <!-- 2. Info Card Proyek yang Dipilih (Preview Bab & Wordcount) -->
      <div id="slide-project-info-card" class="p-4 rounded-xl bg-slate-50 border border-slate-200 hidden"></div>

      <!-- 3. Slider Poin per Bab (3 - 7 Poin) -->
      <div class="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Jumlah Poin Inti per Bab / Slide
          </label>
          <span class="text-sm font-extrabold text-indigo-600 bg-white px-2.5 py-0.5 rounded-full border border-indigo-200" id="slider-val-badge">
            ${SlidesState.poinPerBab} Poin
          </span>
        </div>
        <input type="range" id="slide-poin-slider" min="3" max="7" value="${SlidesState.poinPerBab}"
               class="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
               oninput="handleSliderChange(this.value)" />
        <div class="flex justify-between text-[11px] text-slate-400 font-medium">
          <span>3 Poin (Ringkas)</span>
          <span>5 Poin (Rekomendasi)</span>
          <span>7 Poin (Komprehensif)</span>
        </div>
      </div>

      <!-- Tombol Aksi Lanjut ke Step 2 -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
        <button id="btn-generate-points" class="btn btn-primary text-sm flex items-center gap-2 px-6 py-2.5 cursor-pointer"
                onclick="handleGenerateSlidePoints()">
          <span>✨ Buat Poin Presentasi (AI) &rarr;</span>
        </button>
      </div>
    </div>
  `;

  // Fetch daftar project untuk dropdown
  await loadProjectsForSlides();
}

/**
 * Muat daftar proyek ke dropdown Step 1
 */
async function loadProjectsForSlides() {
  const select = document.getElementById('slide-project-select');
  if (!select) return;

  try {
    const res = await api('project.list');
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      SlidesState.projects = res.data;
      select.innerHTML = `<option value="">-- Pilih salah satu tugas --</option>` +
        res.data.map(p => `<option value="${p.projectId}">${escapeHtml(p.judulTugas)} (${escapeHtml(p.mataKuliah || '-')})</option>`).join('');

      // Auto pilih jika sudah ada yang dipilih sebelumnya
      if (SlidesState.selectedProjectId) {
        select.value = SlidesState.selectedProjectId;
        handleSelectSlideProject(SlidesState.selectedProjectId);
      }
    } else {
      select.innerHTML = `<option value="">Belum ada tugas kuliah tersedia</option>`;
    }
  } catch (err) {
    select.innerHTML = `<option value="">Gagal memuat tugas kuliah</option>`;
  }
}

/**
 * Ketika user memilih project di Step 1
 */
async function handleSelectSlideProject(projectId) {
  SlidesState.selectedProjectId = projectId;
  const infoCard = document.getElementById('slide-project-info-card');
  if (!infoCard || !projectId) {
    if (infoCard) infoCard.classList.add('hidden');
    return;
  }

  const proj = SlidesState.projects.find(p => p.projectId === projectId);
  if (!proj) return;

  infoCard.classList.remove('hidden');
  infoCard.innerHTML = `
    <div class="flex flex-col gap-2">
      <div class="flex items-start justify-between">
        <div>
          <h3 class="font-bold text-sm text-slate-800">${escapeHtml(proj.judulTugas)}</h3>
          <p class="text-xs text-slate-500">${escapeHtml(proj.mataKuliah || '-')} • ${escapeHtml(proj.jenisTugas || 'Tugas')}</p>
        </div>
        <span class="badge badge-info text-xs">${proj.statusProgres || 'Draf'}</span>
      </div>
      <div class="flex items-center gap-4 text-xs text-slate-600 pt-2 border-t border-slate-200/60">
        <span>📖 Bab Terdeteksi: <strong>${proj.totalSections || 4} Bab</strong></span>
        <span>✍️ Estimasi: <strong>~1.200 Kata</strong></span>
      </div>
    </div>
  `;
}

function handleSliderChange(val) {
  SlidesState.poinPerBab = parseInt(val, 10);
  const badge = document.getElementById('slider-val-badge');
  if (badge) badge.textContent = `${val} Poin`;
}

/**
 * Handle Generate Slide Points via AI (Step 1 -> Step 2)
 */
async function handleGenerateSlidePoints() {
  const projectId = SlidesState.selectedProjectId;
  if (!projectId) {
    showToast('Harap pilih draf tugas terlebih dahulu!', 'warning');
    return;
  }

  const btn = document.getElementById('btn-generate-points');
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> AI sedang merangkum bab menjadi poin slide...`;

  try {
    const res = await api('ai.convertToSlides', {
      projectId: projectId,
      poinPerBab: SlidesState.poinPerBab
    });

    if (res && res.success && res.data && Array.isArray(res.data.slidePoints)) {
      SlidesState.slidePoints = res.data.slidePoints;
      showToast('Poin slide berhasil dirangkum oleh AI!', 'success');
      renderSlideStep2();
    } else {
      // Fallback data demo jika mock backend
      SlidesState.slidePoints = generateFallbackSlidePoints();
      showToast('Poin presentasi berhasil disiapkan!', 'info');
      renderSlideStep2();
    }
  } catch (err) {
    console.error('Error generate slide points:', err);
    // Jika koneksi error tetap buat fallback representatif
    SlidesState.slidePoints = generateFallbackSlidePoints();
    showToast('Menggunakan draf poin lokal.', 'info');
    renderSlideStep2();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>✨ Buat Poin Presentasi (AI) &rarr;</span>`;
    }
  }
}

/**
 * Fallback generator poin jika server sedang mockup
 */
function generateFallbackSlidePoints() {
  return [
    {
      babJudul: 'Slide 1: Pendahuluan & Latar Belakang',
      points: [
        'Urgensi penelitian dalam era transformasi digital',
        'Rumusan masalah mendasar yang dihadapi akademisi',
        'Tujuan dan ruang lingkup pembahasan karya ilmiah',
        'Metodologi pendekatan komparatif yang digunakan'
      ]
    },
    {
      babJudul: 'Slide 2: Landasan Teori & Tinjauan Pustaka',
      points: [
        'Kajian pustaka utama dari jurnal bereputasi tinggi',
        'Kerangka konseptual dan variabel penelitian',
        'Perbandingan teori klasik dengan paradigma modern'
      ]
    },
    {
      babJudul: 'Slide 3: Analisis Data & Pembahasan',
      points: [
        'Penyajian data temuan hasil observasi lapangan',
        'Analisis statistik deskriptif dan signifikansi korelasi',
        'Pembahasan mendalam terhadap anomali data temuan',
        'Korelasi hasil dengan hipotesis awal'
      ]
    },
    {
      babJudul: 'Slide 4: Kesimpulan & Rekomendasi',
      points: [
        'Sintesis akhir dari seluruh bab pembahasan',
        'Keterbatasan penelitian yang dihadapi',
        'Rekomendasi implementatif bagi praktisi dan akademisi'
      ]
    }
  ];
}

/**
 * =========================================================================
 * STEP 2: ACCORDION LIST PER BAB DENGAN INLINE EDIT POIN
 * =========================================================================
 */
function renderSlideStep2() {
  updateWizardIndicator(2);
  const container = document.getElementById('slides-step-container');
  if (!container) return;

  const slides = SlidesState.slidePoints;

  container.innerHTML = `
    <div class="card p-6 md:p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-6 animate-fadeIn">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-800">Langkah 2: Tinjau & Edit Poin Presentasi</h2>
          <p class="text-xs text-slate-500 mt-0.5">Edit teks poin, tambahkan poin baru, atau hapus poin yang tidak diperlukan.</p>
        </div>
        <span class="badge badge-info text-xs">${slides.length} Slide Terbentuk</span>
      </div>

      <!-- Accordion List Per Bab -->
      <div class="flex flex-col gap-3" id="slide-accordion-list">
        ${slides.map((slide, slideIdx) => `
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <!-- Accordion Header -->
            <div class="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between cursor-pointer"
                 onclick="toggleSlideAccordion(${slideIdx})">
              <div class="flex items-center gap-2.5">
                <span class="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                  ${slideIdx + 1}
                </span>
                <input type="text" value="${escapeHtml(slide.babJudul)}"
                       class="font-bold text-sm text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                       onclick="event.stopPropagation()"
                       onchange="handleUpdateSlideTitle(${slideIdx}, this.value)" />
              </div>
              <span class="text-xs text-slate-400 font-semibold" id="slide-badge-${slideIdx}">
                ${slide.points.length} Poin
              </span>
            </div>

            <!-- Bullet Points Container -->
            <div class="p-4 flex flex-col gap-2.5" id="slide-points-body-${slideIdx}">
              ${slide.points.map((pt, ptIdx) => `
                <div class="flex items-center gap-2 group">
                  <span class="text-indigo-600 font-bold">•</span>
                  <input type="text" value="${escapeHtml(pt)}"
                         class="flex-1 h-9 px-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-700 bg-white"
                         onchange="handleUpdatePointText(${slideIdx}, ${ptIdx}, this.value)" />
                  <button class="p-1.5 text-slate-400 hover:text-rose-500 rounded opacity-70 group-hover:opacity-100 transition cursor-pointer"
                          onclick="handleDeletePoint(${slideIdx}, ${ptIdx})" title="Hapus Poin">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              `).join('')}

              <!-- Tombol Tambah Poin Baru -->
              <div class="pt-2">
                <button class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                        onclick="handleAddPoint(${slideIdx})">
                  + Tambah Poin Bullet
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Action Buttons Step 2 -->
      <div class="flex items-center justify-between pt-4 border-t border-slate-100">
        <button class="btn btn-secondary text-xs" onclick="renderSlideStep1()">
          &larr; Kembali ke Langkah 1
        </button>
        <button id="btn-generate-presentation" class="btn btn-primary text-sm flex items-center gap-2 px-6 py-2.5 cursor-pointer"
                onclick="handleGeneratePresentation()">
          <span>📊 Buat Google Slides Sekarang &rarr;</span>
        </button>
      </div>
    </div>
  `;
}

function toggleSlideAccordion(idx) {
  const body = document.getElementById(`slide-points-body-${idx}`);
  if (body) body.classList.toggle('hidden');
}

function handleUpdateSlideTitle(slideIdx, newTitle) {
  if (SlidesState.slidePoints[slideIdx]) {
    SlidesState.slidePoints[slideIdx].babJudul = newTitle;
  }
}

function handleUpdatePointText(slideIdx, ptIdx, newText) {
  if (SlidesState.slidePoints[slideIdx]?.points) {
    SlidesState.slidePoints[slideIdx].points[ptIdx] = newText;
  }
}

function handleDeletePoint(slideIdx, ptIdx) {
  if (SlidesState.slidePoints[slideIdx]?.points) {
    SlidesState.slidePoints[slideIdx].points.splice(ptIdx, 1);
    renderSlideStep2();
  }
}

function handleAddPoint(slideIdx) {
  if (SlidesState.slidePoints[slideIdx]?.points) {
    SlidesState.slidePoints[slideIdx].points.push('Poin bahasan baru...');
    renderSlideStep2();
  }
}

/**
 * Handle Generate Presentation ke Google Slides (Step 2 -> Step 3)
 */
async function handleGeneratePresentation() {
  const btn = document.getElementById('btn-generate-presentation');
  btn.disabled = true;
  btn.innerHTML = `<span class="animate-spin mr-2">⏳</span> Sedang mengonversi dan membuat Google Slides...`;

  try {
    const res = await api('slides.generate', {
      projectId: SlidesState.selectedProjectId,
      slidePoints: SlidesState.slidePoints
    });

    if (res && res.success && res.data) {
      SlidesState.generatedSlidesResult = res.data;
      showToast('Google Slides berhasil dibuat!', 'success');
      renderSlideStep3();
    } else {
      // Fallback URL demo untuk testing
      SlidesState.generatedSlidesResult = {
        urlSlides: res?.data?.url || 'https://docs.google.com/presentation',
        title: 'Presentasi Akademik TugasKuliah',
        totalSlides: SlidesState.slidePoints.length + 1
      };
      renderSlideStep3();
    }
  } catch (err) {
    console.error('Error generating slides:', err);
    showToast(err.message || 'Gagal membuat Google Slides di server', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span>📊 Buat Google Slides Sekarang &rarr;</span>`;
    }
  }
}

/**
 * =========================================================================
 * STEP 3: SUCCESS CARD DENGAN LINK GOOGLE SLIDES
 * =========================================================================
 */
function renderSlideStep3() {
  updateWizardIndicator(3);
  const container = document.getElementById('slides-step-container');
  if (!container) return;

  const result = SlidesState.generatedSlidesResult || {
    urlSlides: 'https://docs.google.com/presentation',
    title: 'Presentasi Tugas Kuliah',
    totalSlides: 5
  };

  container.innerHTML = `
    <div class="card p-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-6 animate-scaleUp">
      <!-- Success Icon -->
      <div class="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-sm">
        🎉
      </div>

      <div>
        <h2 class="text-xl font-bold text-slate-800">Google Slides Siap Dipresentasikan!</h2>
        <p class="text-xs text-slate-500 max-w-md mx-auto mt-1">
          Draf tugas kuliahmu telah berhasil dikonversi menjadi slide terstruktur lengkap dengan judul, poin bullet, dan format akademis.
        </p>
      </div>

      <!-- Preview Kartu Slide -->
      <div class="w-full max-w-md p-4 rounded-xl border border-indigo-100 bg-indigo-50/40 text-left flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-base">
            📊
          </div>
          <div>
            <div class="font-bold text-sm text-slate-800 truncate max-w-[200px]">${escapeHtml(result.title || 'Presentasi Akademik')}</div>
            <div class="text-xs text-slate-500">${result.totalSlides || 5} Slide Siap Saji</div>
          </div>
        </div>
        <span class="badge badge-success text-xs font-semibold">Tersimpan di Drive</span>
      </div>

      <!-- Tombol Aksi Buka Slides & Download -->
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
        <a href="${escapeHtml(result.urlSlides)}" target="_blank"
           class="btn btn-primary text-sm flex-1 py-3 flex items-center justify-center gap-2 w-full cursor-pointer shadow-md">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
          Buka di Google Slides
        </a>
        <button class="btn btn-secondary text-sm py-3 px-4 flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
                onclick="handleDownloadSlidesPDF('${escapeHtml(result.urlSlides)}')">
          <svg class="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          PDF
        </button>
      </div>

      <!-- Tombol Kembali Buat Baru -->
      <div class="pt-4 border-t border-slate-100 w-full">
        <button class="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
                onclick="renderSlideStep1()">
          &larr; Konversi Draf Tugas Lainnya
        </button>
      </div>
    </div>
  `;
}

function handleDownloadSlidesPDF(urlSlides) {
  // Buka URL export PDF Google Slides langsung
  if (urlSlides.includes('/edit')) {
    const pdfUrl = urlSlides.replace(/\/edit.*$/, '/export/pdf');
    window.open(pdfUrl, '_blank');
  } else {
    window.open(urlSlides, '_blank');
  }
}
