/* ===== App 初始化 ===== */
(function() {
  'use strict';

  /* ---------- Tab Navigation ---------- */
  const tabs = document.querySelectorAll('.tab');
  const pages = document.querySelectorAll('.page');

  function switchTab(pageId) {
    // Update tabs
    tabs.forEach(t => t.classList.toggle('active', t.dataset.page === pageId));
    // Update pages
    pages.forEach(p => p.classList.toggle('active', p.id === 'page-' + pageId));

    // Page-specific init
    switch (pageId) {
      case 'topics':
        TopicsPage.load();
        break;
      case 'settings':
        SettingsPage.render();
        break;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.page);
    });
  });

  /* ---------- 档案页事件 ---------- */
  // Name on change
  document.getElementById('profile-name').addEventListener('input', e => {
    ProfilePage.saveName(e.target.value);
  });

  // Stage selection
  document.getElementById('stage-selector').addEventListener('click', e => {
    if (e.target.tagName === 'SPAN' && e.target.dataset.stage) {
      ProfilePage.saveStage(e.target.dataset.stage);
    }
  });

  // Add tag button
  document.getElementById('tag-add-btn').addEventListener('click', () => {
    const area = document.getElementById('tag-input-area');
    const input = document.getElementById('tag-input');
    area.style.display = 'block';
    input.focus();
  });

  // Tag input
  document.getElementById('tag-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const val = e.target.value.trim();
      if (val) {
        ProfilePage.addTag(val);
        e.target.value = '';
        document.getElementById('tag-input-area').style.display = 'none';
      }
    }
  });

  // Tag input blur
  document.getElementById('tag-input').addEventListener('blur', () => {
    // Delay to allow click on tag-add to register
    setTimeout(() => {
      document.getElementById('tag-input-area').style.display = 'none';
    }, 200);
  });

  // Notes on change
  let notesTimer;
  document.getElementById('profile-notes').addEventListener('input', e => {
    clearTimeout(notesTimer);
    notesTimer = setTimeout(() => ProfilePage.saveNotes(e.target.value), 500);
  });

  /* ---------- 助手页事件 ---------- */
  document.getElementById('btn-ask').addEventListener('click', () => {
    AssistantPage.ask();
  });

  // Allow Ctrl/Cmd+Enter to submit
  document.getElementById('chat-input').addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      AssistantPage.ask();
    }
  });

  /* ---------- 话题页事件 ---------- */
  document.getElementById('btn-refresh-topics').addEventListener('click', () => {
    TopicsPage.load();
  });

  /* ---------- 设置页事件 ---------- */
  document.getElementById('btn-save-settings').addEventListener('click', () => {
    SettingsPage.save();
  });

  document.getElementById('btn-toggle-key').addEventListener('click', e => {
    SettingsPage.toggleKeyVisibility(e.target);
  });

  document.getElementById('btn-clear-data').addEventListener('click', () => {
    SettingsPage.clearData();
  });

  /* ---------- PWA: Register Service Worker ---------- */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  /* ---------- Init ---------- */
  ProfilePage.render();
  SettingsPage.render();
})();
