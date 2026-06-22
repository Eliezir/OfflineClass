import {
  AnswerInput,
  type GroupPublic,
  JoinInput,
  JoinResult,
  SessionPublic,
  StudentExam,
  StudentSessionState
} from '@offlineclass/shared'

import { loadToken } from './session'

/** Creates an API client that targets a specific teacher server URL.
 *  When baseUrl is null (browser served from teacher origin), relative
 *  paths are used (same-origin). When baseUrl is set (standalone Electron),
 *  absolute URLs are constructed. */
export function createApi(baseUrl: string | null) {
  const resolve = (path: string): string =>
    baseUrl ? `${baseUrl}${path}` : path

  async function jsonRequest<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: unknown,
    auth = true
  ): Promise<T> {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['content-type'] = 'application/json'
    if (auth) {
      const token = loadToken()
      if (token) headers['authorization'] = `Bearer ${token}`
    }
    const res = await fetch(resolve(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const payload = (await res.json()) as { message?: string; error?: string }
        message = payload.message ?? payload.error ?? message
      } catch {
        // body wasn't JSON
      }
      const err = new Error(message) as Error & { status?: number }
      err.status = res.status
      throw err
    }
    return (await res.json()) as T
  }

  return {
    sessionActive: async () =>
      SessionPublic.parse(await jsonRequest('GET', '/api/session/active', undefined, false)),
    join: async (input: JoinInput) =>
      JoinResult.parse(await jsonRequest('POST', '/api/join', input, false)),
    me: async () =>
      StudentSessionState.parse(await jsonRequest('GET', '/api/session/me')),
    exam: async () =>
      StudentExam.parse(await jsonRequest('GET', '/api/exam/current')),
    heartbeat: async () => {
      await jsonRequest('POST', '/api/heartbeat')
    },
    answer: async (input: AnswerInput) => {
      await jsonRequest('POST', '/api/answers', input)
    },
    submit: async () => {
      await jsonRequest('POST', '/api/submit')
    },
    leave: async () => {
      await jsonRequest('POST', '/api/leave')
    },
    groups: {
      list: async () =>
        (await jsonRequest<GroupPublic[]>('GET', '/api/groups')),
      create: async (name: string) =>
        jsonRequest<GroupPublic>('POST', '/api/groups', { name }),
      join: async (groupId: string) =>
        jsonRequest<{ ok: boolean }>('POST', `/api/groups/${groupId}/join`),
      leave: async (groupId: string) =>
        jsonRequest<{ ok: boolean }>('POST', `/api/groups/${groupId}/leave`)
    }
  }
}

export type Api = ReturnType<typeof createApi>
