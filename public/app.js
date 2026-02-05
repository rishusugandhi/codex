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
  state.lastInput = '';
  state.tasks = [];
  chatLog.innerHTML = '';
  appendMessage('assistant', 'Cleared. Ready for a new set of tasks.');
  renderTasks();
});

nowBtn.addEventListener('click', () => {
  if (!state.tasks.length) return;

  const ranked = [...state.tasks].sort((a, b) => {
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

  const top = ranked[0];
  appendMessage(
    'system',
    `Start with: "${top.task}" (${top.priority_bucket}, ${top.estimated_time_minutes} min).`
  );
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
