# Project instructions

## Current project state

This is a Next.js 16 App Router / React 19 / TypeScript / Tailwind CSS 4 project.
Git is initialized with origin https://github.com/hyeok-747-del/local-signal.git
and uses the main branch. Vercel project is pdh7/local-signal-pdh at
https://local-signal-pdh.vercel.app. See DEPLOYMENT.md for environment sync.
`src/app/page.tsx` renders `src/components/dashboard.tsx`; `src/lib` holds shared
contracts and data helpers. Server integrations live in `src/lib/server` and
are imported only by `src/app/api/*/route.ts`. Never import them in client code.
Use npm with the tracked package-lock.json. See README.md for setup.
NAVER integrations use NAVER API HUB, not legacy Developers endpoints.
See NAVER_API_HUB.md for server env names and official authentication headers.
Stage 3 analysis is in src/lib/blog-analysis.ts and discoveries.ts, with UI in
blog-analysis-panel.tsx / blog-activity.tsx. Date windows use Asia/Seoul days;
never equate incomplete search samples with total marketing activity.
Stage 4 UI is in keyword-panel/review-panel/event-panel/report-panel.tsx.
Shared analysis is in reviews.ts, events.ts and report.ts. PDF uses pdf-lib with
the OFL font in public/fonts; keep full font embedding (subset caused missing
Korean glyphs in visual QA). AI/server keys and models are server-only env.
The rounded yellow/cream theme is src/app/theme.css, loaded after globals.css.
Vercel uses DATA_API_KEY as server Secret alias for local PUBLIC_DATA_API_KEY.
Maps use Kakao Maps Web SDK with NEXT_PUBLIC_KAKAO_MAP_KEY. See
KAKAO_MAP_SETUP.md. Use maps.load(autoload=false), setBounds and relayout;
Kakao event.removeListener requires target/event/handler, not a returned handle.

## Working in this workspace

- Inspect source files, project documentation, dependency manifests, lockfiles,
  and task or CI configuration before choosing tools or commands.
- Use PowerShell-compatible commands in the current Windows environment. Quote
  paths containing spaces and avoid assuming Bash utilities are installed.
- Once code exists, follow its established structure and conventions. Keep
  changes focused on the requested task.
- Follow the five stages in PROJECT_SPEC.md. Stop after each stage and wait for
  user approval. Record completion and verification limits in PROGRESS.md.
- Keep real provider data separate from explicit DEMO data. Never create missing
  metrics, coordinates, reviews, or AI results. Store secrets only in server env.

## Validation

- PowerShell: `npm.cmd install`, `npm.cmd run dev`, `npm.cmd test`,
  `npm.cmd run typecheck`, `npm.cmd run build`. Build after every stage.
- Tests use Node test runner via tsx, jsdom and Testing Library. Mock provider
  fixtures are test-only; they do not establish successful real API access.
- Check API missing-key responses and never report unexecuted checks as passing.
- Browser visual QA and real-key API checks must be reported separately from
  DOM unit tests. No lint command is currently configured.

## Maintaining these instructions

- Replace the initial-state description when source code is added. Document
  verified entry points, important directories, setup steps, and working
  validation commands at that time.
- Keep instructions concise and actionable. Add directory-specific guidance
  only when real code requires distinct conventions.
- Keep this file as the shared project guidance rather than introducing
  competing copies of the same rules.

Format reference: [VS Code custom instructions](https://code.visualstudio.com/docs/agent-customization/custom-instructions).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
