import { useEffect, useState } from 'react'
import type { AvatarConfig } from '@offlineclass/shared'

import { AvatarBuilder } from './AvatarBuilder'

export interface AvatarEditorModalProps {
  /** Avatar to start editing from. Captured once on mount as a local draft. */
  value: AvatarConfig
  /** Called with the edited avatar when the user taps "Concluir". */
  onSave: (next: AvatarConfig) => void
  /** Called when the user dismisses (X, backdrop, Escape) — edits discarded. */
  onClose: () => void
}

/**
 * Full-screen takeover that wraps the {@link AvatarBuilder}. Edits live in a
 * local draft and only reach the caller via `onSave`, so dismissing (X or
 * Escape) discards them. Mount it conditionally so the draft is re-seeded from
 * `value` each time it opens. Shared by the student join flow and the teacher
 * profile.
 */
export function AvatarEditorModal({ value, onSave, onClose }: AvatarEditorModalProps): React.JSX.Element {
  const [draft, setDraft] = useState<AvatarConfig>(value)

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="bg-background fixed inset-0 z-50 overflow-hidden">
      <AvatarBuilder
        value={draft}
        onChange={setDraft}
        onDone={() => {
          onSave(draft)
          onClose()
        }}
        onClose={onClose}
      />
    </div>
  )
}
