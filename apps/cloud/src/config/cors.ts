import { cors } from 'hono/cors'

const localhost = /^http:\/\/localhost(:\d+)?$/

export const corsMiddleware = cors({
  origin: (origin) => {
    if (!origin || origin === 'null') return origin || '*'
    return localhost.test(origin) ? origin : null
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['*'],
  credentials: false
})
