/* ===== 页面渲染逻辑 ===== */

/* ---------- 档案页 ---------- */
const ProfilePage = {
  render() {
    const profile = Data.getProfile();
    document.getElementById('profile-name').value = profile.name || '';
    document.getElementById('profile-notes').value = profile.notes || '';
    this.renderStage(profile.stage);
    this.renderTags(profile.interests);
    this.updateAvatar(profile.name);
  },

  updateAvatar(name) {
    const el = document.getElementById('avatar-display');
    if (name && name.trim()) {
      el.textContent = name.trim().charAt(0);
    } else {
      el.textContent = '她';
    }
  },

  renderStage(stage) {
    document.querySelectorAll('#stage-selector span').forEach(el => {
      el.classList.toggle('active', el.dataset.stage === stage);
    });
  },

  renderTags(tags) {
    const container = document.getElementById('tags-container');
    // Clear existing tags (keep the add button)
    container.querySelectorAll('.tag').forEach(el => el.remove());
    const addBtn = document.getElementById('tag-add-btn');

    tags.forEach(tag => {
      const el = document.createElement('span');
      el.className = 'tag';
      el.innerHTML = `${tag} <span class="tag-remove" data-tag="${tag}">x</span>`;
      container.insertBefore(el, addBtn);
    });

    // Bind remove events
    container.querySelectorAll('.tag-remove').forEach(el => {
      el.addEventListener('click', () => {
        const profile = Data.getProfile();
        profile.interests = profile.interests.filter(t => t !== el.dataset.tag);
        Data.saveProfile(profile);
        this.renderTags(profile.interests);
      });
    });
  },

  saveName(name) {
    const profile = Data.getProfile();
    profile.name = name;
    Data.saveProfile(profile);
    this.updateAvatar(name);
  },

  saveStage(stage) {
    const profile = Data.getProfile();
    profile.stage = stage;
    Data.saveProfile(profile);
    this.renderStage(stage);
  },

  addTag(tag) {
    const profile = Data.getProfile();
    if (!profile.interests.includes(tag)) {
      profile.interests.push(tag);
      Data.saveProfile(profile);
      this.renderTags(profile.interests);
    }
  },

  saveNotes(notes) {
    const profile = Data.getProfile();
    profile.notes = notes;
    Data.saveProfile(profile);
  }
};

/* ---------- 助手页 ---------- */
const AssistantPage = {
  async ask() {
    const input = document.getElementById('chat-input').value.trim();
    const scene = document.getElementById('scene-select').value;
    const profile = Data.getProfile();

    if (!input && scene !== 'open') {
      alert('请输入她的消息或描述当前场景');
      return;
    }

    if (!profile.name) {
      alert('建议先到档案页设置她的称呼');
    }

    const btn = document.getElementById('btn-ask');
    const loading = document.getElementById('loading-area');
    const result = document.getElementById('result-area');

    btn.disabled = true;
    btn.textContent = '思考中...';
    result.style.display = 'none';
    loading.style.display = 'block';

    try {
      const text = await getChatSuggestions(profile, scene, input);
      this.renderResult(text);
      result.style.display = 'block';
    } catch (err) {
      alert(err.message || '请求失败，请检查 API Key 和网络');
    } finally {
      btn.disabled = false;
      btn.textContent = '获取建议';
      loading.style.display = 'none';
    }
  },

  renderResult(text) {
    const parts = {
      emotion: '',
      direction: '',
      danger: '',
      topic: ''
    };

    // Parse sections by headers
    const lines = text.split('\n');
    let currentKey = null;
    for (const line of lines) {
      if (line.includes('【她的情绪') || line.includes('【潜台词')) {
        currentKey = 'emotion';
        continue;
      }
      if (line.includes('【回复方向') || line.includes('【回复建议')) {
        currentKey = 'direction';
        continue;
      }
      if (line.includes('【雷区') || line.includes('【避坑')) {
        currentKey = 'danger';
        continue;
      }
      if (line.includes('【话题切入') || line.includes('【切入')) {
        currentKey = 'topic';
        continue;
      }
      if (currentKey && line.trim()) {
        parts[currentKey] += line + '\n';
      }
    }

    // Fallback: if parsing failed, treat whole text as direction
    if (!parts.emotion && !parts.direction && !parts.danger && !parts.topic) {
      parts.direction = text;
    }

    document.querySelector('#result-emotion .result-content').textContent =
      parts.emotion || '信息有限，先回应再观察';
    document.querySelector('#result-direction .result-content').textContent =
      parts.direction || '无法解析建议，请重试';
    document.querySelector('#result-danger .result-content').textContent =
      parts.danger || '暂无明显雷区';
    document.querySelector('#result-topic .result-content').textContent =
      parts.topic || '专注当前对话即可';

    // Show/hide sections
    ['emotion', 'direction', 'danger', 'topic'].forEach(key => {
      const section = document.getElementById('result-' + key);
      if (key === 'direction') {
        section.style.display = 'block';
      } else {
        section.style.display = parts[key] ? 'block' : 'none';
      }
    });
  }
};

