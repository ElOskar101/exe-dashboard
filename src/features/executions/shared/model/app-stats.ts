export interface ExecutionAppComponentStatus {
  status: string
}

export interface ExecutionAppMongoStatus extends ExecutionAppComponentStatus {
  readyState: number
  state: string
}

export interface ExecutionAppJobStats {
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  paused: number
  prioritized: number
  waitingChildren: number
  queued: number
  running: number
}

export interface ExecutionAppStats {
  status: string
  timestamp: string
  uptime: number
  server: ExecutionAppComponentStatus
  mongo: ExecutionAppMongoStatus
  redis: ExecutionAppComponentStatus
  jobs: ExecutionAppJobStats
}
