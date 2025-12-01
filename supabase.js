// Supabase Configuration
// ======================
//
// 🚀 SETUP INSTRUCTIONS:
// 1. Go to https://supabase.com and create a free account
// 2. Click "New Project" and choose your organization
// 3. Enter project name: "ai-auto-blog" (or your preferred name)
// 4. Choose a database password (save it securely)
// 5. Select a region closest to your users
// 6. Click "Create new project"
// 7. Wait for project to be ready (2-3 minutes)
// 8. Go to Project Settings → API
// 9. Copy the Project URL and anon public key below
//
// ⚠️ REPLACE THESE VALUES WITH YOUR ACTUAL SUPABASE CREDENTIALS:
const SUPABASE_URL = 'https://your-project-id.supabase.co'; // Replace with your Project URL
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Replace with your anon public key

// Initialize Supabase client
const { createClient } = supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Blog Manager Class
class BlogManager {
  // Get all published blog posts
  async getAllPosts() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { data: null, error };
    }
  }

  // Get a single blog post by slug
  async getPostBySlug(slug) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching post:', error);
      return { data: null, error };
    }
  }

  // Create a new blog post (admin only)
  async createPost(postData) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert([postData])
        .select();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating post:', error);
      return { data: null, error };
    }
  }

  // Update a blog post (admin only)
  async updatePost(id, postData) {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', id)
        .select();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating post:', error);
      return { data: null, error };
    }
  }

  // Delete a blog post (admin only)
  async deletePost(id) {
    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      
      return { error };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { error };
    }
  }

  // Get all posts including drafts (admin only)
  async getAllPostsAdmin() {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching admin posts:', error);
      return { data: null, error };
    }
  }
}

// Auth Manager Class
class AuthManager {
  // Admin login
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (data?.user) {
        localStorage.setItem('admin_session', JSON.stringify(data));
      }
      
      return { data, error };
    } catch (error) {
      console.error('Login error:', error);
      return { data: null, error };
    }
  }

  // Logout
  async logout() {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('admin_session');
      window.location.href = 'admin/login.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = localStorage.getItem('admin_session');
    return session !== null;
  }

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Check if user is admin (you can customize this logic)
  async isAdmin() {
    const user = await this.getCurrentUser();
    // You can implement your admin check logic here
    // For now, we'll check if user email matches admin email
    return user?.email === 'admin@ai-auto.com';
  }

  // Protect admin routes
  protectAdminRoute() {
    if (!this.isAuthenticated()) {
      window.location.href = 'admin/login.html';
      return false;
    }
    return true;
  }
}

// Initialize instances
const blogManager = new BlogManager();
const authManager = new AuthManager();

// Export for use in other files
window.blogManager = blogManager;
window.authManager = authManager;