import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema.ts'

const url = process.env['CONNECTOR_DATABASE_URL']
if (!url) throw new Error('CONNECTOR_DATABASE_URL env var is required')

const client = postgres(url)
export const db = drizzle(client, { schema })
export type Db = typeof db
