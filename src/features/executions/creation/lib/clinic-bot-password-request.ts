export interface ClinicBotPasswordRequest {
  clinicBotId: string
  requestId: string
}

export interface ClinicBotPasswordRequestState extends ClinicBotPasswordRequest {
  error: string | null
  status: 'idle' | 'pending' | 'error'
}

export const createIdleClinicBotPasswordRequestState = (): ClinicBotPasswordRequestState => ({
  clinicBotId: '',
  requestId: '',
  error: null,
  status: 'idle',
})

export const createPendingClinicBotPasswordRequestState = ({
  clinicBotId,
  requestId,
}: ClinicBotPasswordRequest): ClinicBotPasswordRequestState => ({
  clinicBotId,
  requestId,
  error: null,
  status: 'pending',
})

export const resolveClinicBotPasswordRequestState = (
  state: ClinicBotPasswordRequestState,
  request: ClinicBotPasswordRequest,
) => {
  return matchesClinicBotPasswordRequest(state, request) ? createIdleClinicBotPasswordRequestState() : state
}

export const failClinicBotPasswordRequestState = (
  state: ClinicBotPasswordRequestState,
  request: ClinicBotPasswordRequest,
  error: string,
): ClinicBotPasswordRequestState => {
  if (!matchesClinicBotPasswordRequest(state, request)) {
    return state
  }

  return {
    ...request,
    error,
    status: 'error',
  }
}

export const getClinicBotPasswordRequestStatus = (state: ClinicBotPasswordRequestState, clinicBotId: string) => {
  const isCurrentClinicBotRequest = state.clinicBotId === clinicBotId

  return {
    error: isCurrentClinicBotRequest && state.status === 'error' ? state.error : null,
    isPending: isCurrentClinicBotRequest && state.status === 'pending',
  }
}

const matchesClinicBotPasswordRequest = (state: ClinicBotPasswordRequestState, request: ClinicBotPasswordRequest) => {
  return state.clinicBotId === request.clinicBotId && state.requestId === request.requestId
}
