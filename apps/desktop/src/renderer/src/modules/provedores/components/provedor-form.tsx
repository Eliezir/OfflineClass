import { useState } from 'react'
import { Eye, EyeOff, LoaderCircle, Save } from 'lucide-react'
import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@renderer/shared/ui/button'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { criaProvedorSchema, type CriaProvedorInput } from '../schemas'
import { useCriarProvedorMutation, useTiposProvedorQuery } from '../queries'

function fieldError(errors: unknown[]): string | undefined {
  const error = errors[0]
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) return String(error.message)
  return undefined
}

export function ProvedorForm(): React.JSX.Element {
  const [showApiKey, setShowApiKey] = useState(false)
  const navigate = useNavigate()
  const mutation = useCriarProvedorMutation()
  const tipos = useTiposProvedorQuery()
  const form = useForm({
    defaultValues: {
      nome: '',
      apiKey: '',
      tipoProvedorId: 0
    } satisfies CriaProvedorInput,
    validators: {
      onSubmit: criaProvedorSchema
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
      await navigate({ to: '/provedores' })
    }
  })

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="nome">
        {(field) => {
          const error = fieldError(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Nome do provedor</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="Ex.: OpenAI principal"
                autoComplete="off"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${field.name}-error` : undefined}
              />
              {error && (
                <p id={`${field.name}-error`} className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="tipoProvedorId">
        {(field) => {
          const error = fieldError(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Tipo de provedor</Label>
              <select
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(Number(event.target.value))}
                disabled={tipos.isPending || tipos.isError || tipos.data?.length === 0}
                className="h-9 w-full rounded-[10px] border border-input-border bg-input px-3 text-sm shadow-[var(--edge-soft)] outline-none transition-[box-shadow,border-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={Boolean(error)}
                aria-describedby={`${field.name}-help${error ? ` ${field.name}-error` : ''}`}
              >
                <option value={0}>
                  {tipos.isPending ? 'Carregando tipos...' : 'Selecione um tipo'}
                </option>
                {tipos.data?.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
              <p id={`${field.name}-help`} className="text-xs text-muted-foreground">
                {tipos.isError
                  ? `Nao foi possivel carregar os tipos: ${tipos.error.message}`
                  : tipos.data?.length === 0
                    ? 'Nenhum tipo de provedor esta disponivel.'
                    : 'Escolha o servico que sera conectado.'}
              </p>
              {error && (
                <p id={`${field.name}-error`} className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      <form.Field name="apiKey">
        {(field) => {
          const error = fieldError(field.state.meta.errors)
          return (
            <div className="space-y-2">
              <Label htmlFor={field.name}>API key</Label>
              <div className="relative">
                <Input
                  id={field.name}
                  name={field.name}
                  type={showApiKey ? 'text' : 'password'}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Cole a chave fornecida pelo provedor"
                  autoComplete="new-password"
                  className="pr-10"
                  aria-invalid={Boolean(error)}
                  aria-describedby={`${field.name}-help${error ? ` ${field.name}-error` : ''}`}
                />
                <button
                  type="button"
                  className="absolute right-1 top-1 grid size-7 place-items-center rounded-[8px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setShowApiKey((visible) => !visible)}
                  aria-label={showApiKey ? 'Ocultar API key' : 'Mostrar API key'}
                >
                  {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <p id={`${field.name}-help`} className="text-xs text-muted-foreground">
                A chave sera criptografada pelo backend e nao aparecera novamente.
              </p>
              {error && (
                <p id={`${field.name}-error`} className="text-xs text-destructive">
                  {error}
                </p>
              )}
            </div>
          )
        }}
      </form.Field>

      {mutation.error && (
        <div
          role="alert"
          className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {mutation.error.message}
        </div>
      )}

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void navigate({ to: '/provedores' })}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit || isSubmitting || mutation.isPending}>
              {isSubmitting || mutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <Save />
              )}
              {isSubmitting || mutation.isPending ? 'Salvando...' : 'Salvar provedor'}
            </Button>
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
