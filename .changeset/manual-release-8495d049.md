---
'test-anywhere': minor
---

Improve code maintainability and CI testing coverage

- Convert shell scripts to mjs for better maintainability and cross-platform compatibility
- Add comprehensive CI testing matrix: 3 runtimes (Node.js, Bun, Deno) across 3 operating systems (Ubuntu, macOS, Windows)
- Add CI/CD status badge to README
- Extract complex shell logic from husky hooks and GitHub workflows into dedicated mjs scripts
- Improve error handling and debugging capabilities in automation scripts
