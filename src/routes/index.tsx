import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Loader2, RefreshCcw, Share2 } from 'lucide-react'
import { useMutation, useQuery } from 'convex/react'

import { Header } from '~/components/header'
import { HeroSection } from '~/components/hero-section'
import { Footer } from '~/components/footer'
import { Button } from '~/components/ui/button'
import { BlueskyCard } from '~/components/bluesky-card'
import { useCommentStream } from '~/hooks/use-comment-stream'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import type { CommentDoc, PostDoc } from '~/types/documents'

type HomeSearch = {
  postId?: string
  commentId?: string
}

type AddPostResult =
  | { message: 'created'; postId: Id<'posts'> }
  | { message: 'exists'; post: PostDoc }

export const Route = createFileRoute('/')({
  validateSearch: (search): HomeSearch => {
    const next: HomeSearch = {}
    if (typeof search.postId === 'string' && search.postId.length > 0) {
      next.postId = search.postId
    }
    if (typeof search.commentId === 'string' && search.commentId.length > 0) {
      next.commentId = search.commentId
    }
    return next
  },
  component: Home,
})

function Home() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch() as HomeSearch
  const addPost = useMutation(api.post.addPostFromUrl)

  const [postUrl, setPostUrl] = useState('')
  const [activePostId, setActivePostId] = useState<Id<'posts'> | null>(
    search.postId ? (search.postId as Id<'posts'>) : null
  )
  const [activeCommentId, setActiveCommentId] = useState<Id<'comments'> | null>(
    search.commentId ? (search.commentId as Id<'comments'>) : null
  )
  const [pendingPostId, setPendingPostId] = useState<Id<'posts'> | null>(null)
  const [flowStatus, setFlowStatus] = useState<'idle' | 'submitting' | 'waiting-content' | 'error'>(
    'idle'
  )
  const cardsRef = useRef<HTMLDivElement | null>(null)
  const commentCardRef = useRef<HTMLDivElement | null>(null)
  const isSyncingFromNavigateRef = useRef(false)
  const skipCommentSearchSyncRef = useRef(false)

  const activePost = useQuery(
    api.post.getPostById,
    activePostId ? { postId: activePostId } : 'skip'
  ) as PostDoc | null | undefined

  const activeComment = useQuery(
    api.comment.getCommentById,
    activeCommentId ? { commentId: activeCommentId } : 'skip'
  ) as CommentDoc | null | undefined

  const {
    status: streamStatus,
    streamedComment,
    streamError,
    commentId: streamedCommentId,
    startStream,
    resetStream: resetCommentStream,
  } = useCommentStream({ postId: activePostId ?? undefined, autoStart: false })

  useEffect(() => {
    if (streamedCommentId && streamedCommentId !== activeCommentId) {
      setActiveCommentId(streamedCommentId)
    }
  }, [streamedCommentId, activeCommentId])

  useEffect(() => {
    if (isSyncingFromNavigateRef.current) {
      isSyncingFromNavigateRef.current = false
      return
    }
    if (search.postId && search.postId !== activePostId) {
      setActivePostId(search.postId as Id<'posts'>)
    }
    if (search.commentId && search.commentId !== activeCommentId) {
      setActiveCommentId(search.commentId as Id<'comments'>)
    }
  }, [search.postId, search.commentId, activePostId, activeCommentId])

  const clearCommentState = useCallback(
    (options?: { skipSearchSync?: boolean }) => {
      if (options?.skipSearchSync) {
        skipCommentSearchSyncRef.current = true
      }
      setActiveCommentId(null)
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href)
        url.searchParams.delete('commentId')
        window.history.replaceState(window.history.state, '', url.toString())
      }
    },
    []
  )

  useEffect(() => {
    const currentPostId = activePostId ?? undefined
    const currentCommentId = activeCommentId ?? undefined
    const searchPostId = search.postId ?? undefined
    const searchCommentId = search.commentId ?? undefined

    const postMismatch = searchPostId !== currentPostId
    const commentMismatch = searchCommentId !== currentCommentId

    if (!postMismatch && !commentMismatch) {
      skipCommentSearchSyncRef.current = false
      return
    }

    if (
      skipCommentSearchSyncRef.current &&
      !postMismatch &&
      currentCommentId === undefined
    ) {
      skipCommentSearchSyncRef.current = false
      return
    }

    if (!currentPostId && !currentCommentId && !searchPostId && !searchCommentId) {
      return
    }

    isSyncingFromNavigateRef.current = true
    void navigate({
      search: (prev) => {
        const next = { ...prev }
        if (currentPostId) {
          next.postId = currentPostId
        } else {
          delete next.postId
        }
        if (currentCommentId) {
          next.commentId = currentCommentId
        } else {
          delete next.commentId
        }
        return next
      },
      replace: true,
      resetScroll: false
    })
  }, [activePostId, activeCommentId, navigate, search.commentId, search.postId])

  const imageUrls = useMemo(() => {
    if (!activePost || activePost.content?.type !== 'bluesky') {
      return []
    }
    return activePost.content.imageUrl ?? []
  }, [activePost])

  const contentReady = Boolean(activePost?.content?.text) || imageUrls.length > 0

  useEffect(() => {
    if (!pendingPostId || !activePostId || pendingPostId !== activePostId) {
      return
    }
    if (!contentReady) {
      return
    }
    startStream(pendingPostId)
    setPendingPostId(null)
    if (commentCardRef.current) {
      // commentCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [pendingPostId, activePostId, contentReady, startStream])

  useEffect(() => {
    if (streamStatus === 'complete' || streamStatus === 'error') {
      setPendingPostId(null)
    }
  }, [streamStatus])

  const handleHeroSubmit = useCallback(() => {
    const trimmed = postUrl.trim()
    if (!trimmed) {
      return
    }
    setPostUrl(trimmed)
    setFlowStatus('submitting')
    clearCommentState()
    setPendingPostId(null)
    resetCommentStream()

    void addPost({ postUrl: trimmed })
      .then((result) => {
        const data = result as AddPostResult
        if (data.message === 'created') {
          setFlowStatus('waiting-content')
          setActivePostId(data.postId)
          setPendingPostId(data.postId)
        } else {
          setFlowStatus('waiting-content')
          setActivePostId(data.post._id)
          setPendingPostId(data.post._id)
        }
      })
      .catch((error) => {
        console.error(error)
        setFlowStatus('error')
      })
  }, [addPost, clearCommentState, postUrl, resetCommentStream])

  const shareReady = Boolean(activePostId && activeCommentId)

  const shareUrl = useMemo(() => {
    if (!shareReady || typeof window === 'undefined') {
      return ''
    }
    const url = new URL(window.location.href)
    url.searchParams.set('postId', activePostId!)
    url.searchParams.set('commentId', activeCommentId!)
    return url.toString()
  }, [activeCommentId, activePostId, shareReady])

  const handleCopyLink = useCallback(async () => {
    if (!shareReady || !shareUrl) {
      return
    }
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard unavailable')
      return
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
    } catch (error) {
      console.error(error)
    }
  }, [shareReady, shareUrl])

  const handleShareLink = useCallback(async () => {
    if (!shareReady || !shareUrl || typeof navigator === 'undefined') {
      return
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: 'ShAiPoster roast session',
          text: '看看这条毒舌评论 🔥',
          url: shareUrl,
        })
      } catch (error) {
        console.error(error)
      }
      return
    }
    void handleCopyLink()
  }, [handleCopyLink, shareReady, shareUrl])

  const commentText = streamedComment || activeComment?.content || ''
  const showCards =
    Boolean(activePostId || commentText || streamError || flowStatus !== 'idle') ||
    Boolean(activeComment)

  const postHostname = useMemo(() => {
    if (!activePost?.originUrl) {
      return 'bluesky.app'
    }
    try {
      return new URL(activePost.originUrl).hostname
    } catch {
      return activePost.originUrl
    }
  }, [activePost?.originUrl])

  const renderSkeletonLines = (count = 3) => (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="h-4 w-full rounded-full bg-muted/40 animate-pulse"
        />
      ))}
    </div>
  )

  const renderPostCardBody = () => {
    if (!activePost) {
      return renderSkeletonLines(4)
    }
    if (!contentReady) {
      return (
        <div className="space-y-4">
          {renderSkeletonLines(3)}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            正在同步帖子内容...
          </div>
        </div>
      )
    }
    return (
      <div className="space-y-4">
        {activePost.content?.text ? (
          <p className="text-base leading-relaxed text-foreground">{activePost.content.text}</p>
        ) : null}
        {imageUrls.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {imageUrls.map((url) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-xl border border-border/60 bg-muted/30"
              >
                <img src={url} alt="post attachment" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  const renderCommentBody = () => {
    if (streamError) {
      return <p className="text-sm text-destructive">{streamError}</p>
    }
    if (commentText) {
      return (
        <p className="whitespace-pre-line text-base leading-relaxed text-foreground">
          {commentText}
        </p>
      )
    }
    const isWaiting =
      flowStatus === 'waiting-content' || flowStatus === 'submitting' || streamStatus === 'streaming'
    return (
      <div className="space-y-3">
        {renderSkeletonLines(4)}
        <p className="text-xs text-muted-foreground">
          {isWaiting ? '评论生成中，请稍候…' : '提交一个链接，看看我怎么吐槽它。'}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection postUrl={postUrl} onPostUrlChange={setPostUrl} onSubmit={handleHeroSubmit} />

        {showCards ? (
          <section
            className="relative overflow-hidden border-b border-border/40 bg-background"
            ref={cardsRef}
          >
            <div className="absolute inset-0 -z-10">
              <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-linear-to-br from-primary/20 via-primary/10 to-transparent blur-3xl" />
              <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-linear-to-tl from-secondary/20 via-primary/10 to-transparent blur-3xl" />
              <div className="absolute left-0 bottom-0 h-[450px] w-[450px] rounded-full bg-linear-to-tr from-chart-4/30 via-primary/10 to-transparent blur-3xl" />
            </div>
            <div className="container mx-auto px-4 py-16 md:px-6 md:py-20">
              <div className="mt-10 grid gap-6 lg:grid-cols-2">
                <BlueskyCard
                  title="Bluesky Preview"
                  subtitle={postHostname}
                  contentClassName="space-y-5"
                >
                  {renderPostCardBody()}
                  {activePost?.originUrl ? (
                    <p className="text-xs text-muted-foreground">发布于 {postHostname}</p>
                  ) : null}
                </BlueskyCard>

                <div ref={commentCardRef}>
                  <BlueskyCard title="AI Comment" subtitle="实时生成" avatarVariant="secondary">
                    {renderCommentBody()}
                  </BlueskyCard>
                </div>
              </div>
              {shareReady ? (
                <div className="mt-10 flex flex-wrap items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => {
                      if (!activePostId) {
                        return
                      }
                      resetCommentStream()
                      clearCommentState({ skipSearchSync: true })
                      startStream(activePostId)
                      if (commentCardRef.current) {
                        // commentCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                  >
                    <RefreshCcw className="h-4 w-4" />
                    再来一条
                  </Button>
                  <Button variant="outline" size="sm" type="button" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                    复制链接
                  </Button>
                  <Button variant="ghost" size="sm" type="button" onClick={handleShareLink}>
                    <Share2 className="h-4 w-4" />
                    分享
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </div>
  )
}
