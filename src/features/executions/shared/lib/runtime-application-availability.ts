import { getSelectedExecutionRequestTarget } from './execution-target'
import {
  getPlaywrightRuntimeApplications,
  type PlaywrightRuntime,
  type PlaywrightRuntimeApplication,
} from '../model/playwright-runtime'

export interface RuntimeApplicationUnavailableLabels {
  checkingAvailability: string
  inactive: string
  noApiUrl: string
  statsUnavailable: string
}

export const getRuntimeApplicationApiUrl = (application: PlaywrightRuntimeApplication) =>
  getSelectedExecutionRequestTarget(application).apiUrl

export const hasRuntimeApplicationApiUrl = (application: PlaywrightRuntimeApplication) =>
  Boolean(application.apiUrl?.trim())

export const isRuntimeApplicationSelectable = (
  application: PlaywrightRuntimeApplication,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
) =>
  application.active !== false &&
  hasRuntimeApplicationApiUrl(application) &&
  !isCheckingAvailability &&
  availableApiUrls.has(getRuntimeApplicationApiUrl(application))

export const getRuntimeApplicationUnavailableLabel = (
  application: PlaywrightRuntimeApplication,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
  labels: RuntimeApplicationUnavailableLabels,
) => {
  if (application.active === false) {
    return labels.inactive
  }

  if (!hasRuntimeApplicationApiUrl(application)) {
    return labels.noApiUrl
  }

  if (isCheckingAvailability) {
    return labels.checkingAvailability
  }

  if (!availableApiUrls.has(getRuntimeApplicationApiUrl(application))) {
    return labels.statsUnavailable
  }

  return null
}

export const getFirstSelectableRuntimeApplication = (
  runtime: PlaywrightRuntime | undefined,
  availableApiUrls: ReadonlySet<string>,
  isCheckingAvailability: boolean,
) =>
  getPlaywrightRuntimeApplications(runtime).find((application) =>
    isRuntimeApplicationSelectable(application, availableApiUrls, isCheckingAvailability),
  )
