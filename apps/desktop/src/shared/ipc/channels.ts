export const IPC = {
  APP: {
    GET_VERSION: 'app:get-version'
  },
  WINDOW: {
    MINIMIZE: 'window:minimize',
    MAXIMIZE_TOGGLE: 'window:maximize-toggle',
    CLOSE: 'window:close',
    IS_MAXIMIZED: 'window:is-maximized',
    /* main → renderer push when the OS maximize state changes (snap, double-click, etc.) */
    MAXIMIZE_CHANGED: 'window:maximize-changed'
  },
  BACKEND: {
    /* main → splash push describing the backend boot phase (starting/ready/error) */
    STATUS: 'backend:status',
    /* splash → main: retry the boot after a failed startup */
    RETRY: 'backend:retry',
    /* splash → main: give up and quit the app */
    QUIT: 'backend:quit'
  }
} as const
