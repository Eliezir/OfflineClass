import { useEffect, useState } from 'react'
import type { AvatarConfig } from '@offlineclass/shared'

import { AvatarBuilder } from './AvatarBuilder'

export interface AvatarEditorModalProps {
  /** Avatar to start editing from. Captured once on mount as a local draft. */
  value: AvatarConfig
  /** Called with the edited avatar when the student taps "Concluir". */
  onSave: (next: AvatarConfig) => void
  /** Called when the student dismisses (X, backdrop, Escape) — edits discarded. */
  onClose: () => void
}

/**
 * Full-screen overlay that wraps the {@link AvatarBuilder} for the student join
 * flow. Edits live in a local draft and only reach the parent via `onSave`, so
 * dismissing the modal discards them. Mount it conditionally so the draft is
 * re-seeded from `value` each time it opens.
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
