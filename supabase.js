/**
 * Ai-Auto Supabase Integration
 * Handles authentication and blog management
 * ============================================
 */

// ============================================
// SUPABASE CONFIGURATION
// ============================================

// Get credentials from environment or use defaults
const SUPABASE_URL = 'https://evzitnywfgbxzymddvyl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2eml0bnl3ZmdieHp5bWRkdnlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MDM5MzksImV4cCI6MjA4MDI3OTkzOX0.ZO6JpU1N6gZisu2gD--CfBivfD-YUjwpH7Chso79feg';

// Dynamic URL detection for different environments
function getSupabaseUrl() {
  const isLocalhost = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('10.0.0.');

  if (isLocalhost) {
    return 'https://evzitnywfgbxzymddvyl.supabase.co';
  }

  // Check if we're on Vercel
  const isVercel = window.location.hostname.includes('vercel.app');

  if (isVercel) {
    // Use the production Vercel URL
    return 'https://evzitnywfgbxzymddvyl.supabase.co';
  }

  // Default to the configured URL
  return SUPABASE_URL;
}

// Initialize Supabase client with dynamic URL
const supabase = window.supabase.createClient(getSupabaseUrl(), SUPABASE_ANON_KEY);

// ============================================
// AUTHENTICATION MANAGER
// ============================================

class AuthManager {
  constructor() {
    this.sessionKey = 'supabase.auth.token';
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

  async signup(email, password, metadata = {}) {
    try {
      // Extract emailRedirectTo from metadata if provided
      const { emailRedirectTo, ...userMetadata } = metadata;

      const signupOptions = {
        data: userMetadata
      };

      // Add emailRedirectTo if provided
      if (emailRedirectTo) {
        signupOptions.emailRedirectTo = emailRedirectTo;
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: signupOptions
      });

      if (error) {
        console.error('Signup error:', error.message);
        return { data: null, error };
      }

      console.log('Signup successful:', data.user.email);
      return { data, error: null };
    } catch (error) {
      console.error('Signup exception:', error);
      return { data: null, error };
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

  async logout(redirectUrl = null) {
    try {
      console.log('[AuthManager] Starting logout...');
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error('[AuthManager] Logout error:', error.message);
        // Continue with redirect even if error occurs
      } else {
        console.log('[AuthManager] Logout successful');
      }

      this.clearSession();

      // Use provided redirect URL or default to user login page
      const finalUrl = redirectUrl || '/user/login.html';
      console.log('[AuthManager] Redirecting to:', finalUrl);
      window.location.href = finalUrl;
    } catch (error) {
      console.error('[AuthManager] Logout exception:', error);
      // Force redirect even on exception
      const finalUrl = redirectUrl || '/user/login.html';
      window.location.href = finalUrl;
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
      if (!user) {
        console.log('[isAdmin] No authenticated user');
        return false;
      }

      // Check database for is_admin column
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[isAdmin] Database check error:', error.message);
        return false;
      }

      const isAdminUser = profile?.is_admin === true;
      console.log('[isAdmin] User:', user.email, 'Is Admin (database):', isAdminUser);

      return isAdminUser;
    } catch (error) {
      console.error('[isAdmin] Error checking admin status:', error);
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

    // Check if authenticated user is actually an admin
    const isAdminUser = await this.isAdmin();

    if (!isAdminUser) {
      console.warn('Non-admin user attempted to access admin route');
      alert('Access Denied: This page is restricted to administrators only.');
      window.location.href = '/user/dashboard.html';
      return false;
    }

    console.log('Admin access granted');
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
      console.log('[BlogManager] Fetching all posts for admin...');
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[BlogManager] Get admin posts error:', error);
        return { data: null, error };
      }

      console.log('[BlogManager] Retrieved', data?.length || 0, 'posts');
      return { data, error: null };
    } catch (error) {
      console.error('[BlogManager] Get admin posts exception:', error);
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
        content_type: 'html',
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
}

// ============================================
// BLOG HISTORY MANAGER
// ============================================

class BlogHistoryManager {
  constructor() {
    this.tableName = 'blog_generation_history';
  }

