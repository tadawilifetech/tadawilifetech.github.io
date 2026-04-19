import { db, Comment, Rating, eq, and, avg } from 'astro:db';
import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';

export const server = {
  addComment: defineAction({
    accept: 'json',
    input: z.object({
      postSlug: z.string().min(1),
      postType: z.enum(['post', 'product']),
      author: z.string().min(1).max(100),
      body: z.string().min(1).max(2000),
    }),
    handler: async (input) => {
      const result = await db.insert(Comment).values({
        postSlug: input.postSlug,
        postType: input.postType,
        author: input.author,
        body: input.body,
        createdAt: new Date(),
      }).returning();
      return result[0];
    },
  }),

  getComments: defineAction({
    accept: 'json',
    input: z.object({
      postSlug: z.string().min(1),
      postType: z.enum(['post', 'product']),
    }),
    handler: async (input) => {
      const comments = await db
        .select()
        .from(Comment)
        .where(
          and(
            eq(Comment.postSlug, input.postSlug),
            eq(Comment.postType, input.postType),
          ),
        )
        .orderBy(Comment.createdAt);
      return comments;
    },
  }),

  addRating: defineAction({
    accept: 'json',
    input: z.object({
      postSlug: z.string().min(1),
      postType: z.enum(['post', 'product']),
      value: z.number().int().min(1).max(5),
    }),
    handler: async (input) => {
      await db.insert(Rating).values({
        postSlug: input.postSlug,
        postType: input.postType,
        value: input.value,
        createdAt: new Date(),
      });

      const ratings = await db
        .select({ avgRating: avg(Rating.value) })
        .from(Rating)
        .where(
          and(
            eq(Rating.postSlug, input.postSlug),
            eq(Rating.postType, input.postType),
          ),
        );

      const count = await db
        .select()
        .from(Rating)
        .where(
          and(
            eq(Rating.postSlug, input.postSlug),
            eq(Rating.postType, input.postType),
          ),
        );

      return {
        average: Number(ratings[0]?.avgRating ?? 0),
        count: count.length,
      };
    },
  }),

  getRating: defineAction({
    accept: 'json',
    input: z.object({
      postSlug: z.string().min(1),
      postType: z.enum(['post', 'product']),
    }),
    handler: async (input) => {
      const ratings = await db
        .select({ avgRating: avg(Rating.value) })
        .from(Rating)
        .where(
          and(
            eq(Rating.postSlug, input.postSlug),
            eq(Rating.postType, input.postType),
          ),
        );

      const count = await db
        .select()
        .from(Rating)
        .where(
          and(
            eq(Rating.postSlug, input.postSlug),
            eq(Rating.postType, input.postType),
          ),
        );

      return {
        average: Number(ratings[0]?.avgRating ?? 0),
        count: count.length,
      };
    },
  }),
};
