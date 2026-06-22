import { createHashRouter, Navigate } from 'react-router-dom'

import { AppLayout } from '../components/AppLayout'
import DiscoverRoute from '../routes/Discover'
import JoinRoute from '../routes/Join'
import WaitingRoute from '../routes/Waiting'
import TestRoute from '../routes/Test'
import DoneRoute from '../routes/Done'
import EndedRoute from '../routes/Ended'

export const router = createHashRouter([
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <DiscoverRoute /> },
      { path: '/join', element: <JoinRoute /> },
      { path: '/waiting', element: <WaitingRoute /> },
      { path: '/test', element: <TestRoute /> },
      { path: '/done', element: <DoneRoute /> },
      { path: '/ended', element: <EndedRoute /> },
      { path: '*', element: <Navigate to="/" replace /> }
    ]
  }
])
