# Personal AI Assistant MVP

A production-style personal assistant that accepts natural-language daily tasks, structures them with OpenAI, and auto-classifies each task into an Eisenhower priority matrix.

## Features
- Chat-style task input UI
- Structured task extraction using OpenAI API
- Priority matrix buckets:
  - **Do Now** (high urgency + high importance)
  - **Schedule** (low urgency + high importance)
  - **Quick Task** (high urgency + low importance)
  - **Drop** (everything else)
- Re-run analysis button
- Clear state button
- Bonus action: **What should I do now?**
- Overwhelm Rescue mode for a 3-step calming action plan
- Optional 15-minute focus reminders
- Responsive polished frontend

## Tech stack
- Node.js HTTP server (no external dependencies required)
- Vanilla HTML/CSS/JavaScript frontend
- OpenAI Chat Completions API (`gpt-4o-mini` by default)

## Setup
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


## What I need from you to get this live
1. **Hosting target**: choose where to deploy (Render, Railway, Fly.io, AWS, etc.).
2. **Production OpenAI key**: a live `OPENAI_API_KEY` (and optional `OPENAI_MODEL`).
3. **Production domain**: either a custom domain or a temporary provider URL.
4. **Basic limits policy**: acceptable max request volume/cost per day so we can add simple rate limiting rules.
5. **Ops preference**: where you want logs/alerts (provider dashboard is fine to start).

## Go-live checklist
- Set required environment variables on the host:
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL` (optional, default is `gpt-4o-mini`)
  - `PORT` (usually injected by host)
- Deploy service as a long-running Node process (`npm start`).
- Verify health endpoint: `GET /healthz` should return `{ status: "ok", ... }`.
- Smoke test the app:
  - Open `/`
  - Submit sample task input
  - Confirm `/api/analyze` returns structured tasks
- Add a restart policy and enable provider TLS/domain routing.
- (Recommended) Add rate limiting + API key rotation policy before broad sharing.

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
- Static files are served with path traversal protection.
- Request body size is limited to reduce abuse risk.

