export interface PlaywrightRuntimeApplication {
  name: string
  description?: string
  apiUrl?: string
}

export interface PlaywrightRuntime {
  _id: string
  name: string
  description?: string
  applications: PlaywrightRuntimeApplication[]
}
