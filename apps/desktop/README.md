# frontend

An Electron application with React and TypeScript.

## Stack

- **Runtime:** Electron + electron-vite (main / preload / renderer split)
- **UI:** React 19, TypeScript, Tailwind CSS v4
- **Components:** shadcn/ui (new-york style), lucide-react icons
- **Routing:** TanStack Router (file-based, auto code-splitting)
- **Data:** TanStack Query
- **Forms & validation:** TanStack Form + Zod
- **Editor:** Monaco (`@monaco-editor/react`)
- **Tooling:** pnpm, ESLint, Prettier, electron-builder

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ pnpm install
```

### Development

```bash
$ pnpm dev
```

### Build

```bash
# For windows
$ pnpm build:win

# For macOS
$ pnpm build:mac

# For Linux
$ pnpm build:linux
```
