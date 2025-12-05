/**
 * Social Captions History Manager
 * Handles history management for social captions generation
 * Follows same pattern as BlogHistoryManager
 */

class SocialCaptionsHistoryManager {
  constructor() {
    this.tableName = 'social_captions_history';
  }

  /**
   * Save a social captions generation to history
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
        platforms: params.platforms || [],
        tone: params.tone,
        hashtags: params.hashtags || null,
        length: params.length,
        image_url: params.image_url || null,
        generated_captions: params.generated_captions,
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

      console.log('Social captions generation history saved:', data.id);
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

      console.log('Social captions history entry deleted:', entryId);
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

// Expose globally for access in HTML files
if (typeof window !== 'undefined') {
  window.socialCaptionsHistoryManager = new SocialCaptionsHistoryManager();
}