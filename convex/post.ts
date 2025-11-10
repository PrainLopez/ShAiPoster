import { v } from 'convex/values'
import { action, internalAction, internalMutation, internalQuery, mutation, query, } from './_generated/server'
import { api, internal } from './_generated/api'
import { getBlueSkyPostFromUrl } from './lib/bluesky';

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

export const patchBlueSkyPost = internalMutation({
    args: {
        id: v.id('posts'),
        did: v.string(),
        text: v.string(),
        imageUrl: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.id);
        if(!post) {
            throw new Error("Post not found");
        }
        if(post.content){
            throw new Error("Post already has content");
        }
        post.content = {
            type: "bluesky",
            did: args.did,
            text: args.text,
            imageUrl: args.imageUrl,
        };
        await ctx.db.patch(args.id, post);
    },
})

export const addBlueSkyPostFromUrl = internalAction({
    args: {
        id: v.id('posts'),
        postUrl: v.string()
    },
    handler: async (ctx, args) => {
        const { uri,text, images } =  await getBlueSkyPostFromUrl(args.postUrl)

        await ctx.scheduler.runAfter(0, internal.post.patchBlueSkyPost, { id: args.id, did: uri, text: text,imageUrl: images.map(img => img.url) });
    }
});

export const addPostFromUrl = mutation({
    args: {
        postUrl: v.string()
    },
    handler: async (ctx, args) => {
        const post = await ctx.db.query('posts').withIndex('byOriginUrl', (q) => q.eq('originUrl', args.postUrl)).first();
        if(post){
            return {
                message: "exists",
                post
            };
        }
        const postId = await ctx.db.insert('posts',{
            originUrl: args.postUrl
        })
        await ctx.scheduler.runAfter(0,internal.post.addBlueSkyPostFromUrl, {id: postId, postUrl: args.postUrl})
        return {
            message: "created",
            postId
        };
    },
})

export const getPostFromId = internalQuery({
    args: {
        postId: v.id('posts')
    },
    handler: async(ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if(!post){
            throw new Error("Post not found");
        }
        return post;
    },
});  