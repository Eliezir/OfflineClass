import { useMemo } from 'react'
import CodeMirror, { type Extension } from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { java } from '@codemirror/lang-java'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import type { CodeLanguage } from '@offlineclass/shared'

import { useThemeContext } from '@renderer/shared/hooks/theme-context'
import { cn } from '@renderer/shared/utils'

function languageExtension(language: CodeLanguage): Extension[] {
  switch (language) {
    case 'javascript':
      return [javascript()]
    case 'python':
      return [python()]
    case 'c':
    case 'cpp':
      return [cpp()]
    case 'java':
      return [java()]
    case 'sql':
      return [sql()]
    default:
      return []
  }
}

type CodeEditorProps = {
  value: string
  language: CodeLanguage
  onChange?: (value: string) => void
  onBlur?: () => void
  editable?: boolean
  className?: string
  height?: string
}

/** Offline code editor (CodeMirror) that follows the app theme. */
export function CodeEditor({
  value,
  language,
  onChange,
  onBlur,
  editable = true,
  className,
  height = '180px'
}: CodeEditorProps): React.JSX.Element {
  const { isDark } = useThemeContext()
  const extensions = useMemo(() => languageExtension(language), [language])

  return (
    <div className={cn('overflow-hidden rounded-[10px] border border-input-border', className)}>
      <CodeMirror
        value={value}
        height={height}
        theme={isDark ? oneDark : 'light'}
        extensions={extensions}
        editable={editable}
        onChange={onChange}
        onBlur={onBlur}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: editable }}
      />
    </div>
  )
}
