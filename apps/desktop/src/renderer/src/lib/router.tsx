import { createHashRouter } from 'react-router-dom'

import HomeRoute from '../routes/Home'
import LoginRoute from '../routes/Login'
import RegisterRoute from '../routes/Register'
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
  }
])
