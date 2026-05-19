import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  DiscoveryStatus,
  Exam,
  ExamInput,
  ExamSummary,
  ExamUpdate,
  LoginInput,
  Question,
  QuestionInput,
  RegisterInput,
  Teacher
} from '@offlineclass/shared'

const api = {
  discovery: {
    getStatus: (): Promise<DiscoveryStatus> => ipcRenderer.invoke('discovery.getStatus')
  },
  auth: {
    register: (input: RegisterInput): Promise<Teacher> => ipcRenderer.invoke('auth.register', input),
    login: (input: LoginInput): Promise<Teacher> => ipcRenderer.invoke('auth.login', input),
    me: (): Promise<Teacher | null> => ipcRenderer.invoke('auth.me'),
    logout: (): Promise<null> => ipcRenderer.invoke('auth.logout')
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
  }
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
  // @ts-ignore (defined in dts)
  window.electron = electronAPI
  // @ts-ignore (defined in dts)
  window.api = api
}
