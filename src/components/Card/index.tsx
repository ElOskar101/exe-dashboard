import classNames from 'classnames'
import React, { JSX, ReactElement } from 'react'

interface ICard { children?: JSX.Element | string | Array<JSX.Element | string>, className?: string }

const Card = (props: ICard) => {
    return (
        <div className={classNames(
            'rounded border border-[var(--neutral-400)] overflow-hidden',
            props.className)}>
            {props.children}
        </div>
    )
}

export default Card