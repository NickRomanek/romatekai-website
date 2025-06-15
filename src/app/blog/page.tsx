'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/blog', {
          cache: 'no-store'
        });
        if (!response.ok) {
          throw new Error('Failed to fetch blog posts');
        }
        const data = await response.json();
        setPosts(data);
      } catch (error) {
        console.error('Error fetching blog posts:', error);
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0">
      <SiteHeader />
      <div className="w-4/5 mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">RomaTek AI Blog</h1>
          <p className="text-lg text-gray-700">
            Stay updated with the latest insights in AI and technology.
          </p>
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading blog posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="block"
              >
                <article
                  className="bg-white rounded-xl shadow p-4 flex gap-4 items-start cursor-pointer hover:shadow-lg transition-shadow max-h-40 overflow-hidden"
                  style={{ minHeight: '120px' }}
                >
                  {post.image_url && (
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold mb-1 text-gray-900 break-words line-clamp-2">{post.title}</h2>
                    <div className="text-gray-500 mb-1 text-xs">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {post.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div
                      className="text-gray-700 text-sm leading-snug max-h-10 overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: post.body.length > 180 ? post.body.slice(0, 180) + '...' : post.body.split('\n').slice(0, 2).join(' ') }}
                    />
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 