  /**
   * Save a blog generation to history
   * @param {Object} params - Generation parameters and output
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async saveGeneration(params) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const historyEntry = {
        user_id: user.id,
        topic: params.topic,
        length: params.length,
        tone: params.tone,
        keywords: params.keywords || null,
        generated_title: params.generated_title || null,
        generated_content: params.generated_content,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([historyEntry])
        .select()
        .single();

      if (error) {
        console.error('Save generation history error:', error.message);
        return { data: null, error };
      }

      console.log('Generation history saved:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('Save generation history exception:', error);
      return { data: null, error };
    }
  }

  /**
   * Get user's generation history (paginated)
   * @param {number} limit - Number of entries to fetch
   * @param {number} offset - Offset for pagination
   * @returns {Promise<{data: Array|null, error: Object|null}>}
   */
  async getHistory(limit = 20, offset = 0) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Get generation history error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get generation history exception:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a history entry
   * @param {string} entryId - UUID of the history entry
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async deleteEntry(entryId) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', entryId)
        .eq('user_id', user.id) // Security: ensure user owns this entry
        .select()
        .single();

      if (error) {
        console.error('Delete history entry error:', error.message);
        return { data: null, error };
      }

      console.log('History entry deleted:', entryId);
      return { data, error: null };
    } catch (error) {
      console.error('Delete history entry exception:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single history entry by ID
   * @param {string} entryId - UUID of the history entry
   * @returns {Promise<{data: Object|null, error: Object|null}>}
   */
  async getEntryById(entryId) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'User not authenticated' } };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', entryId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Get history entry error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get history entry exception:', error);
      return { data: null, error };
    }
  }

  /**
   * Get total count of user's history entries
   * @returns {Promise<{count: number|null, error: Object|null}>}
   */
  async getHistoryCount() {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { count: null, error: { message: 'User not authenticated' } };
      }

      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Get history count error:', error.message);
        return { count: null, error };
      }

      return { count, error: null };
    } catch (error) {
      console.error('Get history count exception:', error);
      return { count: null, error };
    }
  }
}

// ============================================
// USER MANAGER
// ============================================

class UserManager {
  constructor() {
    this.tableName = 'user_profiles';
  }

  // Get current user profile
  async getCurrentProfile() {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Get profile error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get profile exception:', error);
      return { data: null, error };
    }
  }

  // Update user profile
  async updateProfile(updates) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update profile error:', error.message);
        return { data: null, error };
      }

      console.log('Profile updated successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Update profile exception:', error);
      return { data: null, error };
    }
  }

  // Update user email (requires email verification)
  async updateEmail(newEmail) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      // Check if email is different
      if (user.email === newEmail) {
        return { data: null, error: { message: 'Email is the same as current email' } };
      }

      // Update email in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) {
        console.error('Update email error:', error.message);
        return { data: null, error };
      }

      console.log('Email update initiated, verification required');
      return {
        data: { message: 'Verification email sent. Please check your inbox and follow the verification link.' },
        error: null
      };
    } catch (error) {
      console.error('Update email exception:', error);
      return { data: null, error };
    }
  }

  // Get user subscription status
  async getSubscriptionStatus() {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No subscription found - return inactive status
        return {
          data: {
            user_id: user.id,
            status: 'inactive',
            current_period_end: null
          },
          error: null
        };
      }

      if (error) {
        console.error('Get subscription error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get subscription exception:', error);
      return { data: null, error };
    }
  }

  // Check if user can access tools
  async canAccessTools() {
    try {
      const { data: subscription, error } = await this.getSubscriptionStatus();

      if (error) {
        return false;
      }

      return subscription?.status === 'active' || subscription?.status === 'trialing';
    } catch (error) {
      console.error('Can access tools error:', error);
      return false;
    }
  }

  // Get tool usage stats
  async getToolUsage(toolType) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const { data, error } = await supabase
        .from('tool_usage')
        .select('*')
        .eq('user_id', user.id)
        .eq('tool_type', toolType)
        .single();

      if (error) {
        console.error('Get tool usage error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get tool usage exception:', error);
      return { data: null, error };
    }
  }

  // Get all tool usage stats
  async getAllToolUsage() {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { data: null, error: { message: 'Not authenticated' } };
      }

      const { data, error } = await supabase
        .from('tool_usage')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Get all tool usage error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get all tool usage exception:', error);
      return { data: null, error };
    }
  }
}

