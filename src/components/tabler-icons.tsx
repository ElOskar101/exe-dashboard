import * as allIcons from '@tabler/icons-react'
import React, { ReactElement } from 'react'

export type availableIconsTypes =
  | 'IconLogout2'
  | 'IconBrightnessDown'
  | 'IconMoon'
  | 'IconHome'
  | 'IconUsers'
  | 'IconBuildingSkyscraper'
  | 'IconListDetails'
  | 'IconRefresh'
  | 'IconDeviceDesktopCancel'
  | 'IconPlus'
  | 'IconZzz'
  | 'IconDeviceImac'
  | 'IconSettings'
  | 'IconExclamationCircle'
  | 'IconPointer'
  | 'IconCancel'
  | 'IconLoader4'
  | 'IconLoader2'
  | 'IconCircleCheck'
  | 'IconPlayerPlayFilled'
  | 'IconPlayerStopFilled'
  | 'IconDental'
  | 'IconRepeat'
  | 'IconFileCode2'
  | 'IconCopy'

const TablerIcons = (props: {
  icon: availableIconsTypes
  className?: string
  children?: ReactElement | string
  size?: number
}) => {
  const Icon = allIcons[props.icon]
  return <Icon className={props.className} size={props.size} />
}

export default TablerIcons
