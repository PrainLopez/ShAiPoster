import { v } from 'convex/values'
import { internalMutation, mutation, query, } from './_generated/server'
import { api } from './_generated/api'

export const getPosts = query({
  args: {
    count: v.number(),
  },
  handler: async (ctx, args) => {
    const posts = await ctx.db
      .query('posts')
      .order('desc')
      .take(args.count)
    return posts.reverse()
  },
})



export const addPost = internalMutation({
    args: {
        userId: v.string(),
        did: v.string(),
        text: v.string(),
        imageUrl: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const postId = await ctx.db
            .insert('posts', {
                userId: args.userId,
                did: args.did,
                text: args.text,
                imageUrl: args.imageUrl,
            });
        return postId;
    },
})