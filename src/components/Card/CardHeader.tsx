import classNames from 'classnames'
import React, { JSX } from 'react'

function CardHeader(props: { children?: JSX.Element | string | Array<JSX.Element | string>, className?: string }) {
    return (
        <div className={classNames('px-2 py-3 border-b border-[var(--neutral-400)] text-md bg-[var(--neutral-100)] dark:bg-[var(--primary-50)]',
            props.className)}>
            {props.children}
        </div>
    )
}

export default CardHeader