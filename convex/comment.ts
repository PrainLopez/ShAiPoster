import { v } from 'convex/values'
import { internalAction, mutation, query,action, internalMutation } from './_generated/server'
import { api, internal } from './_generated/api'
import { getBlueSkyPostFromUrl } from './lib/bluesky';
import { ai,model } from './lib/ai';
import { Id } from './_generated/dataModel';

export const addComment = internalMutation({
    args: {
        postId: v.id('posts'),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const commentId = await ctx.db
            .insert('comments', {
                postId: args.postId,
                content: args.content,
            });
        return commentId;
    },
});


export const generateCommentFromUrl = action({
    args: {
        postUrl: v.string(),
        userId: v.string(),
    },
    handler: async (ctx, args) :  Promise<{ postId: Id<"posts">, commentId: Id<"comments"> }> => {
        const { uri,text } = await getBlueSkyPostFromUrl(args.postUrl);

        const postId = await ctx.runMutation(internal.post.addPost, {
            userId: args.userId,
            did: uri,
            text: text,
        });

        const completion = await ai.chat.completions.create({
            model: model,
            messages: [

                {
                    role: 'system',
                    content: `You are a playful and toxic AI junior Web developer girl.
I am giving you some tech-related Twitter or blogs, try to comment in a toxic but reasonable way.`,
                },
                {
                    role: 'user',
                    content: `Here is the content: ${text}`,
                }
            ],

        });

        const commentId = await ctx.runMutation(internal.comment.addComment, {
            postId: postId,
            content: completion.choices[0].message?.content || "",
        });

        return { postId, commentId };
    },
});
