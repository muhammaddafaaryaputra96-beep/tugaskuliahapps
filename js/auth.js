/**
 * auth.js — Modul Autentikasi Pengguna TugasKuliah Apps
 * Mendukung: Email/Password Login, Google Sign-In, Registrasi Akun Mahasiswa,
 * Sesi Stateless HMAC, dan Mode Demo 1-Klik.
 * Desain: Sesuai Desain UI/UX Google Stitch (login_mahasiswa_dosen & registrasi_akun_baru)
 * Versi: 1.0.0
 */

// ============================================================
// 1. RENDER LOGIN PAGE
// ============================================================

function renderLoginPage() {
  const main = document.getElementById('app-main-view') || document.getElementById('app');
  if (!main) return;

  main.innerHTML = `
    <div class="min-h-screen flex flex-col justify-between relative selection:bg-purple-100 selection:text-indigo-700 bg-[#F5F4FF]">
      
      <!-- Ambient Decorative Canvas Backdrops -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-indigo-600 via-indigo-900 to-purple-800">
        <!-- Geometric Dotted Pattern Scrim -->
        <div class="absolute inset-0 opacity-15" style="background-image: radial-gradient(rgba(255, 255, 255, 0.45) 1.5px, transparent 1.5px); background-size: 28px 28px;"></div>
        <!-- Soft Diffused Atmospheric Halos -->
        <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl"></div>
        <div class="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-indigo-300/15 blur-3xl"></div>
        <div class="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-400/10 blur-[100px]"></div>
      </div>

      <!-- Top Header Navigation -->
      <header class="w-full py-5 px-6 md:px-12 flex items-center justify-between z-10">
        <div class="inline-flex items-center gap-2 text-white/80">
          <div class="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-sm">
            <span class="material-symbols-outlined text-[22px]">school</span>
          </div>
          <span class="font-bold text-lg text-white tracking-tight">TugasKuliah Apps</span>
        </div>
        <a href="#register" onclick="navigateTo('register'); return false;" class="text-sm font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl transition border border-white/15">
          Daftar Akun Baru
        </a>
      </header>

      <!-- Main Center Content -->
      <div class="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        
        <!-- Outer Badge: Gemini 1.5 Pro AI & Workspace -->
        <div class="w-full max-w-[440px] flex justify-end mb-3">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1E1B4B]/80 backdrop-blur-md shadow-lg text-indigo-200 text-xs font-medium border border-indigo-500/20">
            <span class="material-symbols-outlined text-[16px] text-amber-400 animate-pulse">auto_awesome</span>
            <span>Terintegrasi <strong>Gemini 1.5 Pro</strong></span>
          </div>
        </div>

        <!-- Centered Floating Authentication Card -->
        <div class="relative w-full max-w-[440px] bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.30)] border border-slate-100">
          
          <!-- Top Branding & Icon Header -->
          <div class="flex flex-col items-center text-center">
            <div class="relative mb-3">
              <div class="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <span class="material-symbols-outlined text-[28px]">school</span>
              </div>
            </div>
            
            <div class="inline-flex items-center gap-2 justify-center mb-1">
              <h2 class="font-bold text-2xl text-slate-900 tracking-tight">TugasKuliah Apps</h2>
              <span class="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-mono font-semibold">v1.0</span>
            </div>
            <p class="text-sm text-slate-500 mb-4">
              Your Academic Assistant, Powered by AI
            </p>

            <!-- Role Badge Banner -->
            <div class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-purple-50 text-purple-700 mb-5 text-xs font-semibold border border-purple-100">
              <span class="material-symbols-outlined text-[16px]">verified_user</span>
              <span>Portal Mahasiswa &amp; Sivitas Akademika</span>
            </div>
          </div>

          <!-- Login Form -->
          <form class="space-y-4" onsubmit="handleFormLogin(event);">
            <!-- Field 1: Email Kampus -->
            <div class="space-y-1.5 text-left">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="login-email">
                Email Akun Kampus / Pribadi
              </label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">mail</span>
                <input id="login-email" type="email" required autocomplete="email" placeholder="nama@mahasiswa.univ.ac.id"
                  class="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition outline-none" />
              </div>
            </div>

            <!-- Field 2: Password with Eye Toggle -->
            <div class="space-y-1.5 text-left">
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="login-password">
                  Kata Sandi
                </label>
                <a href="javascript:void(0)" onclick="showToast('Silakan hubungi administrator kampus jika lupa kata sandi.', 'info');" class="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                  Lupa kata sandi?
                </a>
              </div>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">lock</span>
                <input id="login-password" type="password" required placeholder="••••••••"
                  class="w-full h-11 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition outline-none" />
                <button type="button" class="absolute right-3 p-1 text-slate-400 hover:text-slate-600" onclick="togglePasswordVisibility('login-password')">
                  <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
            </div>

            <!-- Submit Button -->
            <button id="btn-submit-login" type="submit"
              class="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 hover:shadow-lg hover:shadow-indigo-600/40 hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2">
              <span>Masuk ke Akun Saya</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <!-- Divider -->
          <div class="relative flex items-center justify-center my-5">
            <div class="w-full bg-slate-200 h-[1px]"></div>
            <span class="absolute px-3 bg-white text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              atau coba instan
            </span>
          </div>

          <!-- Quick Demo Buttons (Sangat praktis untuk pengujian langsung) -->
          <div class="grid grid-cols-2 gap-2">
            <button type="button" onclick="quickDemoLogin('mahasiswa@demo.ac.id', 'Mahasiswa')"
              class="py-2.5 px-3 rounded-xl border border-indigo-200 hover:bg-indigo-50/70 text-indigo-700 text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">person</span>
              <span>Demo Mahasiswa</span>
            </button>
            <button type="button" onclick="quickDemoLogin('admin@demo.ac.id', 'Admin')"
              class="py-2.5 px-3 rounded-xl border border-purple-200 hover:bg-purple-50/70 text-purple-700 text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>Demo Admin</span>
            </button>
          </div>

        </div>

        <!-- Footer Link -->
        <p class="text-white/80 text-xs mt-6 text-center">
          Belum punya akun?
          <a href="#register" onclick="navigateTo('register'); return false;" class="font-bold text-white underline ml-1 hover:text-indigo-200">
            Daftar sekarang gratis
          </a>
        </p>

      </div>

      <!-- Footer Info -->
      <footer class="w-full py-4 text-center text-xs text-white/50 z-10">
        &copy; 2026 TugasKuliah Apps. Hak cipta dilindungi undang-undang.
      </footer>

    </div>
  `;
}

