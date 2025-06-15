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

  // Modal close handler for overlay click
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (e.target === e.currentTarget) {
      setExpandedPost(null);
    }
  }

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
          <div className="space-y-6">
            {posts.map((post: any) => (
              <article 
                key={post.id} 
                className="bg-white rounded-xl shadow p-4 flex gap-4 items-start cursor-pointer hover:shadow-lg transition-shadow max-h-40 overflow-hidden"
                onClick={() => setExpandedPost(post)}
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
            ))}
          </div>
        )}
      </div>

      {/* Modal for expanded post */}
      {expandedPost && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleOverlayClick}
        >
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-bold z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center border border-gray-200"
              onClick={() => setExpandedPost(null)}
              aria-label="Close"
              tabIndex={0}
            >
              ×
            </button>
            <div className="p-8">
              {/* Top row: image, title, date, tags */}
              <div className="flex flex-row gap-8 items-start mb-8">
                {expandedPost.image_url && (
                  <div className="w-40 h-40 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={expandedPost.image_url}
                      alt={expandedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
                  <h1 className="text-3xl font-bold text-gray-900 break-words mb-1">{expandedPost.title}</h1>
                  <div className="text-gray-600 text-sm mb-1">
                    {new Date(expandedPost.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                  {expandedPost.tags && expandedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-1">
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
                </div>
              </div>
              {/* Body/content full width */}
              <div
                className="text-gray-700 leading-relaxed prose max-w-none text-[0.95rem]"
                dangerouslySetInnerHTML={{ __html: expandedPost.body }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 