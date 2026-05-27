import { describe, expect, it } from 'vitest'
import {
  createIdleClinicBotPasswordRequestState,
  createPendingClinicBotPasswordRequestState,
  failClinicBotPasswordRequestState,
  getClinicBotPasswordRequestStatus,
  resolveClinicBotPasswordRequestState,
} from './clinic-bot-password-request'

describe('clinic-bot-password-request', () => {
  it('clears the tracked request when the matching decrypt request succeeds', () => {
    const state = createPendingClinicBotPasswordRequestState({
      clinicBotId: 'clinic-bot-1',
      requestId: 'request-1',
    })

    expect(
      resolveClinicBotPasswordRequestState(state, {
        clinicBotId: 'clinic-bot-1',
        requestId: 'request-1',
      }),
    ).toEqual(createIdleClinicBotPasswordRequestState())
  })

  it('ignores stale decrypt request completions from older selections', () => {
    const state = createPendingClinicBotPasswordRequestState({
      clinicBotId: 'clinic-bot-2',
      requestId: 'request-2',
    })

    expect(
      failClinicBotPasswordRequestState(
        state,
        {
          clinicBotId: 'clinic-bot-1',
          requestId: 'request-1',
        },
        'stale error',
      ),
    ).toEqual(state)
  })

  it('ignores stale decrypt request completions for the same bot when a newer request is active', () => {
    const state = createPendingClinicBotPasswordRequestState({
      clinicBotId: 'clinic-bot-1',
      requestId: 'request-2',
    })

    expect(
      resolveClinicBotPasswordRequestState(state, {
        clinicBotId: 'clinic-bot-1',
        requestId: 'request-1',
      }),
    ).toEqual(state)
  })

  it('only exposes pending and error state for the currently selected clinic bot', () => {
    const pendingState = createPendingClinicBotPasswordRequestState({
      clinicBotId: 'clinic-bot-1',
      requestId: 'request-1',
    })
    const errorState = failClinicBotPasswordRequestState(
      pendingState,
      {
        clinicBotId: 'clinic-bot-1',
        requestId: 'request-1',
      },
      'decrypt failed',
    )

    expect(getClinicBotPasswordRequestStatus(pendingState, 'clinic-bot-1')).toEqual({
      error: null,
      isPending: true,
    })
    expect(getClinicBotPasswordRequestStatus(errorState, 'clinic-bot-1')).toEqual({
      error: 'decrypt failed',
      isPending: false,
    })
    expect(getClinicBotPasswordRequestStatus(errorState, 'clinic-bot-2')).toEqual({
      error: null,
      isPending: false,
    })
  })
})
