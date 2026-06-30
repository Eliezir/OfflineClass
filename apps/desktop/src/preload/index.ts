import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  IpcBridge,
  IpcChannel,
  IpcEventChannel,
  IpcEventPayload,
  IpcInput,
  IpcOutput
} from '@shared/ipc/contract'
import type {
  AvatarConfig,
  DiscoveryStatus,
  Exam,
  ExamInput,
  ExamSummary,
  ExamUpdate,
  GradeAnswerInput,
  LoginInput,
  Question,
  QuestionInput,
  RegisterInput,
  SessionAnswersReview,
  SessionCreateInput,
  SessionDetail,
  SessionResultSummary,
  SessionSummary,
  Teacher,
  GroupPublic
} from '@offlineclass/shared'

/** Generic typed bridge — window chrome + app meta (Zod-validated contract). */
const bridge: IpcBridge = {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcInput<C> extends undefined ? [] : [input: IpcInput<C>]
  ): Promise<IpcOutput<C>> {
    return ipcRenderer.invoke(channel, args[0]) as Promise<IpcOutput<C>>
  },
  on<C extends IpcEventChannel>(channel: C, listener: (payload: IpcEventPayload<C>) => void) {
    const handler = (_event: IpcRendererEvent, payload: IpcEventPayload<C>): void =>
      listener(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

/** Teacher domain (string channels → main-process handlers). */
const domain = {
  discovery: {
    getStatus: (): Promise<DiscoveryStatus> => ipcRenderer.invoke('discovery.getStatus')
  },
  auth: {
    register: (input: RegisterInput): Promise<Teacher> =>
      ipcRenderer.invoke('auth.register', input),
    login: (input: LoginInput): Promise<Teacher> => ipcRenderer.invoke('auth.login', input),
    me: (): Promise<Teacher | null> => ipcRenderer.invoke('auth.me'),
    updateAvatar: (avatar: AvatarConfig | null): Promise<Teacher> =>
      ipcRenderer.invoke('auth.updateAvatar', avatar),
    logout: (): Promise<null> => ipcRenderer.invoke('auth.logout'),
    getToken: (): Promise<string | null> => ipcRenderer.invoke('auth.getToken')
  },
  exams: {
    list: (): Promise<ExamSummary[]> => ipcRenderer.invoke('exams.list'),
    get: (id: string): Promise<Exam> => ipcRenderer.invoke('exams.get', id),
    create: (input: ExamInput): Promise<Exam> => ipcRenderer.invoke('exams.create', input),
    update: (id: string, patch: ExamUpdate): Promise<Exam> =>
      ipcRenderer.invoke('exams.update', id, patch),
    delete: (id: string): Promise<null> => ipcRenderer.invoke('exams.delete', id),
    duplicate: (id: string): Promise<Exam> => ipcRenderer.invoke('exams.duplicate', id)
  },
  questions: {
    add: (examId: string, input: QuestionInput): Promise<Question> =>
      ipcRenderer.invoke('questions.add', examId, input),
    update: (id: string, input: QuestionInput): Promise<Question> =>
      ipcRenderer.invoke('questions.update', id, input),
    delete: (id: string): Promise<null> => ipcRenderer.invoke('questions.delete', id),
    reorder: (examId: string, orderedIds: string[]): Promise<Question[]> =>
      ipcRenderer.invoke('questions.reorder', examId, orderedIds)
  },
  sessions: {
    list: (): Promise<SessionSummary[]> => ipcRenderer.invoke('sessions.list'),
    create: (input: SessionCreateInput): Promise<SessionDetail> =>
      ipcRenderer.invoke('sessions.create', input),
    get: (id: string): Promise<SessionDetail> => ipcRenderer.invoke('sessions.get', id),
    active: (): Promise<SessionDetail | null> => ipcRenderer.invoke('sessions.active'),
    recentResults: (): Promise<SessionResultSummary[]> =>
      ipcRenderer.invoke('sessions.recentResults'),
    start: (id: string): Promise<SessionDetail> => ipcRenderer.invoke('sessions.start', id),
    end: (id: string): Promise<SessionDetail> => ipcRenderer.invoke('sessions.end', id),
    broadcastLobby: (id: string): Promise<null> =>
      ipcRenderer.invoke('sessions.broadcastLobby', id),
    studentAnswers: (sessionId: string, studentId: string): Promise<SessionAnswersReview> =>
      ipcRenderer.invoke('sessions.studentAnswers', sessionId, studentId),
    gradeAnswer: (sessionId: string, input: GradeAnswerInput): Promise<SessionAnswersReview> =>
      ipcRenderer.invoke('sessions.gradeAnswer', sessionId, input),
    createGroup: (sessionId: string, name: string, studentId: string): Promise<GroupPublic> =>
      ipcRenderer.invoke('sessions.createGroup', sessionId, name, studentId),
    joinGroup: (groupId: string, studentId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.joinGroup', groupId, studentId),
    leaveGroup: (groupId: string, studentId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.leaveGroup', groupId, studentId),
    deleteGroup: (groupId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.deleteGroup', groupId),
    kickStudent: (sessionId: string, studentId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.kickStudent', sessionId, studentId),
    getGroupYjsSnapshot: (groupId: string): Promise<Uint8Array> =>
      ipcRenderer.invoke('sessions.getGroupYjsSnapshot', groupId),
    subscribeGroupYjs: (groupId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.subscribeGroupYjs', groupId),
    unsubscribeGroupYjs: (groupId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.unsubscribeGroupYjs', groupId),
    onGroupYjsUpdate: (handler: (groupId: string, update: Uint8Array) => void): (() => void) => {
      const listener = (_e: IpcRendererEvent, groupId: string, update: Uint8Array): void =>
        handler(groupId, update)
      ipcRenderer.on('group.yjs.update', listener)
      return () => ipcRenderer.removeListener('group.yjs.update', listener)
    },
    subscribeGroupAwareness: (groupId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.subscribeGroupAwareness', groupId),
    unsubscribeGroupAwareness: (groupId: string): Promise<void> =>
      ipcRenderer.invoke('sessions.unsubscribeGroupAwareness', groupId),
    onGroupAwarenessUpdate: (handler: (groupId: string, encoded: Uint8Array) => void): (() => void) => {
      const listener = (_e: IpcRendererEvent, groupId: string, encoded: Uint8Array): void =>
        handler(groupId, encoded)
      ipcRenderer.on('group.awareness.update', listener)
      return () => ipcRenderer.removeListener('group.awareness.update', listener)
    }
  }
}

const api = {
  ...bridge,
  ...domain,
  print: (): Promise<void> => ipcRenderer.invoke('sessions.print'),
  exportPdf: (): Promise<string | null> => ipcRenderer.invoke('sessions.exportPdf')
}
export type ApiSurface = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (defined in index.d.ts)
  window.electron = electronAPI
  // @ts-ignore (defined in index.d.ts)
  window.api = api
}
