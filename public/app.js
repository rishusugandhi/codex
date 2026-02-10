const state = {
  lastInput: '',
  tasks: [],
  reminderTimerId: null,
};

const REMINDER_INTERVAL_MS = 15 * 60 * 1000;

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const chatLog = document.getElementById('chatLog');
const taskTableBody = document.getElementById('taskTableBody');
const taskCount = document.getElementById('taskCount');
const rerunBtn = document.getElementById('rerunBtn');
const clearBtn = document.getElementById('clearBtn');
const nowBtn = document.getElementById('nowBtn');
const rescueBtn = document.getElementById('rescueBtn');
const startReminderBtn = document.getElementById('startReminderBtn');
const stopReminderBtn = document.getElementById('stopReminderBtn');
const reminderStatus = document.getElementById('reminderStatus');

appendMessage('assistant', 'Hi — share your tasks and I will prioritize them into your matrix.');

taskForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = taskInput.value.trim();
  if (!input) return;

  state.lastInput = input;
  appendMessage('user', input);
  taskInput.value = '';

  await analyze(input);
});

rerunBtn.addEventListener('click', async () => {
  if (state.lastInput) {
    appendMessage('assistant', 'Re-running your analysis with the same input.');
    await analyze(state.lastInput);
  }
});

clearBtn.addEventListener('click', () => {
  stopReminders(false);
  state.lastInput = '';
  state.tasks = [];
  chatLog.innerHTML = '';
  appendMessage('assistant', 'Cleared. Ready for a new set of tasks.');
  renderTasks();
});

nowBtn.addEventListener('click', () => {
  if (!state.tasks.length) return;

  const top = rankTasks(state.tasks)[0];
  appendMessage(
    'system',
    `Start with: "${top.task}" (${top.priority_bucket}, ${top.estimated_time_minutes} min).`
  );
});

rescueBtn.addEventListener('click', () => {
  if (!state.tasks.length) return;

  const ranked = rankTasks(state.tasks).slice(0, 3);
  const lines = ranked.map(
    (task, idx) => `${idx + 1}) ${task.task} (${task.estimated_time_minutes} min)`
  );

  appendMessage(
    'system',
    `Take one deep breath. We only need the next 3 steps:\n${lines.join('\n')}\nStart with step 1 and ignore everything else for now.`
  );
});

startReminderBtn.addEventListener('click', () => {
  if (!state.tasks.length || state.reminderTimerId) return;

  state.reminderTimerId = window.setInterval(() => {
    const top = rankTasks(state.tasks)[0];
    appendMessage(
      'system',
      `Reminder: focus on "${top.task}" for the next ${Math.min(top.estimated_time_minutes, 15)} minutes.`
    );
  }, REMINDER_INTERVAL_MS);

  reminderStatus.textContent = 'Reminders every 15 min';
  startReminderBtn.disabled = true;
  stopReminderBtn.disabled = false;
  appendMessage('assistant', 'Got it — I will send a focus reminder every 15 minutes.');
});

stopReminderBtn.addEventListener('click', () => {
  stopReminders(true);
});

async function analyze(input) {
  setLoading(true);
  appendMessage('assistant', 'Analyzing tasks...');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to analyze tasks');
    }

    state.tasks = payload.tasks || [];
    renderTasks();
    appendMessage('assistant', `Done. I parsed ${state.tasks.length} task(s).`);
  } catch (error) {
    appendMessage('system', `Analysis failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function renderTasks() {
  taskCount.textContent = `${state.tasks.length} task${state.tasks.length === 1 ? '' : 's'}`;

  if (!state.tasks.length) {
    taskTableBody.innerHTML =
      '<tr><td colspan="5" class="empty">No tasks yet. Start by entering your day.</td></tr>';
    rerunBtn.disabled = true;
    nowBtn.disabled = true;
    rescueBtn.disabled = true;
    startReminderBtn.disabled = true;
    stopReminderBtn.disabled = true;
    reminderStatus.textContent = 'Reminders off';
    return;
  }

  taskTableBody.innerHTML = state.tasks
    .map(
      (t) => `<tr>
        <td>${escapeHtml(t.task)}</td>
        <td>${titleCase(t.urgency)}</td>
        <td>${titleCase(t.importance)}</td>
        <td>${t.estimated_time_minutes} min</td>
        <td><span class="badge ${toClass(t.priority_bucket)}">${escapeHtml(t.priority_bucket)}</span></td>
      </tr>`
    )
    .join('');

  rerunBtn.disabled = false;
  nowBtn.disabled = false;
  rescueBtn.disabled = false;
  startReminderBtn.disabled = Boolean(state.reminderTimerId);
  stopReminderBtn.disabled = !state.reminderTimerId;
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function setLoading(loading) {
  taskForm.querySelector('button[type="submit"]').disabled = loading;
  rerunBtn.disabled = loading || !state.lastInput;
}

function rankTasks(tasks) {
  return [...tasks].sort((a, b) => {
    const bucketRank = { 'Do Now': 0, Schedule: 1, 'Quick Task': 2, Drop: 3 };
    const urgencyRank = { high: 0, medium: 1, low: 2 };
    const importanceRank = { high: 0, medium: 1, low: 2 };

    return (
      bucketRank[a.priority_bucket] - bucketRank[b.priority_bucket] ||
      urgencyRank[a.urgency] - urgencyRank[b.urgency] ||
      importanceRank[a.importance] - importanceRank[b.importance] ||
      a.estimated_time_minutes - b.estimated_time_minutes
    );
  });
}

function stopReminders(announce) {
  if (state.reminderTimerId) {
    window.clearInterval(state.reminderTimerId);
    state.reminderTimerId = null;
  }

  reminderStatus.textContent = 'Reminders off';
  startReminderBtn.disabled = !state.tasks.length;
  stopReminderBtn.disabled = true;

  if (announce) {
    appendMessage('assistant', 'Reminders stopped. We can restart whenever you need.');
  }
}

function titleCase(value) {
  return String(value || '').replace(/^./, (s) => s.toUpperCase());
}

function toClass(bucket) {
  return String(bucket || '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
