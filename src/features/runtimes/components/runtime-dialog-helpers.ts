import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeAccessInfo,
  type PlaywrightRuntimeAccessPayload,
  type PlaywrightRuntimeAccessType,
  type PlaywrightRuntimeApplication,
  type PlaywrightRuntimeApplicationPayload,
  type PlaywrightRuntimeSharedMember,
  type PlaywrightRuntimeUpdatePayload,
} from '@/features/executions'

export const getConfiguredApplicationLimit = (value: number | undefined, fallback: number) => value ?? fallback
export const getSharedMembers = (accessInfo: PlaywrightRuntimeAccessInfo): PlaywrightRuntimeSharedMember[] =>
  accessInfo.sharedWith
export const getSharedMemberIds = (accessInfo: PlaywrightRuntimeAccessInfo) =>
  getSharedMembers(accessInfo).map((member) => member._id)
export const getSharedMemberIdsFromMembers = (members: PlaywrightRuntimeSharedMember[]) =>
  members.map((member) => member._id)

export interface RuntimeFormState {
  accessType: PlaywrightRuntimeAccessType
  description: string
  name: string
}

export interface ApplicationFormState extends RuntimeFormState {
  active: boolean
  apiUrl: string
  maxRetries: string
  maxWorkers: string
  nonProduction: boolean
}

interface RuntimeFormErrors {
  name?: 'duplicate' | 'required'
}

interface ApplicationFormErrors extends RuntimeFormErrors {
  accessType?: 'privateRuntime'
  maxRetries?: 'nonNegativeInteger'
  maxWorkers?: 'positiveInteger'
  name?: 'duplicate' | 'required'
}

interface NamedApplication {
  name: string
}

export const normalizeOptionalString = (value: string | undefined) => {
  const trimmedValue = value?.trim()

  return trimmedValue || undefined
}

export const parseIntegerField = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return undefined
  }

  const parsedValue = Number(trimmedValue)

  return Number.isInteger(parsedValue) ? parsedValue : undefined
}

export const hasFormErrors = (errors: RuntimeFormErrors | ApplicationFormErrors) => Object.keys(errors).length > 0
export const toHtmlIdSegment = (value: string) => value.replaceAll(/[^a-zA-Z0-9_-]/g, '-')

export const toPlaywrightRuntimeAccessPayload = (
  accessInfo: PlaywrightRuntimeAccessInfo,
): PlaywrightRuntimeAccessPayload => ({
  type: accessInfo.type,
  sharedWith: getSharedMembers(accessInfo),
})

export const toPlaywrightRuntimeApplicationPayload = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplication,
): PlaywrightRuntimeApplicationPayload => ({
  name: application.name,
  active: application.active ?? true,
  nonProduction: application.nonProduction ?? false,
  description: normalizeOptionalString(application.description),
  apiUrl: normalizeOptionalString(application.apiUrl),
  config: {
    maxWorkers: getConfiguredApplicationLimit(application.config?.maxWorkers, 10),
    maxRetries: getConfiguredApplicationLimit(application.config?.maxRetries, 3),
  },
  accessInfo: {
    type: runtime.accessInfo.type === 'private' ? 'private' : application.accessInfo.type,
    sharedWith: getSharedMembers(application.accessInfo),
  },
})

export const toPlaywrightRuntimePayload = (
  runtime: PlaywrightRuntime,
  applications = getPlaywrightRuntimeApplications(runtime).map((application) =>
    toPlaywrightRuntimeApplicationPayload(runtime, application),
  ),
): PlaywrightRuntimeUpdatePayload => ({
  name: runtime.name,
  description: normalizeOptionalString(runtime.description),
  accessInfo: toPlaywrightRuntimeAccessPayload(runtime.accessInfo),
  applications,
})

