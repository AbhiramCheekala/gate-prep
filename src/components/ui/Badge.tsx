import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'danger' | 'success' | 'warning' | 'purple'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'border-transparent bg-[#003087] text-white',
    secondary: 'border-transparent bg-gray-100 text-gray-900',
    outline: 'text-gray-950 border-gray-300',
    danger: 'border-transparent bg-red-100 text-red-800',
    success: 'border-transparent bg-green-100 text-green-800',
    warning: 'border-transparent bg-yellow-100 text-yellow-800',
    purple: 'border-transparent bg-purple-100 text-purple-800',
  }
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
