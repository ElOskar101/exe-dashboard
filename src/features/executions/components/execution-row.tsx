import React from 'react'
import { IExecution } from '../model/execution.interface'
import ExecutionStatusCard from './execution-status-card'
import { getDiffDates } from '@/utils/common'
import { IconBuildingSkyscraper, IconDental } from '@tabler/icons-react'

const ExecutionRow = (
  props: IExecution & { onClick?: React.MouseEventHandler },
) => {
  return (
    <div
      className="flex w-full scale-100 cursor-pointer items-center gap-x-2 rounded-sm border p-1 transition-all hover:scale-101"
      onClick={props.onClick}
    >
      <ExecutionStatusCard status={props.status} className="mb-auto" />
      <div className="flex flex-col">
        <strong>{props.bot}</strong>
        <span className="text-sm flex flex-wrap items-center">
          <IconBuildingSkyscraper className="size-[1.2em]" />{' '}
          {`${props.client}`} {'>'} <IconDental className="size-[1.2em]" />
          {`${props.clinic}`}
        </span>
      </div>
      <div className="flex gap-x-1 ml-auto h-fit mb-auto">
        {getDiffDates(props.startedAt, props.finishedAt)}
      </div>
    </div>
  )
}

export default ExecutionRow
