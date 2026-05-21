import classNames from 'classnames'
import React, { MouseEventHandler, ReactElement } from 'react'

interface IButtonProps {
    color?: 'success' | 'primary' | 'secondary' | 'danger' | 'default'
    variant?: 'outline' | 'full' | 'link',
    size?: 'sm' | 'md' | 'lg'
    type?: 'button' | 'submit',
    onClick?: MouseEventHandler<HTMLButtonElement>,
    className?: string,
    children?: string | ReactElement | (string | ReactElement)[]
    focusColor?: string
    textColor?: string
}

const getBtnColor = (color: IButtonProps['color']): { main: string, active: string, text: string } => {
    switch (color) {
        case 'success':
            return { main: 'var(--color-green-600)', active: 'var(--color-green-500)', text: 'var(--neutral-50)' }
        case 'danger':
            return { main: 'var(--color-red-600)', active: 'var(--color-red-500)', text: 'var(--neutral-50)' }
        case 'primary':
            return { main: 'var(--primary-600)', active: 'var(--primary-500)', text: 'var(--neutral-50)' }
        default:
            return { main: 'var(--neutral-900)', active: 'var(--neutral-900)', text: 'var(--neutral-50)' }
    }
}

function Button(props: IButtonProps): ReactElement {
    const { variant = 'full', size = 'md', color = 'default' } = props

    const btnColor = getBtnColor(color)

    return (
        <button type={props.type || 'button'}
            style={{
                '--btn-main': btnColor.main,
                '--btn-active': btnColor.active,
                '--btn-text': props.textColor || btnColor.text,
            } as React.CSSProperties}
            className={classNames(
                'cursor-pointer inline-flex items-center justify-center',
                `text-${size}`,
                {
                    'px-5 py-3': size === 'lg',
                    'px-3 py-2': size === 'md',
                    'px-1 py-1': size === 'sm',
                },
                variant === 'full' &&
                [
                    `text-[var(--btn-text)]`,
                    `bg-[var(--btn-main)]`,
                    `hover:bg-[var(--btn-active)]`,
                    `active:bg-[var(--btn-active)]`,
                    `focus:ring-[var(--btn-main)]`
                ],
                variant === 'outline' && [
                    `bg-transparent`,
                    `border`,
                    `hover:bg-[var(--btn-active)]`,
                    `active:bg-[var(--btn-active)]`,
                    `focus:ring-[var(--btn-active)]`,
                    `hover:text-[var(--btn-text)]`,
                    `active:text-[var(--btn-text)]`,
                    `focus:text-[var(--btn-text)]`,
                    `border-[var(--btn-main)]`,
                    `text-[var(--btn-main)]`,
                ],
                variant === 'link' && [
                    'text-[var(--btn-text)]/80',
                    'hover:text-[var(--btn-text)]/100',
                    'active:text-[var(--btn-text)]/100',
                    'focus:text-[var(--btn-text)]/100',
                ],
                props.className,)} onClick={props.onClick}>
            {props.children}
        </button>
    )
}

export default Button