import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/sessions')({
  component: SessionsPage
})

function SessionsPage(): React.JSX.Element {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Sessões</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sessões ao vivo — em construção.</p>
      </header>
    </main>
  )
}
