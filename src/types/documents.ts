import type { Id } from '../../convex/_generated/dataModel'

export type PostContent =
  | {
      type: 'bluesky'
      did: string
      text?: string
      imageUrl?: Array<string>
    }

export type PostDoc = {
  _id: Id<'posts'>
  originUrl: string
  content?: PostContent
}

export type CommentDoc = {
  _id: Id<'comments'>
  postId: Id<'posts'>
  content?: string
}
