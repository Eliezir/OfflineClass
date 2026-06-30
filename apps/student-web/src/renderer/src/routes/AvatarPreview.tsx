import { useState } from 'react'
import { AvatarBuilder, randomAvatar } from '@offlineclass/avatar'
import type { AvatarConfig } from '@offlineclass/shared'

/**
 * Dev-only preview route (#/avatar) for screenshotting the avatar editor in the
 * browser, framed exactly like the in-app modal. Not part of the student flow.
 */
export default function AvatarPreviewRoute(): React.JSX.Element {
  const [avatar, setAvatar] = useState<AvatarConfig>(() => randomAvatar())
  return (
    <div className="bg-foreground/40 flex flex-1 items-center justify-center p-6 sm:p-8">
      <div className="border-border bg-background relative h-[80vh] max-h-[620px] w-full max-w-3xl overflow-hidden rounded-3xl border shadow-lg">
        <AvatarBuilder
          value={avatar}
          onChange={setAvatar}
          onDone={() => undefined}
          onClose={() => undefined}
        />
      </div>
    </div>
  )
}
