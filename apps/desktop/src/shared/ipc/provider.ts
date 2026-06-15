import { z } from 'zod'

export const ProviderIdSchema = z.enum(['mock', 'claude-code'])

export const ProviderCheckInputSchema = z.object({
  providerId: ProviderIdSchema
})

/** Result of probing a provider for local availability. `claude-code` is only
    `ok` when the SDK can spawn and the user's Claude Code login is valid. */
export const ProviderCheckOutputSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), model: z.string() }),
  z.object({ ok: z.literal(false), message: z.string() })
])

export const ProviderSaveInputSchema = z.object({
  providerId: ProviderIdSchema
})

/** No secret crosses the boundary — Claude Code holds its own credentials, so
    we only persist which provider is the default. */
export const ProviderSaveOutputSchema = z.object({
  providerId: ProviderIdSchema,
  isDefault: z.boolean()
})
