# Personal AI Assistant MVP

A production-style personal assistant that accepts natural-language daily tasks, structures them with OpenAI, and auto-classifies each task into an Eisenhower priority matrix.

## Features
- Chat-style task input UI
- Structured task extraction using OpenAI API
- Priority matrix buckets:
  - **Do Now** (high urgency + high importance)
  - **Schedule** (medium/low urgency + high importance)
  - **Quick Task** (high urgency + medium/low importance)
  - **Drop** (everything else)
- Re-run analysis button
- Clear state button
- Bonus action: **What should I do now?**
- Responsive polished frontend

## Tech stack
- Node.js HTTP server for local dev
- Vercel Serverless Function for free cloud hosting
- Vanilla HTML/CSS/JavaScript frontend
- OpenAI Chat Completions API (`gpt-4o-mini` by default)

## Local setup
1. Ensure Node.js 18+ is installed.
2. Create a `.env` file in project root:

   ```bash
   OPENAI_API_KEY=your_key_here
   OPENAI_MODEL=gpt-4o-mini
   PORT=3000
   ```

3. Start the app:

   ```bash
   npm start
   ```

4. Open: `http://localhost:3000`

## Deploy for **$0** (Vercel Hobby plan)
You can host this publicly with no server cost.

1. Push this repo to your GitHub account.
2. Go to [vercel.com](https://vercel.com) and import your repo.
3. Framework preset: **Other** (no build command needed).
4. Add environment variable in Vercel project settings:
   - `OPENAI_API_KEY` = your OpenAI API key
   - Optional: `OPENAI_MODEL=gpt-4o-mini`
5. Click **Deploy**.
6. You get a live URL like `https://your-app.vercel.app`.

> Important: hosting is free on Vercel, but OpenAI API usage is billed by OpenAI according to your account usage.


## UX workflow
1. **Capture**: user enters raw natural-language tasks in chat input.
2. **Analyze**: AI converts tasks into structured objects with urgency, importance, and estimated time.
3. **Act**: app shows metrics, Eisenhower quadrants, detailed board, and “What should I do now?” recommendation.

## API contract
### `POST /api/analyze`
**Request**
```json
{ "input": "Send proposal, gym, follow up client, prepare pitch deck" }
```

**Response**
```json
{
  "tasks": [
    {
      "task": "Send proposal",
      "urgency": "high",
      "importance": "high",
      "estimated_time_minutes": 45,
      "priority_bucket": "Do Now"
    }
  ]
}
```

## Production notes
- Server validates and normalizes model output before returning it.
- Static files are served with path traversal protection in local server mode.
- Request body size is limited in local server mode to reduce abuse risk.
