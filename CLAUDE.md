# CLAUDE.md — Project Instructions for Claude Code

## Package Manager

**Always use `pnpm`.** Never use `npm` or `yarn`.

- Install: `pnpm install` / `pnpm add <pkg>`
- Dev dependency: `pnpm add -D <pkg>`
- Run scripts: `pnpm run <script>`
- Never run `npm install`, `npm ci`, or `npx` — use `pnpm dlx` instead of `npx`

If a `package-lock.json` appears, delete it — only `pnpm-lock.yaml` should exist.
