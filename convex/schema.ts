import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  posts: defineTable({
    userId: v.string(),
    did: v.optional(v.string()),
    text: v.optional(v.string()),
    imageUrl: v.optional(v.array(v.string())),
  }),
  comments: defineTable({
    postId: v.id('posts'),
    content: v.optional(v.string()),
  }),
});


