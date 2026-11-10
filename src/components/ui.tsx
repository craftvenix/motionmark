import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-signal text-[#12130d] hover:bg-[#e3ff8d] active:bg-[#cdee54] shadow-[0_0_0_1px_rgba(216,255,101,0.3),0_8px_24px_-8px_rgba(216,255,101,0.55)]',
  secondary:
    'bg-white/[0.065] text-ivory-100 hover:bg-white/[0.10] border border-white/[0.08]',
  ghost: 'text-ivory-400 hover:text-ivory-100 hover:bg-white/[0.055]',
  outline:
    'border border-white/[0.12] bg-transparent text-ivory-200 hover:border-white/[0.24] hover:bg-white/[0.04]',
  danger:
    'bg-red-500/10 text-red-300 hover:bg-red-500/15 border border-red-400/20',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 rounded-lg px-3 text-[12px] gap-1.5',
  md: 'h-10 rounded-xl px-4 text-[13px] gap-2',
  lg: 'h-12 rounded-xl px-5 text-sm gap-2',
  icon: 'h-8 w-8 rounded-lg justify-center',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-signal/50',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  ),
)
Button.displayName = 'Button'

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'ghost', ...props }, ref) => (
    <Button ref={ref} variant={variant} size="icon" className={className} {...props} />
  ),
)
IconButton.displayName = 'IconButton'

interface SliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value'> {
  value: number
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number) => void
}

export function Slider({
  className,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onValueChange,
  ...props
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <input
      type="range"
      className={cn('mm-range', className)}
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => onValueChange(Number(event.target.value))}
      style={{ ['--value' as string]: `${percent}%` }}
      {...props}
    />
  )
}

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-lg border border-white/[0.09] bg-black/25 px-3 text-[13px] text-ivory-100 placeholder:text-ivory-600 transition-colors outline-none hover:border-white/[0.14] focus:border-signal/50 focus:ring-1 focus:ring-signal/20',
        invalid &&
          'border-red-400/55 bg-red-500/[0.06] focus:border-red-400 focus:ring-red-500/20',
        className,
      )}
      {...props}
    />
  ),
)
TextInput.displayName = 'TextInput'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'h-9 w-full appearance-none rounded-lg border border-white/[0.09] bg-[#16161a] px-3 pr-8 text-[12px] text-ivory-100 outline-none transition-colors hover:border-white/[0.15] focus:border-signal/50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ivory-500" />
    </div>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ivory-500">
          {label}
        </span>
        {hint ? (
          <span className="font-mono text-[10px] text-ivory-600">{hint}</span>
        ) : null}
      </span>
      {children}
    </label>
  )
}

export function Switch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full border transition-all duration-300',
        checked
          ? 'border-signal/40 bg-signal/90'
          : 'border-white/[0.12] bg-white/[0.06]',
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-[3px] h-4 w-4 rounded-full shadow-sm transition-transform duration-300',
          checked ? 'translate-x-[18px] bg-[#17190f]' : 'translate-x-[3px] bg-ivory-300',
        )}
      />
    </button>
  )
}

export function SwitchRow({
  checked,
  onCheckedChange,
  title,
  description,
  icon,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  title: string
  description?: string
  icon?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="text-ivory-500">{icon}</span> : null}
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-ivory-200">{title}</p>
          {description ? (
            <p className="truncate text-[10px] text-ivory-600">{description}</p>
          ) : null}
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} label={title} />
    </div>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (value: T) => void
  options: Array<{ value: T; label: ReactNode; title?: string }>
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-white/[0.07] bg-black/25 p-0.5',
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] font-medium transition-all duration-200',
            size === 'sm'
              ? 'h-7 px-2 text-[10px]'
              : 'h-8 px-3 text-[11px]',
            value === option.value
              ? 'bg-white/[0.11] text-ivory-100 shadow-[0_1px_0_rgba(255,255,255,0.08)_inset]'
              : 'text-ivory-500 hover:text-ivory-300',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border transition-all duration-200',
        checked
          ? 'border-signal bg-signal text-[#15170e]'
          : 'border-white/[0.16] bg-black/20 text-transparent hover:border-white/[0.3]',
      )}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </button>
  )
}

export function PanelHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.24em] text-signal/80">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-[17px] font-medium tracking-[-0.02em] text-ivory-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 max-w-[290px] text-[11px] leading-relaxed text-ivory-500">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn('h-px w-full bg-white/[0.065]', className)} />
}

export function StatusDot({
  tone = 'success',
  className,
}: {
  tone?: 'success' | 'warning' | 'danger' | 'muted'
  className?: string
}) {
  const colors = {
    success: 'bg-signal shadow-[0_0_8px_rgba(216,255,101,0.55)]',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    muted: 'bg-ivory-600',
  }
  return <span className={cn('h-1.5 w-1.5 rounded-full', colors[tone], className)} />
}
