import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/home')({
  component: PreviewHomePage
})

function PreviewHomePage(): React.JSX.Element {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">Home</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Dashboard em construção.
        </p>
      </header>
    </main>
  )
}
