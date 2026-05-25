'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  MessageSquare, Heart, Image as ImageIcon, Send, Globe, 
  Sparkles, Clock, Trash2, Loader2, Link as LinkIcon 
} from 'lucide-react';

interface Blog {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  avatar_url?: string;
  title: string;
  content: string;
  image_url?: string;
  created_at: string;
}

export default function BlogFeedPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Likes/Comments simulator
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `blog-images/${fileName}`;
      
      // Attempt upload to 'images' bucket first
      let { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.log('Upload to images bucket failed, trying public bucket fallback...', error.message);
        
        // Fallback to 'public' bucket
        const { data: fallbackData, error: fallbackError } = await supabase.storage
          .from('public')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (fallbackError) {
          throw fallbackError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
          
        setImageUrl(publicUrl);
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);
          
        setImageUrl(publicUrl);
      }
    } catch (err: any) {
      alert(`Image upload failed: ${err.message || err}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // Fetch blogs and auth user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    fetchBlogs();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time subscription to Supabase orbit_blogs table
  useEffect(() => {
    const channel = supabase
      .channel('realtime_blogs')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orbit_blogs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newBlog = payload.new as Blog;
            setBlogs((prev) => [newBlog, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old.id;
            setBlogs((prev) => prev.filter((b) => b.id !== oldId));
          } else if (payload.eventType === 'UPDATE') {
            const updatedBlog = payload.new as Blog;
            setBlogs((prev) => prev.map((b) => b.id === updatedBlog.id ? updatedBlog : b));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orbit_blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching blogs:', error);
      } else {
        setBlogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('orbit_blogs').insert({
        user_id: currentUser.id,
        user_email: currentUser.email,
        user_name: currentUser.user_metadata?.full_name || currentUser.email.split('@')[0],
        avatar_url: currentUser.user_metadata?.avatar_url || '',
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl.trim() || null,
      });

      if (error) {
        alert(`Failed to post: ${error.message}`);
      } else {
        // Reset form
        setTitle('');
        setContent('');
        setImageUrl('');
        setShowForm(false);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      const { error } = await supabase.from('orbit_blogs').delete().eq('id', id);
      if (error) alert(`Failed to delete: ${error.message}`);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const authorInitials = (name: string) => {
    return (name || 'U').substring(0, 2).toUpperCase();
  };

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', paddingBottom: 60, fontFamily: 'Inter, sans-serif' }}>
      
      {/* Immersive glow background elements */}
      <div style={{ position: 'fixed', width: 400, height: 400, top: '10%', left: '50%', transform: 'translateX(-50%)', background: 'radial-gradient(circle, rgba(99,102,241,0.04) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Feed Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, position: 'relative', zIndex: 1 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 10, letterSpacing: '-0.02em' }}>
            <MessageSquare size={26} style={{ color: 'var(--accent-blue)' }} />
            Developer Arena Feed
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0', fontSize: '0.875rem' }}>
            Share ideas, code snippets, and system designs in real time with Orbit developers.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '9px 18px',
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
            border: 'none',
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(79,140,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'transform 0.16s'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <Sparkles size={14} />
          {showForm ? 'Cancel Post' : 'Compose Post'}
        </button>
      </div>

      {/* Post Composer Card */}
      {showForm && (
        <div style={{
          background: 'rgba(6,9,18,0.85)',
          border: '1.5px solid rgba(79,140,255,0.22)',
          borderRadius: 18,
          padding: 24,
          marginBottom: 28,
          position: 'relative',
          zIndex: 10,
          backdropFilter: 'blur(16px)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)'
        }}>
          <h3 style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: '#fbbf24' }} /> Compose a new update
          </h3>

          <form onSubmit={handlePostSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title of your post..."
                required
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What is on your mind? Share code configs, milestones, or questions..."
                required
                rows={4}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Image URL Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '2px 10px' }}>
                <LinkIcon size={14} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Attach image URL (optional)..."
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    padding: '8px 4px',
                    color: '#fff',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Native S3 File Upload Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(79,140,255,0.08)',
                    border: '1px solid rgba(79,140,255,0.25)',
                    color: '#60a5fa',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { if (!uploadingImage) e.currentTarget.style.background = 'rgba(79,140,255,0.14)'; }}
                  onMouseLeave={e => { if (!uploadingImage) e.currentTarget.style.background = 'rgba(79,140,255,0.08)'; }}
                >
                  {uploadingImage ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <ImageIcon size={13} />
                  )}
                  <span>{uploadingImage ? 'Uploading image...' : 'Upload Local Image File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
                {imageUrl && (
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 650, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ✓ Image attached successfully
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send size={13} />
                    Post Update
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blogs feed list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 1 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-secondary)' }}>
            <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--accent-blue)' }} />
            Streaming feed data packets...
          </div>
        ) : blogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 18, color: 'var(--text-secondary)' }}>
            <Globe size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>No posts on the feed yet</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Be the first architect to share an update with the collective.</div>
          </div>
        ) : (
          blogs.map((blog) => {
            const userIsAuthor = currentUser && currentUser.id === blog.user_id;
            const userLiked = likedPosts.has(blog.id);

            return (
              <article
                key={blog.id}
                style={{
                  background: 'rgba(6,9,18,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 18,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(79,140,255,0.18)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
              >
                {/* Author Info row */}
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Glowing Author Avatar */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        fontWeight: 800,
                        color: '#fff',
                        border: '1.5px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        flexShrink: 0,
                        overflow: 'hidden'
                      }}
                    >
                      {blog.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={blog.avatar_url} alt={blog.user_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        authorInitials(blog.user_name)
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{blog.user_name}</span>
                        {userIsAuthor && (
                          <span style={{ fontSize: '0.62rem', padding: '1px 6px', background: 'rgba(79,140,255,0.12)', color: 'var(--accent-blue)', borderRadius: 4, fontWeight: 700 }}>YOU</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        <span>{blog.user_email}</span>
                        <span>•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {formatDate(blog.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {userIsAuthor && (
                    <button
                      onClick={() => handleDeleteBlog(blog.id)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.08)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Content area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.3 }}>
                    {blog.title}
                  </h2>
                  <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {blog.content}
                  </p>
                </div>

                {/* Attached Image */}
                {blog.image_url && (
                  <div style={{ width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#020408' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={blog.image_url}
                      alt="Post visual attachment"
                      style={{
                        width: '100%',
                        maxHeight: 380,
                        objectFit: 'cover',
                        display: 'block',
                        transition: 'transform 0.3s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.015)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                    />
                  </div>
                )}

                {/* Reactions Action Row */}
                <div style={{ display: 'flex', gap: 24, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12, marginTop: 4 }}>
                  <button
                    onClick={() => toggleLike(blog.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: userLiked ? '#ef4444' : 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'color 0.15s'
                    }}
                  >
                    <Heart size={15} fill={userLiked ? '#ef4444' : 'transparent'} />
                    <span>{userLiked ? 'Liked' : 'Like'}</span>
                  </button>

                  <button
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <MessageSquare size={15} />
                    <span>Comment</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

    </div>
  );
}
