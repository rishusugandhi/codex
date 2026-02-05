export function classifyPriority(urgency, importance) {
  if (urgency === 'high' && importance === 'high') return 'Do Now';
  if ((urgency === 'medium' || urgency === 'low') && importance === 'high') return 'Schedule';
  if (urgency === 'high' && (importance === 'medium' || importance === 'low')) return 'Quick Task';
  return 'Drop';
}

export function normalizeScale(value) {
  const val = String(value || '').toLowerCase();
  if (val === 'high' || val === 'medium' || val === 'low') return val;
  return 'medium';
}

export function normalizeMinutes(value) {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.min(240, Math.max(5, Math.round(num)));
  }
  return 30;
}

export function sanitizeTasks(rawTasks) {
  return rawTasks
    .map((t) => ({
      task: String(t.task || '').trim(),
      urgency: normalizeScale(t.urgency),
      importance: normalizeScale(t.importance),
      estimated_time_minutes: normalizeMinutes(t.estimated_time_minutes),
    }))
    .filter((t) => t.task.length > 0)
    .map((task) => ({
      ...task,
      priority_bucket: classifyPriority(task.urgency, task.importance),
    }));
}
