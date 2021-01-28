import type { Issue } from './sonarqube'

export type Severity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'INFO'
export interface Annotation {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'failure' | 'warning' | 'notice'
  message: string
}

const getAnnotationLevel = (severity: Severity) => {
  switch (severity) {
    case 'BLOCKER':
      return 'failure'

    case 'CRITICAL':
      return 'failure'

    case 'MAJOR':
      return 'failure'

    case 'MINOR':
      return 'warning'

    case 'INFO':
      return 'notice'

    default:
      return 'notice'
  }
}

const componentToPath = (component: string) => {
  if (!component.includes(':')) {
    return component
  }

  const [, path] = component.split(':')

  return path
}

export const issuesToAnnotations = (issues: Issue[]): Annotation[] => {
  return issues.map((issue: Issue) => {
    return {
      path: componentToPath(issue.component),
      start_line: issue.textRange ? issue.textRange.startLine : 1,
      end_line: issue.textRange ? issue.textRange.endLine : 1,
      annotation_level: getAnnotationLevel(issue.severity),
      message: issue.message,
    }
  })
}
