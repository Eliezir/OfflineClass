import { createHashHistory, createRouter } from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

// Packaged Electron windows load the renderer from a file:// URL. Browser
// history treats the on-disk index.html path as the route and can leave the
// application with no match (a white window). Hash history keeps every route
// after `#`, so it behaves consistently in development and packaged builds.
export const router = createRouter({ routeTree, history: createHashHistory() })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