/* ---------- 话题页 ---------- */
const TopicsPage = {
  async load() {
    const profile = Data.getProfile();

    // Update labels
    document.getElementById('topics-stage-label').textContent = profile.stage + '阶段';
    document.getElementById('topics-interest-label').textContent =
      profile.interests.length > 0
        ? '基于' + profile.interests.slice(0, 3).join('、') + '推荐'
        : '先到档案页添加兴趣标签';

    if (!profile.interests.length) {
      document.getElementById('topics-list').innerHTML = `
        <div class="empty-state">
          <div class="icon">&#x1F4DA;</div>
          <p>先去档案页添加她的兴趣标签，<br>话题推荐会更精准</p>
        </div>`;
      return;
    }

    const loading = document.getElementById('topics-loading');
    const list = document.getElementById('topics-list');

    loading.style.display = 'block';
    list.innerHTML = '';

    try {
      const topics = await getTopicSuggestions(profile);
      list.innerHTML = topics.map(t => `
        <div class="topic-card">
          <div class="topic-category">${this.esc(t.category || '推荐')}</div>
          <div class="topic-title">${this.esc(t.title || '')}</div>
          <div class="topic-desc">${this.esc(t.desc || '')}</div>
        </div>
      `).join('');
    } catch (err) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="icon">&#x26A0;</div>
          <p>${this.esc(err.message || '获取失败')}</p>
        </div>`;
    } finally {
      loading.style.display = 'none';
    }
  },

  esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

/* ---------- 设置页 ---------- */
const SettingsPage = {
  render() {
    const settings = Data.getSettings();
    document.getElementById('settings-apikey').value = settings.apiKey || '';
    document.getElementById('settings-endpoint').value = settings.endpoint || DEFAULT_SETTINGS.endpoint;
    document.getElementById('settings-model').value = settings.model || DEFAULT_SETTINGS.model;
  },

  save() {
    const settings = {
      apiKey: document.getElementById('settings-apikey').value.trim(),
      endpoint: document.getElementById('settings-endpoint').value.trim() || DEFAULT_SETTINGS.endpoint,
      model: document.getElementById('settings-model').value.trim() || DEFAULT_SETTINGS.model
    };
    Data.saveSettings(settings);

    const tip = document.getElementById('save-tip');
    tip.style.display = 'block';
    setTimeout(() => { tip.style.display = 'none'; }, 2000);
  },

  clearData() {
    if (confirm('确定清除所有数据？这将会删除她的档案和设置信息。')) {
      Data.clearAll();
      document.getElementById('settings-apikey').value = '';
      document.getElementById('settings-endpoint').value = DEFAULT_SETTINGS.endpoint;
      document.getElementById('settings-model').value = DEFAULT_SETTINGS.model;
    }
  },

  toggleKeyVisibility(btn) {
    const input = document.getElementById('settings-apikey');
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '隐藏';
    } else {
      input.type = 'password';
      btn.textContent = '显示';
    }
  }
};
