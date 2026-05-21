(function () {
  'use strict';

  /* ============================================================
     Feature Detection
     ============================================================ */
  var supported = (
    typeof localStorage !== 'undefined' &&
    typeof JSON !== 'undefined' &&
    typeof Intl !== 'undefined' &&
    typeof setInterval !== 'undefined' &&
    typeof Array.prototype.findIndex !== 'undefined'
  );

  if (!supported) {
    var banner = document.getElementById('unsupported-banner');
    if (banner) { banner.hidden = false; }
    return;
  }

  /* ============================================================
     StorageService
     ============================================================ */
  var StorageService = (function () {

    function save(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
      } catch (e) {
        return false;
      }
    }

    function load(key, fallback) {
      try {
        var raw = localStorage.getItem(key);
        if (raw === null) { return fallback; }
        return JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    }

    return { save: save, load: load };
  })();

  /* ============================================================
     ThemeModule
     ============================================================ */
  var ThemeModule = (function () {

    var STORAGE_KEY = 'theme';
    var current = 'light';

    function apply(theme) {
      current = theme;
      document.documentElement.setAttribute('data-theme', theme);
      var icon = document.getElementById('theme-icon');
      if (icon) { icon.textContent = (theme === 'dark') ? '☀️' : '🌙'; }
      StorageService.save(STORAGE_KEY, theme);
    }

    function init() {
      var saved = StorageService.load(STORAGE_KEY, 'light');
      apply((saved === 'dark') ? 'dark' : 'light');

      var btn = document.getElementById('theme-toggle');
      if (btn) {
        btn.addEventListener('click', function () {
          apply(current === 'dark' ? 'light' : 'dark');
        });
      }
    }

    return { init: init };
  })();

  /* ============================================================
     GreetingModule
     ============================================================ */
  var GreetingModule = (function () {

    var STORAGE_KEY = 'userName';

    function getGreeting(hour, name) {
      var base;
      if (hour >= 5  && hour <= 11) { base = 'Good Morning'; }
      else if (hour >= 12 && hour <= 17) { base = 'Good Afternoon'; }
      else if (hour >= 18 && hour <= 20) { base = 'Good Evening'; }
      else { base = 'Good Night'; }

      return name ? base + ', ' + name + '!' : base + '!';
    }

    function formatClock(date) {
      var h = date.getHours().toString().padStart(2, '0');
      var m = date.getMinutes().toString().padStart(2, '0');
      return h + ':' + m;
    }

    function formatDate(date) {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day:     '2-digit',
        month:   'long',
        year:    'numeric'
      });
    }

    function render() {
      var now     = new Date();
      var hour    = now.getHours();
      var name    = StorageService.load(STORAGE_KEY, '');
      var elGreet = document.getElementById('greeting-text');
      var elClock = document.getElementById('clock-display');
      var elDate  = document.getElementById('date-display');

      if (elGreet) { elGreet.textContent = getGreeting(hour, name); }
      if (elClock) { elClock.textContent = formatClock(now); }
      if (elDate)  { elDate.textContent  = formatDate(now); }
    }

    function init() {
      // Pre-fill name input with saved value
      var savedName = StorageService.load(STORAGE_KEY, '');
      var nameInput = document.getElementById('name-input');
      if (nameInput && savedName) { nameInput.value = savedName; }

      render();

      // Poll every second; update clock at minute boundary
      setInterval(function () {
        if (new Date().getSeconds() === 0) { render(); }
      }, 1000);

      // Save name on button click
      var saveBtn = document.getElementById('name-save');
      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          var val = nameInput ? nameInput.value.trim() : '';
          StorageService.save(STORAGE_KEY, val);
          render();
        });
      }

      // Save name on Enter key
      if (nameInput) {
        nameInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            StorageService.save(STORAGE_KEY, nameInput.value.trim());
            render();
          }
        });
      }
    }

    return { init: init };
  })();

  /* ============================================================
     TimerModule
     ============================================================ */
  var TimerModule = (function () {

    var TOTAL        = 25 * 60;
    var totalSeconds = TOTAL;
    var intervalId   = null;
    var running      = false;

    function formatTime(s) {
      var m   = Math.floor(s / 60).toString().padStart(2, '0');
      var sec = (s % 60).toString().padStart(2, '0');
      return m + ':' + sec;
    }

    function renderTimer() {
      var el = document.getElementById('timer-display');
      if (el) { el.textContent = formatTime(totalSeconds); }
    }

    function setButtonStates(isRunning, isEnded) {
      var btnStart = document.getElementById('timer-start');
      var btnStop  = document.getElementById('timer-stop');
      if (btnStart) { btnStart.disabled = isRunning || isEnded; }
      if (btnStop)  { btnStop.disabled  = !isRunning; }
    }

    function showEnded(show) {
      var el = document.getElementById('timer-ended');
      if (el) { el.hidden = !show; }
    }

    function tick() {
      totalSeconds -= 1;
      renderTimer();
      if (totalSeconds <= 0) {
        clearInterval(intervalId);
        intervalId = null;
        running    = false;
        showEnded(true);
        setButtonStates(false, true);
      }
    }

    function init() {
      renderTimer();
      setButtonStates(false, false);

      var btnStart = document.getElementById('timer-start');
      var btnStop  = document.getElementById('timer-stop');
      var btnReset = document.getElementById('timer-reset');

      if (btnStart) {
        btnStart.addEventListener('click', function () {
          if (running) { return; }
          running    = true;
          intervalId = setInterval(tick, 1000);
          showEnded(false);
          setButtonStates(true, false);
        });
      }

      if (btnStop) {
        btnStop.addEventListener('click', function () {
          if (!running) { return; }
          clearInterval(intervalId);
          intervalId = null;
          running    = false;
          setButtonStates(false, false);
        });
      }

      if (btnReset) {
        btnReset.addEventListener('click', function () {
          clearInterval(intervalId);
          intervalId   = null;
          running      = false;
          totalSeconds = TOTAL;
          renderTimer();
          showEnded(false);
          setButtonStates(false, false);
        });
      }
    }

    return { init: init };
  })();

  /* ============================================================
     TodoModule
     ============================================================ */
  var TodoModule = (function () {

    var tasks     = [];
    var editingId = null;
    var sortMode  = 'default';

    function generateId() {
      return Date.now() + Math.random();
    }

    function saveTasks() {
      return StorageService.save('tasks', tasks);
    }

    function getSortedTasks() {
      var copy = tasks.slice();
      if (sortMode === 'az') {
        copy.sort(function (a, b) { return a.description.localeCompare(b.description); });
      } else if (sortMode === 'za') {
        copy.sort(function (a, b) { return b.description.localeCompare(a.description); });
      } else if (sortMode === 'active') {
        copy.sort(function (a, b) { return (a.completed === b.completed) ? 0 : a.completed ? 1 : -1; });
      } else if (sortMode === 'completed') {
        copy.sort(function (a, b) { return (a.completed === b.completed) ? 0 : a.completed ? -1 : 1; });
      }
      return copy;
    }

    function renderTasks() {
      var list = document.getElementById('todo-list');
      if (!list) { return; }

      var sorted = getSortedTasks();

      if (sorted.length === 0) {
        list.innerHTML = '<li class="todo__empty" style="color:var(--color-text-muted);font-size:0.875rem;padding:0.5rem 0;grid-column:1/-1;">No tasks yet. Add one above!</li>';
        return;
      }

      list.innerHTML = sorted.map(function (task) {
        var isEditing      = (task.id === editingId);
        var completedClass = task.completed ? ' completed' : '';
        var id             = task.id;

        if (isEditing) {
          return (
            '<li class="todo__item" data-id="' + id + '">' +
              '<input class="todo__item-edit-input" type="text" maxlength="200" ' +
                'value="' + escapeAttr(task.description) + '" aria-label="Edit task" />' +
              '<button class="btn btn--primary btn--save" data-id="' + id + '" style="font-size:0.75rem;padding:0.3rem 0.6rem;">Save</button>' +
              '<button class="btn btn--ghost btn--cancel" data-id="' + id + '" style="font-size:0.75rem;padding:0.3rem 0.6rem;">Cancel</button>' +
            '</li>'
          );
        }

        return (
          '<li class="todo__item" data-id="' + id + '">' +
            '<button class="btn btn--icon btn--toggle" data-id="' + id + '" ' +
              'aria-label="' + (task.completed ? 'Mark incomplete' : 'Mark complete') + '" ' +
              'title="' + (task.completed ? 'Mark incomplete' : 'Mark complete') + '">' +
              (task.completed ? '✓' : '○') +
            '</button>' +
            '<span class="todo__item-text' + completedClass + '">' + escapeHtml(task.description) + '</span>' +
            '<button class="btn btn--icon btn--edit" data-id="' + id + '" aria-label="Edit task" title="Edit">✎</button>' +
            '<button class="btn btn--danger btn--delete" data-id="' + id + '" aria-label="Delete task" title="Delete">✕</button>' +
          '</li>'
        );
      }).join('');
    }

    function addTask(description) {
      var trimmed = description.trim();
      var errEl   = document.getElementById('todo-error');
      var input   = document.getElementById('todo-input');

      if (!trimmed) {
        if (errEl) { errEl.textContent = 'Task description cannot be empty.'; errEl.hidden = false; }
        if (input) { input.focus(); }
        return;
      }

      tasks.push({ id: generateId(), description: trimmed, completed: false });

      var saved = saveTasks();
      if (!saved) {
        if (errEl) { errEl.textContent = 'Task could not be saved. Changes are temporary.'; errEl.hidden = false; }
      } else {
        if (errEl) { errEl.hidden = true; }
      }

      if (input) { input.value = ''; }
      renderTasks();
    }

    function startEdit(id) {
      editingId = id;
      renderTasks();
      var list = document.getElementById('todo-list');
      if (list) {
        var editInput = list.querySelector('.todo__item-edit-input');
        if (editInput) {
          editInput.focus();
          var len = editInput.value.length;
          editInput.setSelectionRange(len, len);
        }
      }
    }

    function confirmEdit(id, value) {
      var trimmed = value.trim();
      var list    = document.getElementById('todo-list');

      if (!trimmed) {
        if (list) {
          var editInput = list.querySelector('.todo__item-edit-input');
          var existing  = list.querySelector('.todo__item-validation');
          if (!existing && editInput) {
            var msg = document.createElement('span');
            msg.className   = 'todo__item-validation';
            msg.textContent = 'Description cannot be empty.';
            editInput.parentNode.insertBefore(msg, editInput.nextSibling);
          }
          if (editInput) { editInput.focus(); }
        }
        return;
      }

      var idx = tasks.findIndex(function (t) { return t.id === id; });
      if (idx !== -1) {
        tasks[idx].description = trimmed;
        saveTasks();
      }
      editingId = null;
      renderTasks();
    }

    function cancelEdit() {
      editingId = null;
      renderTasks();
    }

    function toggleTask(id) {
      var idx = tasks.findIndex(function (t) { return t.id === id; });
      if (idx !== -1) {
        tasks[idx].completed = !tasks[idx].completed;
        saveTasks();
        renderTasks();
      }
    }

    function deleteTask(id) {
      var idx = tasks.findIndex(function (t) { return t.id === id; });
      if (idx !== -1) {
        tasks.splice(idx, 1);
        saveTasks();
        renderTasks();
      }
    }

    function init() {
      var loaded = StorageService.load('tasks', []);
      tasks = Array.isArray(loaded) ? loaded : [];

      // Restore sort preference
      var savedSort = StorageService.load('taskSort', 'default');
      sortMode = savedSort;
      var sortSelect = document.getElementById('sort-select');
      if (sortSelect) { sortSelect.value = sortMode; }

      renderTasks();

      var addBtn = document.getElementById('todo-add');
      var input  = document.getElementById('todo-input');

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          addTask(input ? input.value : '');
        });
      }

      if (input) {
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { addTask(input.value); }
        });
        input.addEventListener('input', function () {
          var errEl = document.getElementById('todo-error');
          if (errEl) { errEl.hidden = true; }
        });
      }

      // Sort select
      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          sortMode = sortSelect.value;
          StorageService.save('taskSort', sortMode);
          renderTasks();
        });
      }

      // Event delegation for list actions
      var list = document.getElementById('todo-list');
      if (list) {
        list.addEventListener('click', function (e) {
          var btn = e.target.closest('button');
          if (!btn) { return; }
          var id = parseFloat(btn.getAttribute('data-id'));

          if (btn.classList.contains('btn--toggle'))  { toggleTask(id); }
          if (btn.classList.contains('btn--edit'))    { startEdit(id); }
          if (btn.classList.contains('btn--delete'))  { deleteTask(id); }
          if (btn.classList.contains('btn--save')) {
            var editInput = btn.parentNode.querySelector('.todo__item-edit-input');
            confirmEdit(id, editInput ? editInput.value : '');
          }
          if (btn.classList.contains('btn--cancel'))  { cancelEdit(); }
        });

        list.addEventListener('keydown', function (e) {
          var editInput = e.target.closest('.todo__item-edit-input');
          if (!editInput) { return; }
          var li = editInput.closest('.todo__item');
          var id = li ? parseFloat(li.getAttribute('data-id')) : null;
          if (id === null) { return; }
          if (e.key === 'Enter')  { confirmEdit(id, editInput.value); }
          if (e.key === 'Escape') { cancelEdit(); }
        });
      }
    }

    return { init: init };
  })();

  /* ============================================================
     LinksModule
     ============================================================ */
  var LinksModule = (function () {

    var links = [];

    function generateId() {
      return Date.now() + Math.random();
    }

    function saveLinks() {
      return StorageService.save('quickLinks', links);
    }

    function renderLinks() {
      var panel = document.getElementById('links-panel');
      if (!panel) { return; }

      if (links.length === 0) {
        panel.innerHTML = '<p style="color:var(--color-text-muted);font-size:0.875rem;">No links yet. Add one above!</p>';
        return;
      }

      panel.innerHTML = links.map(function (link) {
        return (
          '<div class="link__item" data-id="' + link.id + '">' +
            '<a class="link__anchor" href="' + escapeAttr(link.url) + '" ' +
              'target="_blank" rel="noopener noreferrer" ' +
              'title="' + escapeAttr(link.url) + '">' +
              escapeHtml(link.label) +
            '</a>' +
            '<button class="btn btn--danger btn--link-delete" data-id="' + link.id + '" ' +
              'aria-label="Delete ' + escapeAttr(link.label) + '" title="Remove">✕</button>' +
          '</div>'
        );
      }).join('');
    }

    function addLink(label, url) {
      var trimLabel = label.trim();
      var trimUrl   = url.trim();
      var errEl     = document.getElementById('link-error');
      var errors    = [];

      if (!trimLabel)                           { errors.push('Label is required.'); }
      if (!trimUrl)                             { errors.push('URL is required.'); }
      else if (!/^https?:\/\//i.test(trimUrl)) { errors.push('URL must start with http:// or https://.'); }

      if (errors.length > 0) {
        if (errEl) { errEl.textContent = errors.join(' '); errEl.hidden = false; }
        return;
      }

      links.push({ id: generateId(), label: trimLabel, url: trimUrl });
      var saved = saveLinks();

      if (!saved) {
        if (errEl) { errEl.textContent = 'Link could not be saved. Changes are temporary.'; errEl.hidden = false; }
      } else {
        if (errEl) { errEl.hidden = true; }
      }

      var labelInput = document.getElementById('link-label-input');
      var urlInput   = document.getElementById('link-url-input');
      if (labelInput) { labelInput.value = ''; }
      if (urlInput)   { urlInput.value   = ''; }

      renderLinks();
    }

    function deleteLink(id) {
      var idx = links.findIndex(function (l) { return l.id === id; });
      if (idx !== -1) {
        links.splice(idx, 1);
        saveLinks();
        renderLinks();
      }
    }

    function init() {
      var loaded = StorageService.load('quickLinks', []);
      links = Array.isArray(loaded) ? loaded : [];
      renderLinks();

      var addBtn     = document.getElementById('link-add');
      var labelInput = document.getElementById('link-label-input');
      var urlInput   = document.getElementById('link-url-input');
      var errEl      = document.getElementById('link-error');

      if (addBtn) {
        addBtn.addEventListener('click', function () {
          addLink(
            labelInput ? labelInput.value : '',
            urlInput   ? urlInput.value   : ''
          );
        });
      }

      [labelInput, urlInput].forEach(function (el) {
        if (el) {
          el.addEventListener('input', function () {
            if (errEl) { errEl.hidden = true; }
          });
        }
      });

      var panel = document.getElementById('links-panel');
      if (panel) {
        panel.addEventListener('click', function (e) {
          var btn = e.target.closest('.btn--link-delete');
          if (!btn) { return; }
          deleteLink(parseFloat(btn.getAttribute('data-id')));
        });
      }
    }

    return { init: init };
  })();

  /* ============================================================
     Utility Helpers
     ============================================================ */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ============================================================
     Bootstrap
     ============================================================ */
  function init() {
    ThemeModule.init();
    GreetingModule.init();
    TimerModule.init();
    TodoModule.init();
    LinksModule.init();
  }

  init();

})();
