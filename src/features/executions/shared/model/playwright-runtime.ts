export type PlaywrightRuntimeAccessType = 'public' | 'private'

export interface PlaywrightRuntimeCreator {
  _id: string
  email?: string
  fullName?: string
  username?: string
  urlImage?: string
}

export interface PlaywrightRuntimeSharedMember {
  _id: string
  email?: string
  fullName: string
  username: string
  urlImage: string
}

export interface PlaywrightRuntimeAccessInfo {
  createdBy?: PlaywrightRuntimeCreator
  sharedWith: PlaywrightRuntimeSharedMember[]
  type: PlaywrightRuntimeAccessType
}

export interface PlaywrightRuntimeAccessPayload {
  sharedWith?: string[]
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

export interface PlaywrightRuntimeApplicationPayload {
  name: string
  active?: boolean
  nonProduction?: boolean
  accessInfo: PlaywrightRuntimeAccessPayload
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
  createdAt?: string
  updatedAt?: string
}

export interface PlaywrightRuntimePayload {
  name: string
  description?: string
  accessInfo: PlaywrightRuntimeAccessPayload
  applications: PlaywrightRuntimeApplicationPayload[]
}

export type PlaywrightRuntimeCreatePayload = PlaywrightRuntimePayload
export type PlaywrightRuntimeUpdatePayload = PlaywrightRuntimePayload

export interface PlaywrightRuntimeShareMembersPayload {
  memberIds: string[]
}

export interface PlaywrightRuntimeShareMembersResult {
  _id: string
  name: string
  accessInfo: PlaywrightRuntimeAccessInfo
  message?: string
}

export const getPlaywrightRuntimeApplications = (runtime: PlaywrightRuntime | undefined) => runtime?.applications ?? []
