import { notFound } from 'next/navigation';
import { db, blogPosts, tags, blogPostTags } from '../../lib/db';
import { eq } from 'drizzle-orm';
import SiteHeader from '../../components/SiteHeader';

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // Fetch the post by slug
  const postSlug = params.slug;
  if (!postSlug) return notFound();

  const posts = await db.select().from(blogPosts).where(eq(blogPosts.slug, postSlug));
  const post = posts[0];
  if (!post) return notFound();

  // Fetch tags for the post
  const postTags = await db
    .select({ id: tags.id, name: tags.name })
    .from(blogPostTags)
    .innerJoin(tags, eq(blogPostTags.tag_id, tags.id))
    .where(eq(blogPostTags.post_id, post.id));

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0">
      <SiteHeader />
      <div className="py-12 px-4 flex justify-center">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-8">
          <div className="flex flex-row gap-8 items-start mb-8">
            {post.image_url && (
              <div className="w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
              <h1 className="text-3xl font-bold text-gray-900 break-words mb-1">{post.title}</h1>
              <div className="text-gray-600 text-sm mb-1">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
              {postTags && postTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1">
                  {postTags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div
            className="text-gray-700 leading-relaxed prose max-w-none text-[0.95rem]"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>
      </div>
    </div>
  );
} 