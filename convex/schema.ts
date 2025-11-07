import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  posts: defineTable({
    id: v.id('posts'),
    postUrl: v.string(),
    promptInupt: v.string(),
    modelResponse: v.array(v.string()),
  }),
})
