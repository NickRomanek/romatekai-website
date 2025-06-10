import { NextRequest, NextResponse } from 'next/server';
import { db, blogPosts } from '../../lib/db';
import { desc, eq } from 'drizzle-orm';

// GET - Fetch all blog posts
export async function GET() {
  try {
    const posts = await db.select().from(blogPosts).orderBy(desc(blogPosts.created_at));
    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const { title, body, image_url } = await request.json();
    
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const newPost = await db.insert(blogPosts).values({
      title,
      body,
      image_url: image_url || null,
    }).returning();

    return NextResponse.json(newPost[0], { status: 201 });
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