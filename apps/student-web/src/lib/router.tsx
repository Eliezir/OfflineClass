import { createBrowserRouter, Navigate } from 'react-router-dom'

import DoneRoute from '../routes/Done'
import JoinRoute from '../routes/Join'
import TestRoute from '../routes/Test'
import WaitingRoute from '../routes/Waiting'

export const router = createBrowserRouter([
  { path: '/', element: <JoinRoute /> },
  { path: '/waiting', element: <WaitingRoute /> },
  { path: '/test', element: <TestRoute /> },
  { path: '/done', element: <DoneRoute /> },
  { path: '*', element: <Navigate to="/" replace /> }
])
