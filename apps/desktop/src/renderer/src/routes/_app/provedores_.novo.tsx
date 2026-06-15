import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ProvedorForm } from '@renderer/modules/provedores/components/provedor-form'
import { Button } from '@renderer/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/shared/ui/card'

export const Route = createFileRoute('/_app/provedores_/novo')({
  component: NovoProvedorPage
})

function NovoProvedorPage(): React.JSX.Element {
  return (
    <main className="flex-1 overflow-y-auto px-6 py-6">
      <header className="mb-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-3">
          <Link to="/provedores">
            <ArrowLeft />
            Voltar para provedores
          </Link>
        </Button>
        <h1 className="font-display text-2xl font-bold tracking-tight">Cadastrar provedor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Adicione uma conexao para disponibilizar novos modelos no aplicativo.
        </p>
      </header>

      <div className="grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Card className="hover:translate-y-0 hover:shadow-[var(--edge-soft),0_1px_2px_rgb(0_0_0_/_0.04),0_4px_12px_-4px_rgb(0_0_0_/_0.06)]">
          <CardHeader>
            <CardTitle>Dados da conexao</CardTitle>
            <CardDescription>Os campos serao validados antes do envio.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProvedorForm />
          </CardContent>
        </Card>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-border bg-primary-soft p-4 text-primary-soft-foreground">
            <ShieldCheck className="mb-3 size-5" />
            <h2 className="font-display text-sm font-semibold">Segredo protegido</h2>
            <p className="mt-1 text-xs leading-relaxed">
              A API key e enviada ao backend apenas no cadastro e armazenada de forma criptografada.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/50 p-4">
            <KeyRound className="mb-3 size-5 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold">Antes de continuar</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Confirme que a chave possui permissao apenas para os recursos necessarios.
            </p>
          </div>
        </aside>
      </div>
    </main>
  )
}
