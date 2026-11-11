/**
 * utils.js — Utilitas Inti Frontend TugasKuliah Apps
 * Arsitektur: GAS Pro API & GAS Instant UX
 * Menyediakan: Client REST API (CORS-safe fetch), Auth Storage, Toast, Modal, Formatting, Cache
 * Versi: 1.0.0
 */

// ============================================================
// 0. SAFE CONFIG FALLBACK (Mencegah ReferenceError jika config.js typo)
// ============================================================
if (typeof window.CONFIG === 'undefined') {
  window.CONFIG = {
    GAS_URL: (typeof GAS_URL !== 'undefined') ? GAS_URL : '',
    APP_NAME: 'TugasKuliah Apps',
    APP_VERSION: '1.0.0',
    STORAGE_KEYS: {
      TOKEN: 'tk_session_token',
      USER: 'tk_user_profile',
      THEME: 'tk_theme',
      DASHBOARD_CACHE: 'tk_dashboard_cache'
    }
  };
}

// ============================================================
// 1. SESSION & AUTH STORAGE
// ============================================================

function getToken() {
  try {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) || '';
  } catch (e) {
    return '';
  }
}

function setToken(token) {
  try {
    if (token) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
    } else {
      clearToken();
    }
  } catch (e) {
    console.warn('Gagal menyimpan token di localStorage:', e);
  }
}

function clearToken() {
  try {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    if (window.AppState) {
      window.AppState.user = null;
    }
  } catch (e) {}
}

function getCurrentUser() {
  if (window.AppState && window.AppState.user) {
    return window.AppState.user;
  }
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (raw) {
      const user = JSON.parse(raw);
      if (window.AppState) window.AppState.user = user;
      return user;
    }
  } catch (e) {}
  return null;
}

function setCurrentUser(user) {
  if (!window.AppState) window.AppState = {};
  window.AppState.user = user;
  try {
    if (user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }
  } catch (e) {}
}

// ============================================================
// 2. CLIENT REST API (GAS PRO API - CORS SAFE)
// ============================================================

// Peta request in-flight untuk deduplikasi panggilan serentak
const _inflightRequests = new Map();

/**
 * api — Memanggil endpoint backend Google Apps Script.
 * PENTING: Wajib menggunakan Content-Type: text/plain;charset=utf-8
 * agar browser tidak memicu CORS preflight (OPTIONS) yang ditolak oleh GAS!
 * 
 * @param {string} action - Nama aksi (misal 'dashboard.boot', 'project.list')
 * @param {Object} [payload={}] - Parameter/body data
 * @param {string} [method='POST'] - HTTP Method ('POST' atau 'GET')
 * @returns {Promise<Object>} Response JSON { success, data, message, ms, v }
 */
async function api(action, payload = {}, method = 'POST') {
  const gasUrl = (CONFIG.GAS_URL || '').trim();
  if (!gasUrl ||
      gasUrl.includes('GANTI_DENGAN') ||
      gasUrl.includes('MASUKKAN_URL') ||
      !gasUrl.startsWith('https://script.google.com/macros/s/') ||
      !gasUrl.endsWith('/exec')) {
    console.error('[CONFIG ERROR] GAS_URL tidak valid:', gasUrl);
    showToast('URL GAS_URL di js/config.js salah/belum diisi! Wajib format https://script.google.com/macros/s/.../exec', 'warning', 7000);
    return {
      success: false,
      message: `URL Web App GAS_URL tidak valid ("${gasUrl || 'kosong'}"). Wajib dimulai dengan https://script.google.com/macros/s/ dan diakhiri /exec.`
    };
  }

  const token = getToken();
  const requestBody = {
    action: action,
    token: token,
    ...payload
  };

  // Kunci deduplikasi in-flight untuk request idempotent
  const inflightKey = `${method}:${action}:${JSON.stringify(payload)}`;
  if (method === 'GET' && _inflightRequests.has(inflightKey)) {
    return _inflightRequests.get(inflightKey);
  }

  const requestPromise = (async () => {
    try {
      let response;
      if (method === 'GET') {
        const queryParams = new URLSearchParams();
        queryParams.append('action', action);
        if (token) queryParams.append('token', token);
        Object.keys(payload).forEach(k => {
          if (payload[k] !== undefined && payload[k] !== null) {
            queryParams.append(k, typeof payload[k] === 'object' ? JSON.stringify(payload[k]) : payload[k]);
          }
        });
        response = await fetch(`${gasUrl}?${queryParams.toString()}`, { redirect: 'follow' });
      } else {
        // Method POST — Pure JSON string via text/plain untuk bypass CORS
        response = await fetch(gasUrl, {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(requestBody)
        });
      }

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json = await response.json();

      // Cek apakah token kadaluarsa (code 401)
      if (json && json.code === 401) {
        clearToken();
        showToast('Sesi Anda telah berakhir. Silakan login kembali.', 'warning');
        if (typeof navigateTo === 'function') navigateTo('login');
      }

      return json;
    } catch (err) {
      console.error(`[API Error] ${action}:`, err);
      return {
        success: false,
        message: err.message || 'Gagal terhubung ke backend Google Apps Script.',
        error: err
      };
    } finally {
      _inflightRequests.delete(inflightKey);
    }
  })();

  if (method === 'GET') {
    _inflightRequests.set(inflightKey, requestPromise);
  }

  return requestPromise;
}

