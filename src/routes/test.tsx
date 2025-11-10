import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'

function getConvexSiteUrl() {
  let convexSiteUrl;
  if (import.meta.env.VITE_CONVEX_URL.includes(".cloud")) {
    convexSiteUrl = import.meta.env.VITE_CONVEX_URL.replace(
      /\.cloud$/,
      ".site"
    );
  } else {
    const url = new URL(import.meta.env.VITE_CONVEX_URL);
    url.port = String(Number(url.port) + 1);
    convexSiteUrl = url.toString();
  }
  return convexSiteUrl;
}

export const Route = createFileRoute('/test')({
  component: TestPage,
})

type AddPostResult =
  | { message: 'created'; postId: Id<'posts'> }
  | { message: 'exists'; post: { _id: Id<'posts'>; originUrl: string; content?: PostContent } }

type PostContent =
  | {
      type: 'bluesky'
      did: string
      text?: string
      imageUrl?: Array<string>
    }

type PostDoc = {
  _id: Id<'posts'>
  originUrl: string
  content?: PostContent
}

function TestPage() {
  const [postUrl, setPostUrl] = useState('')
  const [activePostId, setActivePostId] = useState<Id<'posts'> | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [streamedComment, setStreamedComment] = useState<string>('')
  const [streamError, setStreamError] = useState<string>('')
  const [commentId, setCommentId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  const addPost = useMutation(api.post.addPostFromUrl)
  const posts = useQuery(api.post.getPosts, { count: 20 }) as Array<PostDoc> | undefined

  const activePost = useMemo(() => {
    if (!posts || !activePostId) {
      return null
    }
    return posts.find((post) => post._id === activePostId) ?? null
  }, [posts, activePostId])

  const imageUrls = useMemo(() => {
    if (!activePost || activePost.content?.type !== 'bluesky') {
      return [] as Array<string>
    }
    return activePost.content.imageUrl ?? []
  }, [activePost])

  useEffect(() => {
    if (!activePostId || !activePost) {
      return
    }
    const hasRenderableContent = Boolean(activePost.content?.text) || imageUrls.length > 0
    if (!hasRenderableContent) {
      return
    }
    if (eventSourceRef.current) {
      return
    }

    setStatusMessage('Streaming comment...')
    setStreamError('')
    setStreamedComment('')
    setCommentId(null)

    const source = new EventSource(`${getConvexSiteUrl()}/comment/completion?postId=${activePostId}`)
    eventSourceRef.current = source

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
          setCommentId(payload.commentId)
        }
      } catch (error) {
        console.error('Failed to parse completion payload', error)
      } finally {
        setStatusMessage('Comment generation complete')
        source.close()
        eventSourceRef.current = null
      }
    })

    const handleError = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data) as { message?: string }
        setStreamError(payload.message ?? 'Stream error')
      } catch (error) {
        setStreamError('Stream error')
      } finally {
        setStatusMessage('Comment generation failed')
        source.close()
        eventSourceRef.current = null
      }
    }

    source.addEventListener('error', handleError as EventListener)

    return () => {
      source.close()
      eventSourceRef.current = null
    }
  }, [activePostId, activePost, imageUrls])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (!postUrl) {
      return
    }

    eventSourceRef.current?.close()
    eventSourceRef.current = null
    setStreamedComment('')
    setStreamError('')
    setCommentId(null)
    setStatusMessage('Submitting post...')

    try {
      const result = (await addPost({ postUrl })) as AddPostResult
      if (result.message === 'created') {
        setStatusMessage('Post created. Waiting for content...')
        setActivePostId(result.postId)
      } else {
        setStatusMessage('Post already exists. Loading content...')
        setActivePostId(result.post._id)
      }
    } catch (error) {
      console.error(error)
      setStatusMessage('Failed to submit post')
    }
  }

  const contentReady = Boolean(activePost?.content?.text) || imageUrls.length > 0

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Toxic Comment Playground</h1>
          <p className="text-sm text-gray-500">
            Paste a Bluesky post URL to mirror the backend flow and stream a generated comment.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm">
          <label htmlFor="postUrl" className="text-sm font-medium text-gray-700">
            Bluesky Post URL
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              id="postUrl"
              type="url"
              value={postUrl}
              onChange={(event) => setPostUrl(event.target.value)}
              placeholder="https://bsky.app/profile/..."
              className="w-full flex-1 rounded border border-gray-200 px-3 py-2 text-sm shadow-sm focus:border-gray-400 focus:outline-none"
              required
            />
            <button
              type="submit"
              className="rounded bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800"
            >
              Add &amp; Stream
            </button>
          </div>
          {statusMessage ? <p className="text-xs text-gray-500">{statusMessage}</p> : null}
        </form>

        {activePost ? (
          <article className="flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Post Preview</h2>
              <p className="text-xs text-gray-500">Origin: {activePost.originUrl}</p>
            </div>
            {contentReady ? (
              <div className="space-y-4">
                {activePost.content?.text ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
                    {activePost.content.text}
                  </p>
                ) : null}
                {imageUrls.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {imageUrls.map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt="Post asset"
                        className="h-48 w-full rounded-lg object-cover"
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Waiting for post content...</p>
            )}
          </article>
        ) : null}

        {streamedComment || streamError ? (
          <aside className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold">Generated Comment</h3>
            {streamError ? (
              <p className="text-sm text-red-500">{streamError}</p>
            ) : (
              <p className="whitespace-pre-line text-sm leading-relaxed text-gray-800">
                {streamedComment || 'Awaiting tokens...'}
              </p>
            )}
            {commentId ? (
              <p className="text-xs text-gray-400">Stored as comment ID: {commentId}</p>
            ) : null}
          </aside>
        ) : null}
      </section>
    </main>
  )
}
