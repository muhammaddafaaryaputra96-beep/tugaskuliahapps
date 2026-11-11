/**
 * config.js — Konfigurasi Lingkungan Frontend TugasKuliah Apps
 * Versi: 1.0.0
 */

const CONFIG = {
  // Masukkan URL Web App Anda di dalam tanda petik di bawah ini:
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzWHcAPE-KfVPaXiK0gdv6ICumugcYiCdncKtpB92qV7DYVszZKk4Z-3MdKpbLTe-AUCg/exec',
  
  APP_NAME: 'TugasKuliah Apps',
  APP_VERSION: '1.0.0',
  APP_SUBTITLE: 'Your Academic Productivity Assistant, Powered by AI',
  
  STORAGE_KEYS: {
    TOKEN: 'tk_session_token',
    USER: 'tk_user_profile',
    THEME: 'tk_theme',
    DASHBOARD_CACHE: 'tk_dashboard_cache'
  },

  PLANS: {
    FREE: {
      name: 'Free / Mahasiswa',
      price: 'Rp 0',
      aiLimit: 10,
      maxProjects: 5
    },
    PRO: {
      name: 'Pro Mahasiswa',
      price: 'Rp 29.000 / bln',
      aiLimit: 50,
      maxProjects: 25
    },
    PREMIUM: {
      name: 'Premium Peneliti',
      price: 'Rp 59.000 / bln',
      aiLimit: 200,
      maxProjects: 999
    }
  }
};

const GAS_URL = CONFIG.GAS_URL;
const APP_VERSION = CONFIG.APP_VERSION;