export const getRuntimeMutationErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = error.response as { data?: { message?: string } } | undefined
    const message = response?.data?.message?.trim()

    if (message) {
      return message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const createRuntimeFormState = (runtime: PlaywrightRuntime): RuntimeFormState => ({
  accessType: runtime.accessInfo.type,
  description: runtime.description ?? '',
  name: runtime.name,
})

export const createApplicationFormState = (application: PlaywrightRuntimeApplication): ApplicationFormState => ({
  accessType: application.accessInfo.type,
  active: application.active ?? true,
  apiUrl: application.apiUrl ?? '',
  description: application.description ?? '',
  maxRetries: getConfiguredApplicationLimit(application.config?.maxRetries, 3).toString(),
  maxWorkers: getConfiguredApplicationLimit(application.config?.maxWorkers, 10).toString(),
  name: application.name,
  nonProduction: application.nonProduction ?? false,
})

export const getRuntimeFormErrors = (formState: RuntimeFormState) => {
  const errors: RuntimeFormErrors = {}

  if (!formState.name.trim()) {
    errors.name = 'required'
  }

  return errors
}

export const getApplicationFormErrors = (
  runtime: PlaywrightRuntime,
  application: PlaywrightRuntimeApplication,
  formState: ApplicationFormState,
) => {
  const errors: ApplicationFormErrors = {}
  const name = formState.name.trim()
  const maxWorkers = parseIntegerField(formState.maxWorkers)
  const maxRetries = parseIntegerField(formState.maxRetries)
  const normalizedOriginalName = application.name.trim().toLowerCase()

  if (!name) {
    errors.name = 'required'
  } else if (
    getPlaywrightRuntimeApplications(runtime).some(
      (candidate) =>
        candidate.name.trim().toLowerCase() !== normalizedOriginalName &&
        candidate.name.trim().toLowerCase() === name.toLowerCase(),
    )
  ) {
    errors.name = 'duplicate'
  }

  if (maxWorkers === undefined || maxWorkers < 1) {
    errors.maxWorkers = 'positiveInteger'
  }

  if (maxRetries === undefined || maxRetries < 0) {
    errors.maxRetries = 'nonNegativeInteger'
  }

  if (runtime.accessInfo.type === 'private' && formState.accessType === 'public') {
    errors.accessType = 'privateRuntime'
  }

  return errors
}

export const getCreateApplicationFormErrors = (
  runtimeAccessType: PlaywrightRuntimeAccessType,
  applications: readonly NamedApplication[],
  formState: ApplicationFormState,
) => {
  const errors: ApplicationFormErrors = {}
  const name = formState.name.trim()
  const maxWorkers = parseIntegerField(formState.maxWorkers)
  const maxRetries = parseIntegerField(formState.maxRetries)

  if (!name) {
    errors.name = 'required'
  } else if (applications.some((application) => application.name.trim().toLowerCase() === name.toLowerCase())) {
    errors.name = 'duplicate'
  }

  if (maxWorkers === undefined || maxWorkers < 1) {
    errors.maxWorkers = 'positiveInteger'
  }

  if (maxRetries === undefined || maxRetries < 0) {
    errors.maxRetries = 'nonNegativeInteger'
  }

  if (runtimeAccessType === 'private' && formState.accessType === 'public') {
    errors.accessType = 'privateRuntime'
  }

  return errors
}

export const toCreateApplicationPayload = (
  formState: ApplicationFormState,
  runtimeAccessType: PlaywrightRuntimeAccessType,
): PlaywrightRuntimeApplicationPayload => ({
  name: formState.name.trim(),
  active: formState.active,
  nonProduction: formState.nonProduction,
  description: normalizeOptionalString(formState.description),
  apiUrl: normalizeOptionalString(formState.apiUrl),
  config: {
    maxWorkers: parseIntegerField(formState.maxWorkers) ?? 10,
    maxRetries: parseIntegerField(formState.maxRetries) ?? 3,
  },
  accessInfo: {
    type: runtimeAccessType === 'private' ? 'private' : formState.accessType,
  },
})
