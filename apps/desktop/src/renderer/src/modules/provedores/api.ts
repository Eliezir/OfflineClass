import {
  criaProvedorSchema,
  provedorListSchema,
  provedorSchema,
  tipoProvedorListSchema,
  type CriaProvedorInput,
  type Provedor,
  type TipoProvedor
} from './schemas'

const configuredApiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const API_BASE_URL =
  configuredApiUrl ?? (window.location.protocol === 'file:' ? 'http://localhost:8080' : '')
const REQUEST_TIMEOUT_MS = 10_000

type ErrorResponse = {
  erro?: string
  mensagens?: string[]
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const signal = AbortSignal.timeout(REQUEST_TIMEOUT_MS)

  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw new ApiError(
        'O backend demorou para responder. Verifique se ele esta em execucao e tente novamente.',
        0
      )
    }

    throw new ApiError(
      'Nao foi possivel conectar ao backend. Verifique se ele esta em execucao e tente novamente.',
      0
    )
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type')
  const isJson = contentType?.includes('application/json')
  const payload = isJson ? ((await response.json()) as ErrorResponse | null) : null

  if (!response.ok) {
    const message =
      payload?.mensagens?.join(' ') || payload?.erro || 'Nao foi possivel concluir a solicitacao.'
    throw new ApiError(message, response.status)
  }

  if (!isJson || payload === null) {
    throw new ApiError(
      'O backend retornou uma resposta invalida. Verifique se ele esta em execucao na porta 8080.',
      response.status
    )
  }

  return payload
}

export async function listarProvedores(): Promise<Provedor[]> {
  const response = await apiFetch('/api/provedores')
  return provedorListSchema.parse(await parseResponse(response))
}

export async function listarTiposProvedor(): Promise<TipoProvedor[]> {
  const response = await apiFetch('/api/provedores/tipos')
  return tipoProvedorListSchema.parse(await parseResponse(response))
}

export async function criarProvedor(input: CriaProvedorInput): Promise<Provedor> {
  const payload = criaProvedorSchema.parse(input)
  const response = await apiFetch('/api/provedores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  return provedorSchema.parse(await parseResponse(response))
}
