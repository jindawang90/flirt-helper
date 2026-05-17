/* ===== 数据管理层 ===== */
const Store = {
  _prefix: 'huayou_',

  get(k) {
    try {
      const raw = localStorage.getItem(this._prefix + k);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  set(k, v) {
    localStorage.setItem(this._prefix + k, JSON.stringify(v));
  },

  remove(k) {
    localStorage.removeItem(this._prefix + k);
  },

  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this._prefix));
    keys.forEach(k => localStorage.removeItem(k));
  }
};

/* ===== 默认数据 ===== */
const DEFAULT_PROFILE = {
  name: '',
  stage: '刚认识',
  interests: [],
  notes: ''
};

const DEFAULT_SETTINGS = {
  apiKey: '',
  endpoint: 'https://api.deepseek.com/v1/chat/completions',
  model: 'deepseek-chat'
};

/* ===== 业务数据操作 ===== */
const Data = {
  getProfile() {
    return Store.get('profile') || { ...DEFAULT_PROFILE };
  },

  saveProfile(profile) {
    Store.set('profile', profile);
  },

  getSettings() {
    return Store.get('settings') || { ...DEFAULT_SETTINGS };
  },

  saveSettings(settings) {
    Store.set('settings', settings);
  },

  clearAll() {
    Store.clearAll();
  }
};
