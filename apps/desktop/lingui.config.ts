import { defineConfig } from '@lingui/conf'
import { formatter } from '@lingui/format-po'

// Locales devem espelhar `src/renderer/src/shared/i18n/locales.ts`.
// (A config do Lingui não pode importar de `src/`, então a lista é duplicada aqui.)
export default defineConfig({
  locales: ['pt-BR', 'en'],
  sourceLocale: 'pt-BR',
  catalogs: [
    {
      path: '<rootDir>/src/renderer/src/locales/{locale}',
      include: ['src/renderer/src'],
      exclude: ['**/locales/**', '**/*.d.ts', '**/routeTree.gen.ts']
    }
  ],
  // Sem comentários de origem (arquivo:linha) — mantém os diffs dos .po limpos,
  // o que é essencial para a checagem "catálogos atualizados" no CI.
  format: formatter({ origins: false, lineNumbers: false })
})
