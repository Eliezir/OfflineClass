import { AlertCircle, Plus, RefreshCw, Server } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProvedorCard } from '@renderer/modules/provedores/components/provedor-card'
import { useProvedoresQuery } from '@renderer/modules/provedores/queries'
import { Button } from '@renderer/shared/ui/button'

export const Route = createFileRoute('/_app/provedores')({
  component: ProvedoresPage
})

function ProvedoresPage(): React.JSX.Element {
  const provedores = useProvedoresQuery()

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">Provedores</h1>
            {provedores.data && (
              <span className="text-sm text-muted-foreground">
                {provedores.data.length} cadastrados
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie as conexoes usadas para gerar suas apresentacoes.
          </p>
        </div>
        <Button asChild>
          <Link to="/provedores/novo">
            <Plus />
            Novo provedor
          </Link>
        </Button>
      </header>

      {provedores.isPending && <LoadingState />}

      {provedores.isError && (
        <StatePanel
          icon={AlertCircle}
          title="Nao foi possivel carregar os provedores"
          description={provedores.error.message}
        >
          <Button variant="outline" onClick={() => void provedores.refetch()}>
            <RefreshCw />
            Tentar novamente
          </Button>
        </StatePanel>
      )}

      {provedores.data?.length === 0 && (
        <StatePanel
          icon={Server}
          title="Nenhum provedor cadastrado"
          description="Cadastre sua primeira conexao para usar um modelo externo."
        >
          <Button asChild>
            <Link to="/provedores/novo">
              <Plus />
              Cadastrar provedor
            </Link>
          </Button>
        </StatePanel>
      )}

      {provedores.data && provedores.data.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {provedores.data.map((provedor) => (
            <ProvedorCard key={provedor.id} provedor={provedor} />
          ))}
        </div>
      )}
    </main>
  )
}

function LoadingState(): React.JSX.Element {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label="Carregando provedores">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="h-56 animate-pulse rounded-2xl border border-border bg-muted/60"
        />
      ))}
    </div>
  )
}

function StatePanel({
  icon: Icon,
  title,
  description,
  children
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 text-center">
      <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
        <Icon className="size-6" />
      </div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mb-5 mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  )
}
