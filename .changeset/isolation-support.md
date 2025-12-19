---
'test-anywhere': minor
---

Add isolation support for running tests in isolated environments

This adds the `--isolated` option with five isolation modes for running tests in separate environments:

- `screen` - GNU Screen terminal multiplexer
- `tmux` - tmux terminal multiplexer
- `docker` - Docker container isolation with volume mounting
- `byobu` - Byobu terminal multiplexer wrapper
- `nohup` - Simple background execution (always detached)

Also adds `--attached` and `--detached` options for controlling session mode, with validation to prevent using both simultaneously.
