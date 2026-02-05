import { sanitizeTasks } from './task-utils.js';

export async function analyzeWithOpenAI(input, apiKey, model = 'gpt-4o-mini') {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a productivity assistant. Extract actionable tasks from user input and return strict JSON only. Respect exact schema and keep urgency/importance values to low|medium|high.',
        },
        {
          role: 'user',
          content: `Convert the following raw input into structured tasks.\n\nInput: "${input}"\n\nReturn JSON with this shape:\n{ "tasks": [{ "task": string, "urgency": "low|medium|high", "importance": "low|medium|high", "estimated_time_minutes": number }] }\n\nRules:\n- Split compound input into separate tasks\n- Keep task names short and action-oriented\n- estimated_time_minutes should be an integer between 5 and 240`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty AI response.');
  }

  const parsed = JSON.parse(content);
  const tasks = Array.isArray(parsed?.tasks) ? parsed.tasks : [];
  return sanitizeTasks(tasks);
}
