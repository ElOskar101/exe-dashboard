interface IAvatar {
  src?: string
  name: string
  className?: string
  size?: 'lg' | 'md' | 'sm'
}

const getIconSize = (size: IAvatar['size']): number => {
  switch (size) {
    case 'lg':
      return 12
    case 'md':
      return 10
    case 'sm':
      return 8
    default:
      return 6
  }
}

export function Avatar(props: IAvatar) {
  const { src, name, size = 'sm', className = '' } = props
  const iconSize = getIconSize(size)

  if (!src) {
    const initials = name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()

    return (
      <div
        className={`min-w-${iconSize} h-${iconSize} rounded-md bg-gray-300 text-gray-700 font-bold ${className}`}
      >
        <div className="flex items-center justify-center w-full h-full">
          {initials || '?'}
        </div>
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={name}
      className={`w-${iconSize} h-${iconSize} rounded-md object-cover border border-gray-300 ${className}`}
    />
  )
}
