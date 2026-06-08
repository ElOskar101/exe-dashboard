export interface PlaywrightRuntimeApplication {
  name: string
  active?: boolean
  nonProduction?: boolean
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
  applications: PlaywrightRuntimeApplication[]
}