// ============================================
// STRIPE MANAGER
// ============================================

class StripeManager {
  constructor() {
    this.apiBase = window.location.origin;
  }

  // Create checkout session and redirect to Stripe
  async checkout(priceId) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { error: { message: 'User not authenticated' } };
      }

      const response = await fetch(`${this.apiBase}/api/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
          priceId: priceId
        })
      });

      if (!response.ok) {
        // Try to parse as JSON, but handle cases where response is HTML/plain text
        let errorMessage = `Server error (${response.status})`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.error || error.message || errorMessage;
          } else {
            // Response is not JSON, try to get text
            const text = await response.text();
            errorMessage = text.substring(0, 100) || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        console.error('Checkout error:', errorMessage);
        return { error: { message: errorMessage } };
      }

      const responseData = await response.json();
      const { sessionId, url } = responseData;

      if (!url) {
        console.error('Invalid checkout response:', responseData);
        return { error: { message: 'Invalid response from server' } };
      }

      // Redirect to Stripe Checkout
      window.location.href = url;

      return { data: { sessionId, url }, error: null };
    } catch (error) {
      console.error('Checkout exception:', error);
      return { error: { message: error.message || 'Checkout failed' } };
    }
  }

  // Open billing portal to manage subscription
  async openBillingPortal() {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { error: { message: 'User not authenticated' } };
      }

      const response = await fetch(`${this.apiBase}/api/billing-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Billing portal error:', error);
        return { error };
      }

      const { url } = await response.json();

      // Redirect to Stripe Billing Portal
      window.location.href = url;

      return { data: { url }, error: null };
    } catch (error) {
      console.error('Billing portal exception:', error);
      return { error };
    }
  }

  // Use a tool and increment usage counter
  async useTool(toolType) {
    try {
      const user = await authManager.getCurrentUser();
      if (!user) {
        return { error: { message: 'User not authenticated' } };
      }

      const response = await fetch(`${this.apiBase}/api/tools/use-tool`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          tool_type: toolType
        })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Tool usage error:', result);
        return { error: result };
      }

      return { data: result, error: null };
    } catch (error) {
      console.error('Tool usage exception:', error);
      return { error };
    }
  }
}

// ============================================
// ADMIN USER MANAGER
// ============================================

class AdminUserManager {
  constructor() {
    this.userProfileTable = 'user_profiles';
    this.subscriptionTable = 'subscriptions';
    this.toolUsageTable = 'tool_usage';
  }

