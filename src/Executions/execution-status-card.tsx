import React from 'react'
import classNames from 'classnames'
import {
  IconCircleCheck,
  IconDeviceImac,
  IconExclamationCircle,
  IconSettings,
  IconZzz,
} from '@tabler/icons-react'

interface IExecutionStatusCard {
  status?: 'process' | 'sleeping' | 'error' | 'denegated' | 'completed'
  className?: string
}

const ExecutionStatusCard = (props: IExecutionStatusCard) => {
  const { status = 'sleeping' } = props
  return (
    <div
      className={classNames('relative w-fit h-fit text-2xl', props.className)}
    >
      <IconDeviceImac className="w-[1em] h-[1em] stroke-[2px] m-auto" />
      {status === 'sleeping' && (
        <IconZzz className="absolute -right-1 -top-1 h-[0.6em] w-[0.6em] origin-center animate-pulse stroke-[3px]" />
      )}
      {status === 'completed' && (
        <IconCircleCheck className="absolute -bottom-1 -right-1 h-[0.6em] w-[0.6em]" />
      )}
      {status === 'process' && (
        <IconSettings className="absolute -bottom-1 -right-1 h-[0.6em] w-[0.6em] origin-center animate-spin stroke-[1px]" />
      )}
      {status === 'error' && (
        <IconExclamationCircle className="absolute -bottom-1 -right-1 h-[0.6em] w-[0.6em] animate-bounce" />
      )}
    </div>
  )
}

export default ExecutionStatusCard
