interface ShouldInvalidateExecutionsOnConnectParams {
  hadCachedExecutionsAtMount: boolean
  isInitialConnect: boolean
}

export const shouldInvalidateExecutionsOnConnect = ({
  hadCachedExecutionsAtMount,
  isInitialConnect,
}: ShouldInvalidateExecutionsOnConnectParams) => {
  if (!isInitialConnect) {
    return true
  }

  return hadCachedExecutionsAtMount
}
