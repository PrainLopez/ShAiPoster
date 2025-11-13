import { v } from 'convex/values'
import { action, internalMutation, query } from './_generated/server'
import { internal } from './_generated/api'
import { ai,model } from './lib/ai';
import type { Id } from './_generated/dataModel';

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

export const generateCommentFromId = action({
    args: {
        postId: v.id('posts')
    },
    handler: async(ctx, args): Promise<{ commentId: Id<'comments'> }> => {
        const post = await ctx.runQuery(internal.post.getPostFromId, { postId: args.postId });
        if (!post) {
          throw new Error('Post not found');
        }
        const imageUrls = post.content?.type === "bluesky" ? post.content.imageUrl ?? [] : [];
        if(post.content?.type !== "bluesky" || (!post.content.text && imageUrls.length === 0)){
            throw new Error("Post content not found or unsupported type");
        }
        const userContentParts: Array<
            | { type: 'text'; text: string }
            | { type: 'image_url'; image_url: { url: string } }
        > = [];

        if (post.content.text) {
            userContentParts.push({
                type: 'text',
                text: `Here is the content: ${post.content.text}`,
            });
        }

        if (imageUrls.length > 0) {
            userContentParts.push({
                type: 'text',
                text: `The post also includes ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''}. Review them before crafting your toxic reply.`,
            });
            for (const url of imageUrls) {
                userContentParts.push({
                    type: 'image_url',
                    image_url: { url },
                });
            }
        }

        if (userContentParts.length === 0) {
            userContentParts.push({
                type: 'text',
                text: 'No textual content or images could be extracted from this post.',
            });
        }

        const completion = await ai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: `You are a playful and toxic AI junior Web developer girl.
I am giving you some tech-related Twitter or blogs, try to comment in a toxic but friendly way. 
Control the length within 50 words.
Don't use emojis in your comment.`
            },
            {
              role: 'user',
              content: userContentParts
            }
          ]
        });
        const commentId = await ctx.runMutation(internal.comment.addComment, {
            postId: args.postId,
            content: completion.choices[0].message?.content || "",
        });
        return { commentId };
    },
});

export const getCommentById = query({
    args: {
        commentId: v.id('comments'),
    },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.commentId);
    },
});
