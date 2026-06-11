export type PlaywrightRuntimeAccessType = 'public' | 'private'

export interface PlaywrightRuntimeAccessInfo {
  createdBy: string
  sharedWith: string[]
  type: PlaywrightRuntimeAccessType
}

export interface PlaywrightRuntimeApplication {
  name: string
  active?: boolean
  nonProduction?: boolean
  accessInfo: PlaywrightRuntimeAccessInfo
  config?: {
    maxWorkers?: number
    maxRetries?: number
  }
  description?: string
  apiUrl?: string
}

export interface PlaywrightRuntime {
  _id: string
  name: string
  description?: string
  accessInfo: PlaywrightRuntimeAccessInfo
  applications?: PlaywrightRuntimeApplication[]
}

export const getPlaywrightRuntimeApplications = (runtime: PlaywrightRuntime | undefined) => runtime?.applications ?? []
