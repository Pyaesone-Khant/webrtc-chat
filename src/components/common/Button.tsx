import { cn } from '#/utils/cn'
import React from 'react'

const buttonVariants = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary:
    'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 shadow-sm',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
  ghost: 'hover:bg-gray-100 text-gray-700 active:bg-gray-200',
  outline:
    'border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 active:bg-gray-100',
  icon: 'bg-black/60 hover:bg-black/80 text-white rounded-full',
}

const buttonSizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 py-2 text-sm',
  lg: 'h-12 px-6 py-3 text-base',
  icon: 'h-10 w-10',
}

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex gap-2 items-center justify-center rounded-md font-medium transition-colors duration-300',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}
