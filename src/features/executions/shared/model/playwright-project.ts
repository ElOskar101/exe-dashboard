import type { ExecutionVerificationType } from './execution-create-payload'

export interface PlaywrightProjectBot {
  _id: string
  botName: string
  isActive: boolean
  type: ExecutionVerificationType
  urlLogin: string
  description?: string
}

export interface PlaywrightProject {
  _id: string
  name: string
  description?: string
  active?: boolean
  associatedWith: PlaywrightProjectBot[]
}
