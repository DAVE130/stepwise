# StepWise

StepWise helps neurodivergent students break overwhelming assignments into small, ordered steps—one task at a time. Paste or upload an assignment, get a clear plan, check your understanding as you go, and ask for a fresh explanation when you're stuck.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [Ollama](https://ollama.com/) installed and running (for local development)
- Gemma model pulled locally: `gemma3:27b`

## Setup (local development)

```bash
git clone https://github.com/DAVE130/stepwise.git
cd stepwise
npm install
cp .env.example .env.local
ollama pull gemma3:27b
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and adjust as needed:

| Variable | Description |
|----------|-------------|
| `OLLAMA_URL` | Ollama server base URL (default: `http://localhost:11434`) |
| `TOGETHER_API_KEY` | Together AI API key (optional locally; required for Vercel) |

**Local development:** Leave `TOGETHER_API_KEY` unset (or use the placeholder) and the app uses **Ollama** with `gemma3:27b`.

**Vercel deployment:** Set `TOGETHER_API_KEY` in your Vercel project environment variables. The app will use **Together AI** at `https://api.together.xyz/v1/chat/completions` with model `google/gemma-3-27b-it`. Ollama is not available on Vercel serverless functions.

### Together AI setup (Vercel)

1. Create an account at [Together AI](https://www.together.ai/).
2. Generate an API key from the dashboard.
3. In Vercel → Project → Settings → Environment Variables, add:
   - `TOGETHER_API_KEY` = your API key
4. Redeploy the project.

You do not need `OLLAMA_URL` on Vercel unless you proxy to a remote Ollama instance.

## How it was built

- **Next.js 14** (App Router) and **Tailwind CSS** for the UI
- **pdfjs-dist** for PDF text extraction and scanned-page rendering
- **Gemma 3 27B** via **Ollama** locally (`gemma3:27b`) or **Together AI** in production (`google/gemma-3-27b-it`)

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run start` — run production server
- `npm run lint` — run ESLint
