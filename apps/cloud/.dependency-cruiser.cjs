/**
 * Layering rules — the TypeScript replacement for the Java ArchUnit test.
 * Enforces the MVC flow Controller → BO → DAO → (Prisma), forbidding any
 * layer from reaching across or backwards.
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'Dependency cycles make the layering impossible to reason about.',
      severity: 'error',
      from: {},
      to: { circular: true }
    },
    {
      name: 'controller-not-to-dao',
      comment: 'Controllers must go through a BO, never straight to the DAO.',
      severity: 'error',
      from: { path: '^src/controllers' },
      to: { path: '^src/dao' }
    },
    {
      name: 'controller-not-to-prisma',
      comment: 'Controllers must not touch the persistence layer directly.',
      severity: 'error',
      from: { path: '^src/controllers' },
      to: { path: '(^src/config/prisma)|([/]@prisma[/]client)' }
    },
    {
      name: 'bo-not-to-controller',
      comment: 'Business logic must not depend on the HTTP/controller layer.',
      severity: 'error',
      from: { path: '^src/bo' },
      to: { path: '^src/controllers' }
    },
    {
      name: 'bo-not-to-prisma',
      comment: 'A BO must reach the database through its DAO, never Prisma directly.',
      severity: 'error',
      from: { path: '^src/bo' },
      to: { path: '(^src/config/prisma)|([/]@prisma[/]client)' }
    },
    {
      name: 'dao-not-to-bo',
      comment: 'DAOs are the lowest layer — they must not depend on a BO.',
      severity: 'error',
      from: { path: '^src/dao' },
      to: { path: '^src/bo' }
    },
    {
      name: 'dao-not-to-controller',
      comment: 'DAOs must not depend on the controller layer.',
      severity: 'error',
      from: { path: '^src/dao' },
      to: { path: '^src/controllers' }
    }
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      conditionNames: ['import', 'require', 'node', 'default'],
      mainFields: ['module', 'main']
    }
  }
}
