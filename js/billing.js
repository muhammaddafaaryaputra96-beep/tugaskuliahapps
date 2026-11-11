/**
 * billing.js — Modul Tagihan & Langganan TugasKuliah Apps
 * Mendukung: Pemilihan paket (FREE, PRO, PREMIUM), upload bukti transfer,
 * kwitansi pembayaran resmi dengan verifikasi QR ber-HMAC, dan verifikasi admin 1-klik.
 * Referensi skill: gas-tagihan-pembayaran
 * Versi: 1.0.0
 */

window.BillingState = {
  myBills: [],
  pendingBills: []
};

// ============================================================
// 1. RENDER HALAMAN LANGGANAN & TAGIHAN
// ============================================================

async function renderBillingPage() {
  const container = document.getElementById('billing-container') || document.getElementById('app-main-view');
  if (!container) return;

  const user = getCurrentUser() || {};
  const currentPlan = user.planType || 'FREE';
  const isAdmin = (user.peran === 'Admin');

  container.innerHTML = `
    <div class="px-6 md:px-8 py-8 flex flex-col gap-8 max-w-7xl mx-auto w-full">
      
      <!-- Breadcrumb & Header -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
          <span class="hover:text-indigo-600 cursor-pointer" onclick="navigateTo('dashboard')">Dashboard</span>
          <span class="material-symbols-outlined text-[14px]">chevron_right</span>
          <span class="text-indigo-600 font-semibold">Langganan &amp; Pembayaran</span>
        </div>
        
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="font-bold text-2xl md:text-3xl text-slate-900 tracking-tight">Paket Langganan &amp; Tagihan</h1>
            <p class="text-sm text-slate-500 mt-1">
              Tingkatkan kuota AI Gemini 1.5 Pro, fitur ekspor dokumen resmi, dan kolaborasi tanpa batas.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
              Paket Anda Saat Ini: <strong class="uppercase">${currentPlan}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- Pricing Plans Grid (3 Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        <!-- CARD 1: FREE -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border ${currentPlan === 'FREE' ? 'border-2 border-indigo-600' : 'border-slate-200'} flex flex-col justify-between relative">
          ${currentPlan === 'FREE' ? `
            <span class="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
              Paket Aktif
            </span>
          ` : ''}
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-bold text-lg text-slate-900">Mahasiswa Starter</span>
              <span class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">school</span>
              </span>
            </div>
            <div class="mb-6">
              <span class="font-bold text-3xl text-slate-900">Rp 0</span>
              <span class="text-xs text-slate-500">/ selamanya</span>
            </div>
            <ul class="space-y-3 text-xs text-slate-600 mb-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span><strong>10x Kuota AI</strong> per hari (Gemini 1.5 Pro)</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Maksimal <strong>5 Proyek</strong> aktif</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Akses template standar</span>
              </li>
              <li class="flex items-center gap-2.5 text-slate-400">
                <span class="material-symbols-outlined text-[18px]">cancel</span>
                <span>Ekspor langsung ke Google Slides</span>
              </li>
              <li class="flex items-center gap-2.5 text-slate-400">
                <span class="material-symbols-outlined text-[18px]">cancel</span>
                <span>Notifikasi WA Pengingat Deadline</span>
              </li>
            </ul>
          </div>
          <button disabled class="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-xs cursor-default">
            ${currentPlan === 'FREE' ? 'Sedang Digunakan' : 'Paket Dasar'}
          </button>
        </div>

        <!-- CARD 2: PRO (BEST VALUE) -->
        <div class="bg-white rounded-3xl p-6 shadow-md border-2 border-indigo-600 flex flex-col justify-between relative transform md:-translate-y-2">
          <span class="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-sm">
            PALING POPULER
          </span>
          ${currentPlan === 'PRO' ? `
            <span class="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
              Paket Aktif
            </span>
          ` : ''}
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-bold text-lg text-slate-900">Pro Mahasiswa</span>
              <span class="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">auto_awesome</span>
              </span>
            </div>
            <div class="mb-6">
              <span class="font-bold text-3xl text-slate-900">Rp 29.000</span>
              <span class="text-xs text-slate-500">/ bulan</span>
            </div>
            <ul class="space-y-3 text-xs text-slate-600 mb-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span><strong>50x Kuota AI</strong> per hari</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Maksimal <strong>25 Proyek</strong> aktif</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Ekspor dokumen ke <strong>Google Docs &amp; PDF</strong></span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Generate otomatis ke <strong>Google Slides</strong></span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Notifikasi Pengingat Deadline via <strong>WhatsApp</strong></span>
              </li>
            </ul>
          </div>
          <button onclick="openUpgradeModal('PRO', 29000)" class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition">
            ${currentPlan === 'PRO' ? 'Perpanjang Paket Pro' : 'Tingkatkan ke Pro'}
          </button>
        </div>

        <!-- CARD 3: PREMIUM -->
        <div class="bg-white rounded-3xl p-6 shadow-sm border ${currentPlan === 'PREMIUM' ? 'border-2 border-indigo-600' : 'border-slate-200'} flex flex-col justify-between relative">
          ${currentPlan === 'PREMIUM' ? `
            <span class="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider">
              Paket Aktif
            </span>
          ` : ''}
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="font-bold text-lg text-slate-900">Premium Peneliti</span>
              <span class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                <span class="material-symbols-outlined text-[20px]">workspace_premium</span>
              </span>
            </div>
            <div class="mb-6">
              <span class="font-bold text-3xl text-slate-900">Rp 59.000</span>
              <span class="text-xs text-slate-500">/ bulan</span>
            </div>
            <ul class="space-y-3 text-xs text-slate-600 mb-6">
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span><strong>200x Kuota AI</strong> per hari</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span><strong>Unlimited Proyek</strong> &amp; Kelompok</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Ekstrak Referensi Jurnal Tanpa Batas</span>
              </li>
              <li class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-[18px] text-emerald-500">check_circle</span>
                <span>Semua Fitur Pro + Prioritas Response AI</span>
              </li>
            </ul>
          </div>
          <button onclick="openUpgradeModal('PREMIUM', 59000)" class="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs shadow-md transition">
            ${currentPlan === 'PREMIUM' ? 'Perpanjang Premium' : 'Pilih Premium'}
          </button>
        </div>

      </div>

      <!-- Riwayat Tagihan & Pembayaran Pengguna -->
      <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-bold text-lg text-slate-900">Riwayat Pembayaran Saya</h2>
            <p class="text-xs text-slate-500">Daftar transaksi, status verifikasi, dan kwitansi resmi.</p>
          </div>
          <button onclick="loadMyBills()" class="p-2 rounded-xl text-slate-500 hover:bg-slate-50 transition">
            <span class="material-symbols-outlined text-[20px]">refresh</span>
          </button>
        </div>

        <div id="my-bills-table-container" class="overflow-x-auto">
          <div class="py-8 text-center text-slate-400 text-xs">Memuat data transaksi...</div>
        </div>
      </div>

      <!-- Admin Section: Verifikasi Pembayaran Pending (Hanya tampil jika Admin) -->
      ${isAdmin ? `
        <div class="bg-amber-50/50 rounded-3xl p-6 border border-amber-200/80 flex flex-col gap-4 mt-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <span class="material-symbols-outlined text-[18px]">verified</span>
              </div>
              <div>
                <h3 class="font-bold text-base text-amber-950">Panel Verifikasi Pembayaran (Admin)</h3>
                <p class="text-xs text-amber-700">Tinjau bukti transfer masuk dan setujui upgrade akun mahasiswa 1-klik.</p>
              </div>
            </div>
            <button onclick="loadPendingBillsAdmin()" class="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition">
              Segarkan Antrean
            </button>
          </div>

          <div id="admin-pending-bills-container" class="overflow-x-auto">
            <div class="py-6 text-center text-amber-700/70 text-xs">Memuat daftar pembayaran menunggu verifikasi...</div>
          </div>
        </div>
      ` : ''}

    </div>

    <!-- Modal Konfirmasi Upgrade & Bukti Pembayaran -->
    <div id="upgrade-modal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <span class="material-symbols-outlined text-[20px]">payments</span>
            </div>
            <div>
              <h3 class="font-bold text-base text-slate-900">Konfirmasi Upgrade Paket</h3>
              <p id="upg-plan-title" class="text-xs text-slate-500">Paket</p>
            </div>
          </div>
          <button onclick="closeModal('upgrade-modal')" class="p-1 text-slate-400 hover:text-slate-600">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onsubmit="handleFormSubmitProof(event);" class="p-6 space-y-4">
          <input type="hidden" id="upg-selected-plan" />
          <input type="hidden" id="upg-selected-nominal" />

          <!-- Info Pembayaran Rekening -->
          <div class="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900 space-y-2">
            <div class="flex justify-between">
              <span class="text-indigo-600">Total Nominal:</span>
              <strong id="upg-nominal-display" class="text-sm font-bold text-indigo-950">Rp 0</strong>
            </div>
            <div class="border-t border-indigo-200/50 pt-2 flex justify-between">
              <span>Rekening Transfer:</span>
              <strong class="font-mono">BCA 123-456-7890</strong>
            </div>
            <div class="flex justify-between">
              <span>Atas Nama:</span>
              <strong>TugasKuliah Apps Official</strong>
            </div>
            <div class="flex justify-between">
              <span>QRIS Instan:</span>
              <span class="text-[11px] bg-indigo-200/60 px-2 py-0.5 rounded font-mono">BCA / Mandiri / GoPay</span>
            </div>
          </div>

          <!-- Input Bukti Transfer (URL atau Kode Ref) -->
          <div class="space-y-1.5 text-left">
            <label class="block text-xs font-bold text-slate-700 uppercase" for="upg-proof-url">
              Link Bukti Transfer / Nomor Referensi Bank
            </label>
            <input id="upg-proof-url" type="text" required placeholder="https://drive.google.com/... atau No. Ref"
              class="w-full h-10 px-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-indigo-600 outline-none" />
            <p class="text-[11px] text-slate-400">Unggah foto bukti transfer ke Google Drive atau masukkan nomor referensi mutasi bank.</p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button type="button" onclick="closeModal('upgrade-modal')" class="px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
            <button type="submit" id="btn-submit-proof" class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition">
              Kirim Bukti Pembayaran
            </button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Muat data tagihan pengguna
  loadMyBills();
  if (isAdmin) loadPendingBillsAdmin();
}

// ============================================================
// 2. INTERACTIONS & API CALLS
// ============================================================

function openUpgradeModal(plan, nominal) {
  document.getElementById('upg-selected-plan').value = plan;
  document.getElementById('upg-selected-nominal').value = nominal;
  document.getElementById('upg-plan-title').textContent = `Paket ${plan} • Masa aktif 30 hari`;
  document.getElementById('upg-nominal-display').textContent = formatCurrency(nominal);
  showModal('upgrade-modal');
}

async function handleFormSubmitProof(e) {
  e.preventDefault();
  const plan = document.getElementById('upg-selected-plan').value;
  const nominal = document.getElementById('upg-selected-nominal').value;
  const proofUrl = document.getElementById('upg-proof-url').value.trim();
  const btn = document.getElementById('btn-submit-proof');

  btn.disabled = true;
  btn.textContent = 'Mengirim...';

  try {
    const res = await api('billing.submitProof', {
      paket: plan,
      nominal: Number(nominal),
      buktiTransferUrl: proofUrl,
      metodePembayaran: 'Transfer Bank / QRIS'
    });

    if (res && res.success) {
      closeModal('upgrade-modal');
      showToast('Bukti pembayaran berhasil dikirim! Menunggu konfirmasi Admin.', 'success', 5000);
      loadMyBills();
    } else {
      showToast(res?.message || 'Gagal mengirim bukti pembayaran.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kendala koneksi.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim Bukti Pembayaran';
  }
}

async function loadMyBills() {
  const container = document.getElementById('my-bills-table-container');
  if (!container) return;

  try {
    const res = await api('billing.mine');
    const bills = (res && res.success && res.data) ? res.data : [];
    BillingState.myBills = bills;

    if (bills.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs">
          Belum ada riwayat tagihan. Anda sedang menggunakan Paket Free.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left text-xs border-collapse">
        <thead>
          <tr class="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-semibold">
            <th class="py-3 px-3">ID Tagihan</th>
            <th class="py-3 px-3">Paket</th>
            <th class="py-3 px-3">Nominal</th>
            <th class="py-3 px-3">Tanggal</th>
            <th class="py-3 px-3">Status</th>
            <th class="py-3 px-3 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${bills.map(b => {
            const statusBadges = {
              'Lunas': 'bg-emerald-50 text-emerald-700 border-emerald-200',
              'Menunggu Verifikasi': 'bg-amber-50 text-amber-700 border-amber-200',
              'Belum Bayar': 'bg-rose-50 text-rose-700 border-rose-200'
            };
            const badgeClass = statusBadges[b.status] || 'bg-slate-50 text-slate-600 border-slate-200';

            return `
              <tr class="hover:bg-slate-50/60 transition">
                <td class="py-3 px-3 font-mono font-medium text-slate-700">${escapeHtml(b.tagihanId || b.id || '-')}</td>
                <td class="py-3 px-3 font-semibold text-slate-800">${escapeHtml(b.paket || 'PRO')}</td>
                <td class="py-3 px-3 font-mono text-slate-700">${formatCurrency(b.nominal)}</td>
                <td class="py-3 px-3 text-slate-500">${formatDate(b.tanggalTagihan || b.createdAt)}</td>
                <td class="py-3 px-3">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeClass}">
                    ${escapeHtml(b.status || 'Lunas')}
                  </span>
                </td>
                <td class="py-3 px-3 text-right">
                  ${b.status === 'Lunas' ? `
                    <button onclick="downloadReceipt('${b.tagihanId}')" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition">
                      <span class="material-symbols-outlined text-[14px]">receipt_long</span>
                      <span>Kwitansi</span>
                    </button>
                  ` : '-'}
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="py-4 text-center text-rose-500 text-xs">Gagal memuat riwayat tagihan.</div>`;
  }
}

async function loadPendingBillsAdmin() {
  const container = document.getElementById('admin-pending-bills-container');
  if (!container) return;

  try {
    const res = await api('billing.pending');
    const list = (res && res.success && res.data) ? res.data : [];
    BillingState.pendingBills = list;

    if (list.length === 0) {
      container.innerHTML = `<div class="py-4 text-center text-slate-500 text-xs">Tidak ada pembayaran pending saat ini. Semua telah terverifikasi!</div>`;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left text-xs bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase font-semibold">
          <tr>
            <th class="py-2.5 px-3">User</th>
            <th class="py-2.5 px-3">Paket</th>
            <th class="py-2.5 px-3">Nominal</th>
            <th class="py-2.5 px-3">Bukti</th>
            <th class="py-2.5 px-3 text-right">Aksi Verifikasi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${list.map(p => `
            <tr>
              <td class="py-2.5 px-3 font-medium text-slate-800">${escapeHtml(p.userId || p.email)}</td>
              <td class="py-2.5 px-3 font-semibold text-indigo-600">${escapeHtml(p.paket || 'PRO')}</td>
              <td class="py-2.5 px-3 font-mono">${formatCurrency(p.nominal)}</td>
              <td class="py-2.5 px-3">
                ${p.buktiTransferUrl ? `<a href="${escapeHtml(p.buktiTransferUrl)}" target="_blank" class="text-indigo-600 underline font-medium">Buka Bukti ↗</a>` : '-'}
              </td>
              <td class="py-2.5 px-3 text-right">
                <button onclick="verifyPaymentAdmin('${p.pembayaranId || p.tagihanId}')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">
                  Setujui 1-Klik
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = `<div class="py-4 text-center text-rose-600 text-xs">Gagal mengambil antrean pending.</div>`;
  }
}

