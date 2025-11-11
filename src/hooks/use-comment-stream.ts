import { useCallback, useEffect, useRef, useState } from 'react'

import type { Id } from '../../convex/_generated/dataModel'
import { getConvexSiteUrl } from '../lib/utils'

type Status = 'idle' | 'streaming' | 'complete' | 'error'

type UseCommentStreamOptions = {
  postId?: Id<'posts'>
  autoStart?: boolean
}

export function useCommentStream(options?: UseCommentStreamOptions) {
  const { postId, autoStart = true } = options ?? {}

  const [status, setStatus] = useState<Status>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [streamedComment, setStreamedComment] = useState('')
  const [streamError, setStreamError] = useState('')
  const [commentId, setCommentId] = useState<Id<'comments'> | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const streamingPostIdRef = useRef<Id<'posts'> | null>(null)

  const closeStream = useCallback(() => {
    eventSourceRef.current?.close()
    eventSourceRef.current = null
    streamingPostIdRef.current = null
  }, [])

  const resetStream = useCallback(() => {
    closeStream()
    setStatus('idle')
    setStatusMessage('')
    setStreamedComment('')
    setStreamError('')
    setCommentId(null)
  }, [closeStream])

  const startStream = useCallback(
    (postIdOverride?: Id<'posts'>) => {
      const nextPostId = postIdOverride ?? postId
      if (!nextPostId) {
        return
      }
      if (streamingPostIdRef.current === nextPostId && eventSourceRef.current) {
        return
      }

      resetStream()
      setStatus('streaming')
      setStatusMessage('Streaming comment...')

      const siteUrl = getConvexSiteUrl()
      const source = new EventSource(`${siteUrl}/comment/completion?postId=${nextPostId}`)
      eventSourceRef.current = source
      streamingPostIdRef.current = nextPostId

      source.addEventListener('start', () => {
        setStatusMessage('Generating toxic comment...')
      })

      source.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { delta?: string }
          if (payload.delta) {
            setStreamedComment((prev) => prev + payload.delta)
          }
        } catch (error) {
          console.error('Failed to parse SSE chunk', error)
        }
      }

      source.addEventListener('complete', (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as { commentId?: string }
          if (payload.commentId) {
            setCommentId(payload.commentId as Id<'comments'>)
          }
        } catch (error) {
          console.error('Failed to parse completion payload', error)
        } finally {
          setStatus('complete')
          setStatusMessage('Comment generation complete')
          closeStream()
        }
      })

      const handleError = (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data) as { message?: string }
          setStreamError(payload.message ?? 'Stream error')
        } catch {
          setStreamError('Stream error')
        } finally {
          setStatus('error')
          setStatusMessage('Comment generation failed')
          closeStream()
        }
      }

      source.addEventListener('error', handleError as EventListener)
    },
    [closeStream, postId, resetStream]
  )

  useEffect(() => {
    if (!autoStart || !postId) {
      return
    }
    if (streamingPostIdRef.current === postId && eventSourceRef.current) {
      return
    }
    startStream(postId)
  }, [autoStart, postId, startStream])

  useEffect(
    () => () => {
      closeStream()
    },
    [closeStream]
  )

  return {
    status,
    statusMessage,
    streamedComment,
    streamError,
    commentId,
    startStream,
    resetStream,
  }
}
