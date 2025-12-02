/**
 * Ai-Auto Supabase Integration
 * Handles authentication and blog management
 * ============================================
 */

// ============================================
// SUPABASE CONFIGURATION
// ============================================

const SUPABASE_URL = 'https://qhmjyeohczpjgfzgxdjx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobWp5ZW9oY3pwamdmemd4ZGp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NDM5OTYsImV4cCI6MjA4MDIxOTk5Nn0.WiriJD4RXU45KdlJlBZhPQsnOQnhdlOE1njeqG7FYUU';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION MANAGER
// ============================================

class AuthManager {
  constructor() {
    this.sessionKey = 'supabase.auth.token';
    this.adminEmails = [
      'setyourownsalary@gmail.com',
    ];
    this.isInitialized = false;
    // Setup auth state listener immediately (non-async)
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user.email);
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        this.clearSession();
      }
    });
    // Mark as initialized
    this.isInitialized = true;
  }

  async init() {
    // Check for existing session
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Existing session found:', session.user.email);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    }
  }

  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { data: null, error };
      }

      console.log('Login successful:', data.user.email);
      return { data, error: null };
    } catch (error) {
      console.error('Login exception:', error);
      return { data: null, error };
    }
  }

  async logout() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('Logout error:', error.message);
        return;
      }

      console.log('Logout successful');
      this.clearSession();
      window.location.href = '/admin/login.html';
    } catch (error) {
      console.error('Logout exception:', error);
    }
  }

  async isAuthenticated() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session !== null && session.user !== null;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return false;

      return this.adminEmails.includes(user.email);
    } catch (error) {
      console.error('Admin check error:', error);
      return false;
    }
  }

  async protectAdminRoute() {
    const isAuth = await this.isAuthenticated();

    if (!isAuth) {
      console.warn('Unauthenticated access attempt - redirecting to login');
      window.location.href = '/admin/login.html';
      return false;
    }

    return true;
  }

  clearSession() {
    console.log('Session cleared');
  }
}

// ============================================
// BLOG MANAGER
// ============================================

class BlogManager {
  constructor() {
    this.tableName = 'blog_posts';
    this.storageBucket = 'blog-images';
  }

  // Get all published posts (public)
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Get posts error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get posts exception:', error);
      return { data: null, error };
    }
  }

  // Get all posts including drafts (admin)
  async getAllPostsAdmin() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Get admin posts error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get admin posts exception:', error);
      return { data: null, error };
    }
  }

  // Get single post by slug
  async getPostBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Get post by slug error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get post by slug exception:', error);
      return { data: null, error };
    }
  }

  // Get single post by ID
  async getPostById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get post by ID error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get post by ID exception:', error);
      return { data: null, error };
    }
  }

  // Create new blog post
  async createPost(postData) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      // Check for duplicate slug
      const { data: existingPost } = await this.getPostBySlug(postData.slug);
      if (existingPost) {
        return {
          data: null,
          error: { message: 'A post with this slug already exists. Please use a different slug.' }
        };
      }

      const post = {
        title: postData.title,
        slug: postData.slug,
        excerpt: postData.excerpt || null,
        content: postData.content,
        content_type: 'markdown',
        author_id: user.id,
        status: postData.status || 'draft',
        published_at: postData.status === 'published' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([post])
        .select()
        .single();

      if (error) {
        console.error('Create post error:', error.message);
        return { data: null, error };
      }

      console.log('Post created successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('Create post exception:', error);
      return { data: null, error };
    }
  }

  // Update existing blog post
  async updatePost(postId, postData) {
    try {
      // Check for duplicate slug (excluding current post)
      if (postData.slug) {
        const { data: existingPost } = await supabase
          .from(this.tableName)
          .select('id')
          .eq('slug', postData.slug)
          .neq('id', postId)
          .maybeSingle();

        if (existingPost) {
          return {
            data: null,
            error: { message: 'A different post with this slug already exists.' }
          };
        }
      }

      const updates = {
        ...postData,
        updated_at: new Date().toISOString(),
      };

      // Set published_at timestamp when publishing
      if (postData.status === 'published' && !postData.published_at) {
        updates.published_at = new Date().toISOString();
      }

      // Clear published_at when moving to draft
      if (postData.status === 'draft') {
        updates.published_at = null;
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('Update post error:', error.message);
        return { data: null, error };
      }

      console.log('Post updated successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('Update post exception:', error);
      return { data: null, error };
    }
  }

  // Delete blog post
  async deletePost(postId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', postId)
        .select()
        .single();

      if (error) {
        console.error('Delete post error:', error.message);
        return { data: null, error };
      }

      console.log('Post deleted successfully:', postId);
      return { data, error: null };
    } catch (error) {
      console.error('Delete post exception:', error);
      return { data: null, error };
    }
  }

  // Upload image to Supabase Storage
  async uploadImage(file) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { url: null, error: { message: 'User not authenticated' } };
      }

      // Create unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${randomStr}-${file.name}`;
      const filepath = `${filename}`;

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.storageBucket)
        .upload(filepath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Image upload error:', error.message);
        return { url: null, error };
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from(this.storageBucket)
        .getPublicUrl(filepath);

      console.log('Image uploaded successfully:', publicData.publicUrl);
      return { url: publicData.publicUrl, error: null };
    } catch (error) {
      console.error('Image upload exception:', error);
      return { url: null, error };
    }
  }

  // Delete image from storage
  async deleteImage(filepath) {
    try {
      const { error } = await supabase.storage
        .from(this.storageBucket)
        .remove([filepath]);

      if (error) {
        console.error('Image delete error:', error.message);
        return { error };
      }

      console.log('Image deleted successfully:', filepath);
      return { error: null };
    } catch (error) {
      console.error('Image delete exception:', error);
      return { error };
    }
  }

  // Render markdown to HTML
  renderMarkdown(markdown) {
    try {
      if (typeof marked === 'undefined') {
        console.warn('marked.js not loaded, returning raw markdown');
        return markdown;
      }

      // Configure marked options
      marked.setOptions({
        breaks: true,
        gfm: true,
      });

      const html = marked.parse(markdown);
      return this.sanitizeContent(html);
    } catch (error) {
      console.error('Markdown render error:', error);
      return markdown;
    }
  }

  // Basic XSS protection by removing dangerous tags
  sanitizeContent(html) {
    try {
      // If DOMPurify is available, use it for comprehensive sanitization
      if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
          ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'img', 'blockquote',
            'code', 'pre', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id'],
          ALLOW_DATA_ATTR: false
        });
      }

      // Fallback: Simple sanitization using textarea
      const div = document.createElement('div');
      div.textContent = html;
      return div.innerHTML;
    } catch (error) {
      console.error('Content sanitization error:', error);
      return html;
    }
  }
}

// ============================================
// INITIALIZE MANAGERS
// ============================================

const authManager = new AuthManager();
const blogManager = new BlogManager();

// Expose to global scope for access in HTML files
if (typeof window !== 'undefined') {
  window.authManager = authManager;
  window.blogManager = blogManager;
  window.supabase = supabase;
}

console.log('✅ Supabase client initialized');
console.log('✅ Auth and Blog managers ready');
