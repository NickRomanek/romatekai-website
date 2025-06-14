'use client';

import { useState, useEffect } from 'react';

export default function AIAdminPage() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [tags, setTags] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch posts
  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blog');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete post
  const deletePost = async (postId: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/blog?id=${postId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Post deleted successfully!');
        fetchPosts(); // Refresh the list
      } else {
        const errorData = await response.json();
        setMessage(`Error: ${errorData.error || 'Failed to delete post'}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    }
  };

  // Fetch posts on component mount
  useEffect(() => {
    fetchPosts();
  }, []);

  // Utility to generate a slug from the title
  function generateSlug(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .substring(0, 100);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (image) {
        const formData = new FormData();
        formData.append('image', image);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.imageUrl;
      }

      // Process tags
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Use provided slug or auto-generate from title
      const finalSlug = slug.trim() ? slug.trim() : generateSlug(title);

      // Create blog post
      const response = await fetch('/api/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          slug: finalSlug,
          body,
          image_url: imageUrl,
          tags: tagArray,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create blog post');
      }

      setMessage('Blog post created successfully!');
      setTitle('');
      setSlug('');
      setBody('');
      setImage(null);
      setTags('');
      // Reset file input
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Refresh posts list
      fetchPosts();
      
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadTestPost = () => {
    setTitle("Test Post with Rich Formatting");
    setBody(`# Welcome to the Test Post

This is a test post to verify rich formatting works correctly.

## Features We're Testing

Here's what we're testing:
- **Bold text** and *italic text*
- [Links](https://romatekai.com)
- Lists (both ordered and unordered)
- Blockquotes
- And more!

### Code Example
\`\`\`javascript
console.log("Hello, World!");
\`\`\`

> This is a blockquote. It should be properly styled and indented.

#### Ordered List
1. First item
2. Second item
3. Third item

#### Unordered List
* Item one
* Item two
* Item three

### Final Thoughts
This post should demonstrate all the rich formatting capabilities of our blog system. If everything is working correctly, you should see:

1. Properly styled headers
2. Formatted lists
3. Styled blockquotes
4. Bold and italic text
5. Code blocks
6. Links

Let me know if you see any formatting issues!`);
  };

  // Just show the admin interface directly for now

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4 relative">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6 text-gray-900">AI Admin Dashboard</h1>
        <p className="text-lg text-gray-700 mb-10">
          Welcome to the RomaTek AI admin panel. Here you can manage the site and upload blog posts.
        </p>
        
        {/* Create Blog Post Section */}
        <div className="bg-white rounded-xl shadow p-6 text-left mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Create New Blog Post</h2>
            <button
              onClick={loadTestPost}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Load Test Post
            </button>
          </div>
          
          {message && (
            <div className={`mb-4 p-3 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-900 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (!slug) setSlug(generateSlug(e.target.value));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="Enter blog post title"
                required
              />
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-semibold text-gray-900 mb-1">
                Slug (URL-friendly, e.g. ai-assisted-web-development)
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={e => setSlug(generateSlug(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="e.g. ai-assisted-web-development"
                maxLength={100}
              />
              <p className="text-sm text-gray-600 mt-1">Leave blank to auto-generate from title. Must be unique.</p>
            </div>
            
            <div>
              <label htmlFor="image" className="block text-sm font-semibold text-gray-900 mb-1">
                Image (Optional)
              </label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
              />
              <p className="text-sm text-gray-600 mt-1">Supports JPEG, PNG, GIF. Max size: 5MB</p>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-semibold text-gray-900 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium"
                placeholder="e.g., AI, Technology, Machine Learning"
              />
              <p className="text-sm text-gray-600 mt-1">Separate multiple tags with commas</p>
            </div>
            
            <div>
              <label htmlFor="body" className="block text-sm font-semibold text-gray-900 mb-1">
                Content
              </label>
              <textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 font-medium placeholder-gray-500"
                placeholder="Write your blog post content here..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Blog Post'}
            </button>
          </form>
        </div>

        {/* Manage Blog Posts Section */}
        <div className="bg-white rounded-xl shadow p-6 text-left">
          <h2 className="text-2xl font-semibold mb-4">Manage Blog Posts</h2>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No blog posts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <div key={post.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        {post.image_url && (
                          <img 
                            src={post.image_url} 
                            alt={post.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 break-words mb-2">{post.title}</h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {new Date(post.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
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
                          <p className="text-gray-700 text-sm break-words">
                            {post.body.length > 150 ? `${post.body.substring(0, 150)}...` : post.body}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deletePost(post.id, post.title)}
                      className="bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-red-700 transition flex-shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 