// ============================================================
// 3. TOAST NOTIFICATION SYSTEM
// ============================================================

let _toastContainer = null;

function ensureToastContainer() {
  if (!_toastContainer) {
    _toastContainer = document.getElementById('toast-container');
    if (!_toastContainer) {
      _toastContainer = document.createElement('div');
      _toastContainer.id = 'toast-container';
      _toastContainer.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(_toastContainer);
    }
  }
  return _toastContainer;
}

/**
 * showToast — Menampilkan pesan notifikasi pop-up yang elegan
 * @param {string} message - Pesan notifikasi
 * @param {'info'|'success'|'error'|'warning'} [type='info'] - Jenis pesan
 * @param {number} [duration=3500] - Durasi tampil (ms)
 */
function showToast(message, type = 'info', duration = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement('div');

  const configs = {
    success: {
      bg: 'bg-emerald-600',
      icon: 'check_circle',
      text: 'text-white'
    },
    error: {
      bg: 'bg-rose-600',
      icon: 'error',
      text: 'text-white'
    },
    warning: {
      bg: 'bg-amber-500',
      icon: 'warning',
      text: 'text-white'
    },
    info: {
      bg: 'bg-indigo-600',
      icon: 'info',
      text: 'text-white'
    }
  };

  const c = configs[type] || configs.info;

  toast.className = `${c.bg} ${c.text} pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-3 opacity-0 text-sm font-medium`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px] flex-shrink-0">${c.icon}</span>
    <span class="flex-1 leading-snug">${escapeHtml(message)}</span>
    <button class="opacity-70 hover:opacity-100 flex-shrink-0 p-0.5" onclick="this.parentElement.remove()">
      <span class="material-symbols-outlined text-[16px]">close</span>
    </button>
  `;

  container.appendChild(toast);

  // Animasi masuk
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-3', 'opacity-0');
  });

  // Hapus otomatis setelah durasi
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================
// 4. MODAL MANAGEMENT
// ============================================================

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.classList.add('overflow-hidden');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.classList.remove('overflow-hidden');
  }
}

// ============================================================
// 5. FORMATTING & DISPLAY HELPERS
// ============================================================

function formatDate(dateStr, format = 'relative') {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (format === 'relative') {
      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Hari ini';
      if (diffDays === 1) return 'Besok';
      if (diffDays === -1) return 'Kemarin';
      if (diffDays > 1 && diffDays <= 7) return `${diffDays} hari lagi`;
      if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} hari lalu`;
    }

    // Format default: 12 Nov 2026
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (_) {
    return dateStr;
  }
}

function formatCurrency(amount) {
  if (amount === undefined || amount === null) return 'Rp 0';
  const num = Number(amount);
  if (isNaN(num)) return String(amount);
  return 'Rp ' + num.toLocaleString('id-ID');
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

async function copyToClipboard(text, successMsg = 'Teks berhasil disalin ke clipboard!') {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast(successMsg, 'success');
      return true;
    }
    // Fallback lama
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    showToast(successMsg, 'success');
    return true;
  } catch (err) {
    showToast('Gagal menyalin teks.', 'error');
    return false;
  }
}

// ============================================================
// 6. SKELETON LOADERS
// ============================================================

function getSkeletonCardHTML(height = 'h-32') {
  return `
    <div class="animate-pulse bg-white/60 rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between ${height}">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-slate-200"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 bg-slate-200 rounded w-1/2"></div>
          <div class="h-3 bg-slate-100 rounded w-1/3"></div>
        </div>
      </div>
      <div class="space-y-2">
        <div class="h-3 bg-slate-200 rounded w-3/4"></div>
        <div class="h-2 bg-slate-100 rounded w-full"></div>
      </div>
    </div>
  `;
}
