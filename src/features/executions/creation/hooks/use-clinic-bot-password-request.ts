import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type SetStateAction } from 'react'
import {
  type ClinicBotPasswordRequestState,
  createIdleClinicBotPasswordRequestState,
  createPendingClinicBotPasswordRequestState,
  failClinicBotPasswordRequestState,
  getClinicBotPasswordRequestStatus,
  resolveClinicBotPasswordRequestState,
} from '../lib/clinic-bot-password-request'
import { decryptClinicBotPassword, type ClinicBotRecord } from '../services/ccc.service'

interface UseClinicBotPasswordRequestOptions {
  clinicBotOptions: ClinicBotRecord[]
  currentClinicBotId: string
  onCleared: () => void
  // eslint-disable-next-line no-unused-vars
  onResolved: (clinicBot: ClinicBotRecord, password: string) => void
}

interface DecryptClinicBotPasswordMutationVariables {
  clinicBotId: string
  requestId: string
  selectedClinicBot: ClinicBotRecord
}

export const useClinicBotPasswordRequest = ({
  clinicBotOptions,
  currentClinicBotId,
  onCleared,
  onResolved,
}: UseClinicBotPasswordRequestOptions) => {
  const [requestState, setRequestStateInternal] = useState(() => createIdleClinicBotPasswordRequestState())
  const requestStateRef = useRef(requestState)
  const setRequestState = (nextRequest: SetStateAction<ClinicBotPasswordRequestState>) => {
    const resolvedRequest = typeof nextRequest === 'function' ? nextRequest(requestStateRef.current) : nextRequest

    requestStateRef.current = resolvedRequest
    setRequestStateInternal(resolvedRequest)
  }

  const decryptClinicBotPasswordMutation = useMutation({
    mutationFn: async ({ clinicBotId, requestId, selectedClinicBot }: DecryptClinicBotPasswordMutationVariables) => {
      const response = await decryptClinicBotPassword(clinicBotId)

      return {
        clinicBotId,
        password: response.data,
        requestId,
        selectedClinicBot,
      }
    },
    onSuccess: ({ clinicBotId, password, requestId, selectedClinicBot }) => {
      const currentRequest = requestStateRef.current

      if (currentRequest.clinicBotId === clinicBotId && currentRequest.requestId === requestId) {
        onResolved(selectedClinicBot, password)
      }

      setRequestState((previousRequest) =>
        resolveClinicBotPasswordRequestState(previousRequest, { clinicBotId, requestId }),
      )
    },
    onError: (error, { clinicBotId, requestId }) => {
      setRequestState((previousRequest) =>
        failClinicBotPasswordRequestState(
          previousRequest,
          { clinicBotId, requestId },
          error instanceof Error ? error.message : 'Unable to decrypt clinic bot password',
        ),
      )
    },
  })

  const reset = () => {
    setRequestState(createIdleClinicBotPasswordRequestState())
  }

  const selectClinicBot = (clinicBotId: string) => {
    const selectedClinicBot = clinicBotOptions.find((clinicBot) => clinicBot._id === clinicBotId)

    if (!selectedClinicBot) {
      reset()
      onCleared()

      return
    }

    const requestId = crypto.randomUUID()
    const request = { clinicBotId, requestId, selectedClinicBot }

    onCleared()
    setRequestState(createPendingClinicBotPasswordRequestState(request))
    decryptClinicBotPasswordMutation.mutate(request)
  }

  const selectedClinicBotId = requestState.status === 'idle' ? currentClinicBotId : requestState.clinicBotId

  return {
    reset,
    selectClinicBot,
    selectedClinicBotId,
    status: getClinicBotPasswordRequestStatus(requestState, selectedClinicBotId),
  }
}
