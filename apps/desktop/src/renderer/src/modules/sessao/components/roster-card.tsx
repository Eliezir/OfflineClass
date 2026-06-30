import type { SessionLobbyStudent } from '../types'
import { StudentAvatar } from './student-avatar'

type RosterCardProps = {
  student: SessionLobbyStudent
}

/** One student in the lobby as a card: big avatar, name, matrícula, live dot. */
export function RosterCard({ student }: RosterCardProps): React.JSX.Element {
  return (
    <div className="border-border bg-background relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center">
      <span aria-hidden className="bg-success absolute top-2.5 right-2.5 size-2 rounded-full" />
      <StudentAvatar name={student.name} avatar={student.avatar} className="size-16" />
      <div className="w-full min-w-0">
        <div className="truncate text-sm font-bold">{student.name}</div>
        <div className="text-muted-foreground truncate text-xs font-semibold">
          {student.matricula}
        </div>
      </div>
    </div>
  )
}