// ============================================================
// 2. RENDER REGISTER PAGE
// ============================================================

function renderRegisterPage() {
  const main = document.getElementById('app-main-view') || document.getElementById('app');
  if (!main) return;

  main.innerHTML = `
    <div class="min-h-screen flex flex-col justify-between relative selection:bg-purple-100 selection:text-indigo-700 bg-[#F5F4FF]">
      
      <!-- Background Ambient -->
      <div class="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-gradient-to-br from-indigo-600 via-indigo-900 to-purple-800">
        <div class="absolute inset-0 opacity-15" style="background-image: radial-gradient(rgba(255, 255, 255, 0.45) 1.5px, transparent 1.5px); background-size: 28px 28px;"></div>
        <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-400/20 blur-3xl"></div>
        <div class="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-indigo-300/15 blur-3xl"></div>
      </div>

      <!-- Header -->
      <header class="w-full py-5 px-6 md:px-12 flex items-center justify-between z-10">
        <a href="#login" onclick="navigateTo('login'); return false;" class="inline-flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium">
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
          <span>Kembali ke Halaman Masuk</span>
        </a>
        <div class="inline-flex items-center gap-2 text-white font-bold">
          <span class="material-symbols-outlined text-[20px]">school</span>
          <span>TugasKuliah</span>
        </div>
      </header>

      <!-- Card Register -->
      <div class="w-full flex-1 flex flex-col items-center justify-center px-4 py-8 z-10">
        <div class="relative w-full max-w-[500px] bg-white rounded-[24px] p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(79,70,229,0.30)] border border-slate-100">
          
          <div class="text-center mb-6">
            <h2 class="font-bold text-2xl text-slate-900 tracking-tight">Daftar Akun Mahasiswa</h2>
            <p class="text-sm text-slate-500 mt-1">Mulai selesaikan skripsi, makalah, dan tugas kuliah dengan bantuan AI.</p>
          </div>

          <form class="space-y-4" onsubmit="handleFormRegister(event);">
            <!-- Nama Lengkap -->
            <div class="space-y-1 text-left">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-nama">Nama Lengkap</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">badge</span>
                <input id="reg-nama" type="text" required placeholder="Budi Pratama"
                  class="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition outline-none" />
              </div>
            </div>

            <!-- Email Kampus -->
            <div class="space-y-1 text-left">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-email">Email Kampus / Gmail</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">mail</span>
                <input id="reg-email" type="email" required placeholder="budi@mahasiswa.ac.id"
                  class="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition outline-none" />
              </div>
            </div>

            <!-- Grid Semester & Jurusan -->
            <div class="grid grid-cols-2 gap-3 text-left">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-semester">Semester</label>
                <select id="reg-semester" class="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 outline-none">
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                  <option value="4">Semester 4</option>
                  <option value="5">Semester 5</option>
                  <option value="6">Semester 6</option>
                  <option value="7">Semester 7</option>
                  <option value="8" selected>Semester 8 (Skripsi)</option>
                  <option value="9">Tingkat Akhir</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-jurusan">Program Studi</label>
                <input id="reg-jurusan" type="text" required placeholder="Teknik Informatika"
                  class="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 outline-none" />
              </div>
            </div>

            <!-- WhatsApp (Untuk Notifikasi Pengingat Tugas) -->
            <div class="space-y-1 text-left">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-phone">Nomor WhatsApp (Opsional)</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">phone</span>
                <input id="reg-phone" type="tel" placeholder="08123456789"
                  class="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 outline-none" />
              </div>
              <p class="text-[11px] text-slate-500">Digunakan untuk notifikasi pengingat tenggat waktu tugas via WhatsApp CRM.</p>
            </div>

            <!-- Password -->
            <div class="space-y-1 text-left">
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider" for="reg-password">Kata Sandi</label>
              <div class="relative flex items-center">
                <span class="material-symbols-outlined absolute left-3.5 text-slate-400 text-[20px] pointer-events-none">lock</span>
                <input id="reg-password" type="password" required placeholder="Minimal 6 karakter"
                  class="w-full h-11 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:border-indigo-600 outline-none" />
                <button type="button" class="absolute right-3 p-1 text-slate-400 hover:text-slate-600" onclick="togglePasswordVisibility('reg-password')">
                  <span class="material-symbols-outlined text-[20px]">visibility</span>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <button id="btn-submit-register" type="submit"
              class="w-full h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm shadow-md shadow-indigo-600/30 hover:shadow-lg hover:brightness-105 active:scale-[0.99] transition flex items-center justify-center gap-2">
              <span>Buat Akun Sekarang</span>
              <span class="material-symbols-outlined text-[18px]">how_to_reg</span>
            </button>
          </form>

        </div>
      </div>

      <!-- Footer -->
      <footer class="w-full py-4 text-center text-xs text-white/50 z-10">
        &copy; 2026 TugasKuliah Apps.
      </footer>

    </div>
  `;
}

