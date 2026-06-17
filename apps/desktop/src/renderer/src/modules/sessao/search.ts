/** Search params shared by the `/sessao` routes: `?mock` opts into the DEV
    sample data and survives navigation between the dashboard and detail page. */
export type MockSearch = { mock?: boolean }

export function parseMockSearch(search: Record<string, unknown>): MockSearch {
  const mock = search.mock === true || search.mock === 'true'
  return mock ? { mock: true } : {}
}
