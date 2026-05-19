import { createHashRouter } from 'react-router-dom'

import ExamEditorRoute from '../routes/exams/Editor'
import ExamListRoute from '../routes/exams/List'
import HomeRoute from '../routes/Home'
import LoginRoute from '../routes/Login'
import RegisterRoute from '../routes/Register'
import LobbyRoute from '../routes/sessions/Lobby'
import NewSessionRoute from '../routes/sessions/New'
import { RedirectIfAuthed, RequireAuth } from './auth'

export const router = createHashRouter([
  {
    path: '/login',
    element: (
      <RedirectIfAuthed>
        <LoginRoute />
      </RedirectIfAuthed>
    )
  },
  {
    path: '/register',
    element: (
      <RedirectIfAuthed>
        <RegisterRoute />
      </RedirectIfAuthed>
    )
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <HomeRoute />
      </RequireAuth>
    )
  },
  {
    path: '/exams',
    element: (
      <RequireAuth>
        <ExamListRoute />
      </RequireAuth>
    )
  },
  {
    path: '/exams/:id',
    element: (
      <RequireAuth>
        <ExamEditorRoute />
      </RequireAuth>
    )
  },
  {
    path: '/sessions/new',
    element: (
      <RequireAuth>
        <NewSessionRoute />
      </RequireAuth>
    )
  },
  {
    path: '/sessions/:id',
    element: (
      <RequireAuth>
        <LobbyRoute />
      </RequireAuth>
    )
  }
])
