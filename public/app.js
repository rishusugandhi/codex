const state = {
  lastInput: '',
  tasks: [],
};

const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const chatLog = document.getElementById('chatLog');
const taskTableBody = document.getElementById('taskTableBody');
const taskCount = document.getElementById('taskCount');
const rerunBtn = document.getElementById('rerunBtn');
const clearBtn = document.getElementById('clearBtn');
const nowBtn = document.getElementById('nowBtn');

const metricTotal = document.getElementById('metricTotal');
const metricDoNow = document.getElementById('metricDoNow');
const metricSchedule = document.getElementById('metricSchedule');
const metricQuick = document.getElementById('metricQuick');
const matrixGrid = document.getElementById('matrixGrid');

appendMessage('assistant', 'Welcome. Paste your tasks and I will organize them into a practical workflow.');

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
  if (!state.lastInput) return;
  appendMessage('assistant', 'Re-running your analysis with current context.');
  await analyze(state.lastInput);
});

clearBtn.addEventListener('click', () => {
  state.lastInput = '';
  state.tasks = [];
  chatLog.innerHTML = '';
  appendMessage('assistant', 'All cleared. Add a fresh list to plan your next block.');
  renderTasks();
});

nowBtn.addEventListener('click', () => {
  if (!state.tasks.length) return;
  const top = rankTasks(state.tasks)[0];
  appendMessage('system', `Recommended next step: "${top.task}" — ${top.priority_bucket}, ${top.estimated_time_minutes} min.`);
});

async function analyze(input) {
  setLoading(true);
  appendMessage('assistant', 'Analyzing and mapping your tasks...');

  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input }),
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Failed to analyze tasks');

    state.tasks = Array.isArray(payload.tasks) ? payload.tasks : [];
    renderTasks();

    const doNow = state.tasks.filter((t) => t.priority_bucket === 'Do Now').length;
    if (state.tasks.length === 0) {
      appendMessage('system', 'No actionable tasks were detected. Try clearer action phrases.');
    } else if (doNow > 0) {
      appendMessage('assistant', `Done. ${doNow} high-priority task(s) are ready to execute now.`);
    } else {
      appendMessage('assistant', `Done. ${state.tasks.length} task(s) organized. Start with Schedule or Quick Task bucket.`);
    }
  } catch (error) {
    appendMessage('system', `Analysis failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
}

function renderTasks() {
  const tasks = state.tasks;
  taskCount.textContent = `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;

  renderMetrics(tasks);
  renderMatrix(tasks);

  if (!tasks.length) {
    taskTableBody.innerHTML = '<tr><td colspan="5" class="empty">No tasks yet. Start by entering your day.</td></tr>';
    rerunBtn.disabled = true;
    nowBtn.disabled = true;
    return;
  }

  taskTableBody.innerHTML = tasks
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
}

function renderMetrics(tasks) {
  const counts = {
    total: tasks.length,
    doNow: tasks.filter((t) => t.priority_bucket === 'Do Now').length,
    schedule: tasks.filter((t) => t.priority_bucket === 'Schedule').length,
    quick: tasks.filter((t) => t.priority_bucket === 'Quick Task').length,
  };

  metricTotal.textContent = counts.total;
  metricDoNow.textContent = counts.doNow;
  metricSchedule.textContent = counts.schedule;
  metricQuick.textContent = counts.quick;
}

function renderMatrix(tasks) {
  const buckets = {
    'Do Now': [],
    Schedule: [],
    'Quick Task': [],
    Drop: [],
  };

  for (const t of rankTasks(tasks)) {
    buckets[t.priority_bucket]?.push(`${t.task} (${t.estimated_time_minutes}m)`);
  }

  for (const quadrant of matrixGrid.querySelectorAll('.quadrant')) {
    const bucket = quadrant.getAttribute('data-bucket');
    const list = quadrant.querySelector('ul');
    const values = buckets[bucket] || [];

    list.innerHTML = values.length
      ? values.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
      : '<li class="empty">No tasks</li>';
  }
}

function rankTasks(tasks) {
  const bucketRank = { 'Do Now': 0, Schedule: 1, 'Quick Task': 2, Drop: 3 };
  const urgencyRank = { high: 0, medium: 1, low: 2 };
  const importanceRank = { high: 0, medium: 1, low: 2 };

  return [...tasks].sort(
    (a, b) =>
      bucketRank[a.priority_bucket] - bucketRank[b.priority_bucket] ||
      urgencyRank[a.urgency] - urgencyRank[b.urgency] ||
      importanceRank[a.importance] - importanceRank[b.importance] ||
      a.estimated_time_minutes - b.estimated_time_minutes
  );
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
  nowBtn.disabled = loading || !state.tasks.length;
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

renderTasks();
