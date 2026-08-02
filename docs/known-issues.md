# Known Issues

## Native module ABI mismatch after installing the CLI globally

### Symptoms

Starting `cloudy` can fail with `ERR_DLOPEN_FAILED` and a message that
`better-sqlite3` was compiled against a different `NODE_MODULE_VERSION`.

### Cause

`better-sqlite3` is a native Node.js module. Its binary is installed or compiled
for the Node.js version active when the global CLI is installed. The error occurs
when `cloudy` later runs with a Node.js version that has a different ABI.

### Workaround

Use the same Node.js version for installation and execution, then reinstall the
CLI or rebuild the native dependency:

```sh
node -v
pnpm rebuild -g better-sqlite3
```

With `fnm`, select the intended version before reinstalling or running Cloudy:

```sh
fnm use <version>
fnm default <version>
node -v
```

### Follow-up

Review this limitation when changing Cloudy's packaging or runtime strategy.