  // Get all users (admin only)
  async getAllUsers() {
    try {
      console.log('[AdminUserManager] Fetching all users...');
      const { data, error } = await supabase
        .from(this.userProfileTable)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AdminUserManager] Get all users error:', error);
        console.error('[AdminUserManager] Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint
        });
        return { data: null, error };
      }

      console.log('[AdminUserManager] Retrieved', data?.length || 0, 'users');
      return { data, error: null };
    } catch (error) {
      console.error('[AdminUserManager] Get all users exception:', error);
      return { data: null, error };
    }
  }

  // Get user subscription with details
  async getUserSubscription(userId) {
    try {
      const { data, error } = await supabase
        .from(this.subscriptionTable)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No subscription found
        return { data: null, error: null };
      }

      if (error) {
        console.error('Get user subscription error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get user subscription exception:', error);
      return { data: null, error };
    }
  }

  // Get user tool usage
  async getUserToolUsage(userId) {
    try {
      const { data, error } = await supabase
        .from(this.toolUsageTable)
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Get user tool usage error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get user tool usage exception:', error);
      return { data: null, error };
    }
  }

  // Get dashboard stats
  async getDashboardStats() {
    try {
      // Total users
      const { data: users, error: usersError } = await supabase
        .from(this.userProfileTable)
        .select('id', { count: 'exact' });

      // Active subscriptions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from(this.subscriptionTable)
        .select('id', { count: 'exact' })
        .in('status', ['active', 'trialing']);

      // Revenue calculation (optional - if you track subscription amounts)
      const { data: subscriptions, error: allSubsError } = await supabase
        .from(this.subscriptionTable)
        .select('status, current_period_end');

      if (usersError || subsError) {
        console.error('Dashboard stats error:', usersError || subsError);
        return { data: null, error: usersError || subsError };
      }

      const stats = {
        totalUsers: users?.length || 0,
        activeSubscriptions: activeSubscriptions?.length || 0,
        monthlyRecurringRevenue: subscriptions?.length ? (subscriptions.length * 49) : 0, // $49 per subscription
        churnRate: 0 // Calculate if needed
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error('Dashboard stats exception:', error);
      return { data: null, error };
    }
  }

  // Cancel user subscription (admin action)
  async cancelUserSubscription(userId) {
    try {
      const { error } = await supabase
        .from(this.subscriptionTable)
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) {
        console.error('Cancel subscription error:', error.message);
        return { error };
      }

      console.log('Subscription canceled for user:', userId);
      return { error: null };
    } catch (error) {
      console.error('Cancel subscription exception:', error);
      return { error };
    }
  }
}

// ============================================
// AI RESOURCES MANAGER
// ============================================

class AIResourcesManager {
  constructor() {
    this.tableName = 'ai_resources';
    this.storageBucket = 'ai-resources-images';
  }

