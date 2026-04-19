import { db, Comment, Rating } from 'astro:db';

export default async function () {
  await db.insert(Comment).values([
    { id: 1, postSlug: 'sample-post', postType: 'post', author: 'Ali', body: 'Great article!', createdAt: new Date('2025-01-01') },
    { id: 2, postSlug: 'sample-post', postType: 'post', author: 'Sara', body: 'Very helpful, thanks!', createdAt: new Date('2025-01-02') },
  ]);

  await db.insert(Rating).values([
    { id: 1, postSlug: 'sample-post', postType: 'post', value: 5, createdAt: new Date('2025-01-01') },
    { id: 2, postSlug: 'sample-post', postType: 'post', value: 4, createdAt: new Date('2025-01-02') },
  ]);
}