async function verifyPaymentAdmin(id) {
  if (!confirm('Setujui pembayaran ini dan perbarui paket langganan mahasiswa?')) return;
  showToast('Memverifikasi pembayaran...', 'info');
  try {
    const res = await api('billing.verifyPayment', { tagihanId: id, pembayaranId: id });
    if (res && res.success) {
      showToast('Pembayaran berhasil diverifikasi! Kuota user diperbarui.', 'success');
      loadPendingBillsAdmin();
    } else {
      showToast(res?.message || 'Gagal verifikasi pembayaran.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kendala verifikasi.', 'error');
  }
}

async function downloadReceipt(tagihanId) {
  showToast('Menyiapkan kwitansi resmi ber-QR...', 'info');
  try {
    const res = await api('billing.receipt', { tagihanId });
    if (res && res.success && res.data) {
      const d = res.data;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Kwitansi Resmi — TugasKuliah Apps</title>
            <style>
              body { font-family: 'Plus Jakarta Sans', sans-serif, system-ui; padding: 40px; color: #0F172A; max-width: 600px; margin: 0 auto; }
              .header { border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
              .logo { font-size: 20px; font-weight: bold; color: #4F46E5; }
              .badge { background: #DCFCE7; color: #166534; font-weight: bold; padding: 4px 12px; border-radius: 9999px; font-size: 12px; }
              .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
              .qr-box { margin-top: 30px; text-align: center; padding: 20px; background: #F8FAFC; border-radius: 16px; border: 1px dashed #CBD5E1; }
              .qr-img { width: 140px; height: 140px; margin: 0 auto 10px; }
              .notice { font-size: 11px; color: #64748B; margin-top: 20px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="logo">TugasKuliah Apps</div>
              <div class="badge">LUNAS / RESMI</div>
            </div>
            <h2>Kwitansi Pembayaran Berlangganan</h2>
            <div class="row"><span>Nomor Kwitansi:</span><strong>${d.nomorKW || ('KW-' + tagihanId)}</strong></div>
            <div class="row"><span>ID Tagihan:</span><span style="font-family: monospace;">${tagihanId}</span></div>
            <div class="row"><span>Nama Pengguna:</span><strong>${d.namaUser || 'Mahasiswa'}</strong></div>
            <div class="row"><span>Paket Layanan:</span><strong>Paket ${d.paket || 'PRO'} (30 Hari)</strong></div>
            <div class="row"><span>Jumlah Dibayar:</span><strong>${formatCurrency(d.nominal)}</strong></div>
            <div class="row"><span>Tanggal Transaksi:</span><span>${d.tanggalBayar || new Date().toLocaleDateString('id-ID')}</span></div>

            <div class="qr-box">
              <img class="qr-img" src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(d.qrVerificationUrl || window.location.href)}" alt="QR Verifikasi" />
              <div style="font-size: 12px; font-weight: 600; color: #334155;">Pindai untuk Verifikasi Keaslian Kwitansi</div>
              <div style="font-size: 10px; color: #64748B; font-family: monospace; margin-top: 4px;">HMAC-SHA256 Signed Security Token</div>
            </div>

            <div class="notice">
              Dokumen ini diterbitkan secara otomatis dan sah tanpa tanda tangan basah berdasarkan ketentuan validasi digital TugasKuliah Apps.
            </div>
            <script>window.onload = function() { window.print(); };</script>
          </body>
          </html>
        `);
        printWindow.document.close();
      }
    } else {
      showToast(res?.message || 'Gagal membuat kwitansi.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat memuat kwitansi.', 'error');
  }
}
