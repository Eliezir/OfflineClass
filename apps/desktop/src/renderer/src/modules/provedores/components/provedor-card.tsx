import { CalendarDays, KeyRound, PlugZap } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@renderer/shared/ui/card'
import type { Provedor } from '../schemas'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

export function ProvedorCard({ provedor }: { provedor: Provedor }): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <div className="mb-2 grid size-10 place-items-center rounded-[10px] bg-primary-soft text-primary-soft-foreground">
          <PlugZap className="size-5" />
        </div>
        <CardTitle>{provedor.nome}</CardTitle>
        <CardDescription>Provedor #{provedor.tipoProvedorId}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 rounded-[10px] border border-border bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          <KeyRound className="size-4 text-success" />
          API key armazenada com seguranca
        </div>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        <CalendarDays className="mr-1.5 size-3.5" />
        Cadastrado em {dateFormatter.format(provedor.createdAt)}
      </CardFooter>
    </Card>
  )
}
