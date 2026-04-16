import { ChevronLeft } from 'lucide-react'
import React from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from './button'

type BackButtonProps = {
  fallbackTo?: string
  forceFallback?: boolean
  'aria-label'?: string
}

export function BackButton({ fallbackTo = '/', forceFallback = false, ...rest }: BackButtonProps) {
  const navigate = useNavigate()
  const router = useRouter()

  const goBack = React.useCallback(() => {
    if (forceFallback) {
      navigate({ to: fallbackTo, replace: true })
      return
    }
    // Try browser back; if history length small, navigate to fallback
    if (window.history.length > 1) {
      router.history.back()
    } else {
      navigate({ to: fallbackTo, replace: true })
    }
  }, [fallbackTo, forceFallback])

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={goBack}
      aria-label={rest['aria-label'] || 'Go back'}
    >
      <ChevronLeft className="size-5" />
    </Button>
  )
}

export default BackButton
