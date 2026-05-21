import React, { JSX } from 'react'

const CardBody = (props: {
  children?: JSX.Element | string | Array<JSX.Element | string>
}) => {
  return (
    <div className="px-2 py-3 text-sm bg-[var(--neutral-50)] dark:bg-[var(--primary-100)] h-full">
      {props.children}
    </div>
  )
}

export default CardBody
