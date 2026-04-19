import { defineDb, defineTable, column } from 'astro:db';

const Comment = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    postSlug: column.text(),
    postType: column.text({ default: 'post' }),
    author: column.text(),
    body: column.text(),
    approved: column.number({ default: 0 }),
    createdAt: column.date(),
  },
});

const Rating = defineTable({
  columns: {
    id: column.number({ primaryKey: true }),
    postSlug: column.text(),
    postType: column.text({ default: 'post' }),
    value: column.number(),
    createdAt: column.date(),
  },
});

export default defineDb({
  tables: { Comment, Rating },
});