  // Get all published resources by category (public)
  async getPublishedByCategory(category) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category)
        .eq('status', 'published')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get published resources error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get published resources exception:', error);
      return { data: null, error };
    }
  }

  // Get all resources by category (admin - includes drafts)
  async getAllByCategory(category) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get all resources error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get all resources exception:', error);
      return { data: null, error };
    }
  }

  // Get all resources (admin - includes all categories and drafts)
  async getAllResources() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Get all resources error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get all resources exception:', error);
      return { data: null, error };
    }
  }

  // Get single resource by ID
  async getById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Get resource by ID error:', error.message);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Get resource by ID exception:', error);
      return { data: null, error };
    }
  }

  // Create new resource
  async create(resourceData) {
    try {
      // Get the max sort_order for this category
      const { data: existingResources } = await supabase
        .from(this.tableName)
        .select('sort_order')
        .eq('category', resourceData.category)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextSortOrder = existingResources && existingResources.length > 0
        ? existingResources[0].sort_order + 1
        : 1;

      const resource = {
        category: resourceData.category,
        headline: resourceData.headline,
        preview: resourceData.preview,
        content: resourceData.content || null,
        image_url: resourceData.image_url || null,
        image_alt: resourceData.image_alt || null,
        source_name: resourceData.source_name,
        source_url: resourceData.source_url,
        published_date: resourceData.published_date || new Date().toISOString().split('T')[0],
        sort_order: resourceData.sort_order || nextSortOrder,
        status: resourceData.status || 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .insert([resource])
        .select()
        .single();

      if (error) {
        console.error('Create resource error:', error.message);
        return { data: null, error };
      }

      console.log('Resource created successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('Create resource exception:', error);
      return { data: null, error };
    }
  }

  // Update existing resource
  async update(id, resourceData) {
    try {
      const updates = {
        ...resourceData,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from(this.tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update resource error:', error.message);
        return { data: null, error };
      }

      console.log('Resource updated successfully:', data.id);
      return { data, error: null };
    } catch (error) {
      console.error('Update resource exception:', error);
      return { data: null, error };
    }
  }

  // Delete resource
  async delete(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Delete resource error:', error.message);
        return { data: null, error };
      }

      console.log('Resource deleted successfully:', id);
      return { data, error: null };
    } catch (error) {
      console.error('Delete resource exception:', error);
      return { data: null, error };
    }
  }

  // Reorder resources within a category
  async reorder(category, orderedIds) {
    try {
      // Update sort_order for each resource
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index + 1
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from(this.tableName)
          .update({ sort_order: update.sort_order, updated_at: new Date().toISOString() })
          .eq('id', update.id);

        if (error) {
          console.error('Reorder resource error:', error.message);
          return { error };
        }
      }

      console.log('Resources reordered successfully');
      return { error: null };
    } catch (error) {
      console.error('Reorder resources exception:', error);
      return { error };
    }
  }

  // Move resource up in sort order within its category
  async moveUp(id) {
    try {
      // Get the current resource
      const { data: current, error: currentError } = await this.getById(id);
      if (currentError || !current) {
        return { error: currentError || { message: 'Resource not found' } };
      }

      // Find the resource above it (lower sort_order)
      const { data: above, error: aboveError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', current.category)
        .lt('sort_order', current.sort_order)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single();

      if (aboveError || !above) {
        // Already at top
        return { data: current, error: null };
      }

      // Swap sort orders
      await this.update(current.id, { sort_order: above.sort_order });
      await this.update(above.id, { sort_order: current.sort_order });

      return { data: current, error: null };
    } catch (error) {
      console.error('Move up exception:', error);
      return { error };
    }
  }

  // Move resource down in sort order within its category
  async moveDown(id) {
    try {
      // Get the current resource
      const { data: current, error: currentError } = await this.getById(id);
      if (currentError || !current) {
        return { error: currentError || { message: 'Resource not found' } };
      }

      // Find the resource below it (higher sort_order)
      const { data: below, error: belowError } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('category', current.category)
        .gt('sort_order', current.sort_order)
        .order('sort_order', { ascending: true })
        .limit(1)
        .single();

      if (belowError || !below) {
        // Already at bottom
        return { data: current, error: null };
      }

      // Swap sort orders
      await this.update(current.id, { sort_order: below.sort_order });
      await this.update(below.id, { sort_order: current.sort_order });

      return { data: current, error: null };
    } catch (error) {
      console.error('Move down exception:', error);
      return { error };
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

  // Get count by category
  async getCountByCategory(category) {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('category', category);

      if (error) {
        console.error('Get count error:', error.message);
        return { count: null, error };
      }

      return { count, error: null };
    } catch (error) {
      console.error('Get count exception:', error);
      return { count: null, error };
    }
  }
}

// ============================================
// INITIALIZE MANAGERS
// ============================================

const authManager = new AuthManager();
const blogManager = new BlogManager();
const blogHistoryManager = new BlogHistoryManager();
const userManager = new UserManager();
const stripeManager = new StripeManager();
const adminUserManager = new AdminUserManager();
const aiResourcesManager = new AIResourcesManager();

// Expose to global scope for access in HTML files
if (typeof window !== 'undefined') {
  window.authManager = authManager;
  window.blogManager = blogManager;
  window.blogHistoryManager = blogHistoryManager;
  window.userManager = userManager;
  window.stripeManager = stripeManager;
  window.adminUserManager = adminUserManager;
  window.aiResourcesManager = aiResourcesManager;
  window.supabase = supabase;
}

console.log('✅ Supabase client initialized');
console.log('✅ Auth and Blog managers ready');
console.log('✅ User, Stripe, Admin, and AI Resources managers ready');
