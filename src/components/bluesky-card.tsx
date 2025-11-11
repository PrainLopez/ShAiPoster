import { forwardRef, type ComponentPropsWithoutRef } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn } from '~/lib/utils'

type CardProps = ComponentPropsWithoutRef<typeof Card>

type BlueskyCardProps = CardProps & {
  title: string
  subtitle?: string
  avatarVariant?: 'primary' | 'secondary'
  avatarClassName?: string
  contentClassName?: string
}

const avatarVariants: Record<NonNullable<BlueskyCardProps['avatarVariant']>, string> = {
  primary: 'bg-primary/15',
  secondary: 'bg-secondary/20',
}

export const BlueskyCard = forwardRef<HTMLDivElement, BlueskyCardProps>(
  (
    {
      title,
      subtitle,
      avatarVariant = 'primary',
      avatarClassName,
      className,
      contentClassName,
      children,
      ...cardProps
    },
    ref
  ) => {
    return (
      <Card
        ref={ref}
        className={cn('border-border/60 bg-background/90 shadow-lg shadow-primary/5', className)}
        {...cardProps}
      >
        <CardHeader className="flex flex-row items-center gap-3">
          <div
            className={cn('h-11 w-11 rounded-full', avatarVariants[avatarVariant], avatarClassName)}
          />
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {subtitle ? <p className="text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
        </CardHeader>
        <CardContent className={cn('space-y-4', contentClassName)}>{children}</CardContent>
      </Card>
    )
  }
)

BlueskyCard.displayName = 'BlueskyCard'
