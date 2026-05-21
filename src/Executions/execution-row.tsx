import React from 'react'
import { IExecution } from './interfaces/execution.interface'
import Button from '../components/button'
import TablerIcons from '../components/tabler-icons'
import ExecutionStatusCard from './execution-status-card'
import classNames from 'classnames'
import { getDiffDates } from '../utils/common'

const ExecutionRow = (
  props: IExecution & { onClick?: React.MouseEventHandler },
) => {
  return (
    <div
      className="flex w-full p-1 gap-x-2 rounded-sm border border-[var(--neutral-400)] items-center scale-100 hover:scale-101 transition-all cursor-pointer"
      onClick={props.onClick}
    >
      <ExecutionStatusCard status={props.status} className="mb-auto" />
      <div className="flex flex-col">
        <strong>{props.bot}</strong>
        <span className="text-sm flex flex-wrap items-center">
          <TablerIcons icon="IconBuildingSkyscraper" className="size-[1.2em]" />{' '}
          {`${props.client}`} {'>'}{' '}
          <TablerIcons icon="IconDental" className="size-[1.2em]" />
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
