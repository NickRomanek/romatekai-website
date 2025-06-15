'use client';

import React, { useState, useEffect } from 'react';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [expandedPost, setExpandedPost] = useState<any | null>(null);

  useEffect(() => {
    async function fetchPosts() {
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
      }
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-0 px-0">
      {/* Header/Menu Bar */}
      <header className="bg-white shadow sticky top-0 z-30 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <a href="/" className="text-xl font-bold text-blue-700 cursor-pointer">
            RomaTek <span className="text-gray-700">AI Solutions</span>
          </a>
          <nav>
            <a href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">Home</a>
          </nav>
        </div>
      </header>
      <div className="w-4/5 mx-auto py-16 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-6 text-gray-900">RomaTek AI Blog</h1>
          <p className="text-lg text-gray-700">
            Stay updated with the latest insights in AI and technology.
          </p>
        </div>
        
        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post: any) => (
              <article 
                key={post.id} 
                className="bg-white rounded-xl shadow p-6 cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setExpandedPost(post)}
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {post.image_url && (
                    <div className="md:w-1/3 flex-shrink-0">
                      <img 
                        src={post.image_url} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className={`${post.image_url ? "md:w-2/3" : "w-full"} min-w-0`}>
                    <h2 className="text-2xl font-bold mb-3 text-gray-900 break-words">{post.title}</h2>
                    <div className="text-gray-600 mb-4 text-sm">
                      {new Date(post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags.map((tag: any) => (
                          <span
                            key={tag.id}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-gray-700 leading-relaxed">
                      {post.body.split('\n').slice(0, 3).map((paragraph: string, index: number) => (
                        <p key={index} className="mb-4 last:mb-0 break-words overflow-hidden">
                          {paragraph.length > 200 ? `${paragraph.substring(0, 200)}...` : paragraph}
                        </p>
                      ))}
                      {post.body.split('\n').length > 3 && (
                        <p className="text-blue-600 font-semibold">Click to read more...</p>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Modal for expanded post */}
      {expandedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center"
              onClick={() => setExpandedPost(null)}
            >
              ×
            </button>
            <div className="p-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {expandedPost.image_url && (
                  <div className="lg:w-1/3 flex-shrink-0">
                    <img 
                      src={expandedPost.image_url} 
                      alt={expandedPost.title}
                      className="w-full h-64 lg:h-80 object-cover rounded-lg"
                    />
                  </div>
                )}
                <div className={`${expandedPost.image_url ? "lg:w-2/3" : "w-full"} min-w-0`}>
                  <h1 className="text-3xl font-bold mb-4 text-gray-900 break-words">{expandedPost.title}</h1>
                  <div className="text-gray-600 mb-6 text-sm">
                    {new Date(expandedPost.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {expandedPost.tags && expandedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {expandedPost.tags.map((tag: any) => (
                        <span
                          key={tag.id}
                          className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-gray-700 leading-relaxed space-y-4">
                    {expandedPost.body.split('\n').map((paragraph: string, index: number) => (
                      <p key={index} className="break-words overflow-wrap-anywhere">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 