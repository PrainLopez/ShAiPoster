import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { ai, model } from './lib/ai';

const http = httpRouter();

http.route({
  path: '/comment/completion',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const postIdParam = url.searchParams.get('postId');
    if (!postIdParam) {
      return new Response('Missing postId', { status: 400 });
    }

    // FIXME: Validate postId format
    const postId = postIdParam as Id<'posts'>;

    let post; // Ensure the post exists before streaming.
    try {
      post = await ctx.runQuery(internal.post.getPostFromId, { postId });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Post not found';
      return new Response(message, { status: 404 });
    }

    const imageUrls = post.content?.type === 'bluesky' ? (post.content.imageUrl ?? []) : [];
    if (post.content?.type !== 'bluesky' || (!post.content.text && imageUrls.length === 0)) {
      return new Response('Post content not found or unsupported type', {
        status: 422
      });
    }

    const userContentParts: Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }> = [];

    if (post.content.text) {
      userContentParts.push({
        type: 'text',
        text: `Here is the content: ${post.content.text}`
      });
    }

    if (imageUrls.length > 0) {
      userContentParts.push({
        type: 'text',
        text: `The post also includes ${imageUrls.length} image${imageUrls.length > 1 ? 's' : ''}. Review them before crafting your toxic reply.`
      });
      for (const url of imageUrls) {
        userContentParts.push({
          type: 'image_url',
          image_url: { url }
        });
      }
    }

    if (userContentParts.length === 0) {
      userContentParts.push({
        type: 'text',
        text: 'No textual content or images could be extracted from this post.'
      });
    }

    const completionIterable = await ai.chat.completions.create({
      model,
      stream: true,
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
      ],
      reasoning_effort: 'minimal'
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (payload: unknown, event?: string) => {
          const eventLine = event ? `event: ${event}\n` : '';
          const dataLine = `data: ${JSON.stringify(payload)}\n\n`;
          controller.enqueue(encoder.encode(`${eventLine}${dataLine}`));
        };

        let content = '';
        send({ status: 'started' }, 'start');

        try {
          for await (const chunk of completionIterable) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (!delta) {
              continue;
            }
            content += delta;
            send({ delta });
          }

          const commentId = await ctx.runMutation(internal.comment.addComment, {
            postId,
            content
          });

          send({ commentId }, 'complete');
          controller.close();
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          send({ message }, 'error');
          controller.close();
        }
      }
    });

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    });
  })
});
export default http;