// ============================================================
// 3. HANDLERS
// ============================================================

async function handleFormLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const btn = document.getElementById('btn-submit-login');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    showToast('Harap masukkan email dan kata sandi.', 'warning');
    return;
  }

  const originalBtnHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Memverifikasi...</span>`;

  try {
    const res = await api('auth.login', { email, password });
    if (res && res.success && res.data && res.data.token) {
      setToken(res.data.token);
      setCurrentUser(res.data);
      showToast(`Selamat datang kembali, ${res.data.nama || 'Mahasiswa'}!`, 'success');
      
      // Update UI dan navigasi ke dashboard
      if (typeof initAppLayout === 'function') initAppLayout();
      if (typeof navigateTo === 'function') navigateTo('dashboard');
    } else {
      showToast(res?.message || 'Login gagal. Periksa kembali email dan kata sandi.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan koneksi saat login.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalBtnHTML;
  }
}

async function handleFormRegister(e) {
  e.preventDefault();
  const nama = document.getElementById('reg-nama')?.value.trim();
  const email = document.getElementById('reg-email')?.value.trim();
  const semester = document.getElementById('reg-semester')?.value;
  const jurusan = document.getElementById('reg-jurusan')?.value.trim();
  const phone = document.getElementById('reg-phone')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const btn = document.getElementById('btn-submit-register');

  if (!nama || !email || !password) {
    showToast('Harap lengkapi semua kolom wajib.', 'warning');
    return;
  }

  const originalHTML = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span><span>Mendaftarkan...</span>`;

  try {
    const res = await api('auth.register', {
      nama,
      email,
      semester,
      jurusan,
      noHP: phone,
      password
    });

    if (res && res.success && res.data) {
      if (res.data.token) {
        setToken(res.data.token);
        setCurrentUser(res.data);
      }
      showToast('Pendaftaran akun berhasil!', 'success');
      if (typeof initAppLayout === 'function') initAppLayout();
      if (typeof navigateTo === 'function') navigateTo('dashboard');
    } else {
      showToast(res?.message || 'Gagal mendaftar. Silakan coba lagi.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kendala saat mendaftar.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

function quickDemoLogin(email, role) {
  const fakeToken = `demo.${btoa(JSON.stringify({ email: email, peran: role, exp: Math.floor(Date.now() / 1000) + 86400 }))}.signature`;
  const demoUser = {
    userId: role === 'Admin' ? 'USR-ADMIN' : 'USR-DEMO-MHS',
    email: email,
    nama: role === 'Admin' ? 'Administrator Sistem' : 'Mahasiswa Pengguna',
    peran: role,
    planType: role === 'Admin' ? 'PREMIUM' : 'PRO',
    semester: '8',
    jurusan: 'Informatika',
    token: fakeToken
  };

  setToken(fakeToken);
  setCurrentUser(demoUser);
  showToast(`Masuk sebagai ${role} (Mode Cepat)`, 'success');
  if (typeof initAppLayout === 'function') initAppLayout();
  if (typeof navigateTo === 'function') navigateTo('dashboard');
}

function handleLogout() {
  api('auth.logout').catch(() => {});
  clearToken();
  showToast('Anda telah keluar dari akun.', 'info');
  if (typeof navigateTo === 'function') navigateTo('login');
}

function togglePasswordVisibility(inputId) {
  const inp = document.getElementById(inputId);
  if (inp) {
    inp.type = inp.type === 'password' ? 'text' : 'password';
  }
}
