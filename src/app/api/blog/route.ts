import { NextRequest, NextResponse } from 'next/server';
import { db, blogPosts, tags, blogPostTags } from '../../lib/db';
import { desc, eq, inArray } from 'drizzle-orm';

// GET - Fetch all blog posts with their tags
export async function GET() {
  try {
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.created_at));
    
    // Fetch tags for each post
    const postsWithTags = await Promise.all(posts.map(async (post) => {
      const postTags = await db
        .select({
          id: tags.id,
          name: tags.name,
        })
        .from(blogPostTags)
        .innerJoin(tags, eq(blogPostTags.tag_id, tags.id))
        .where(eq(blogPostTags.post_id, post.id));
      
      return {
        ...post,
        tags: postTags,
      };
    }));

    return NextResponse.json(postsWithTags);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// POST - Create a new blog post with tags
export async function POST(request: NextRequest) {
  try {
    const { title, slug, body, image_url, tags: tagNames } = await request.json();
    
    if (!title || !body || !slug) {
      return NextResponse.json({ error: 'Title, slug, and body are required' }, { status: 400 });
    }

    // Start a transaction
    const result = await db.transaction(async (tx) => {
      // Create the blog post
      const [newPost] = await tx.insert(blogPosts).values({
        title,
        slug,
        body,
        image_url: image_url || null,
      }).returning();

      // If tags are provided, create them and link to the post
      if (tagNames && Array.isArray(tagNames) && tagNames.length > 0) {
        // Create tags if they don't exist
        const tagValues = tagNames.map(name => ({ name }));
        const [createdTags] = await tx.insert(tags)
          .values(tagValues)
          .onConflictDoNothing()
          .returning();

        // Get all tag IDs (both existing and newly created)
        const allTags = await tx.select().from(tags)
          .where(inArray(tags.name, tagNames));

        // Create blog post - tag relationships
        await tx.insert(blogPostTags).values(
          allTags.map(tag => ({
            post_id: newPost.id,
            tag_id: tag.id,
          }))
        );
      }

      return newPost;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

// DELETE - Delete a blog post by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    const deletedPost = await db.delete(blogPosts)
      .where(eq(blogPosts.id, parseInt(id)))
      .returning();

    if (deletedPost.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
} 