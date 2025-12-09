/**
 * Product Descriptions History Manager
 * Handles history management for product description generation
 * Follows same pattern as SocialCaptionsHistoryManager
 */

class ProductDescriptionsHistoryManager {
    constructor() {
        this.tableName = 'product_descriptions_history';
    }

    /**
     * Save a product description generation to history
     * @param {Object} params - Generation parameters and output
     * @returns {Promise<{data: Object|null, error: Object|null}>}
     */
    async saveGeneration(params) {
        try {
            const user = await authManager.getCurrentUser();
            if (!user) {
                console.error('❌ Save generation: User not authenticated');
                return { data: null, error: { message: 'User not authenticated' } };
            }

            console.log('💾 Saving product description with params:', params);

            const historyEntry = {
                user_id: user.id,
                product_name: params.product_name,
                category: params.category || null,
                features: params.features || null,
                target_audience: params.target_audience || null,
                tone: params.tone,
                length: params.length,
                image_url: params.image_url || null,
                generated_description: params.generated_description,
                created_at: new Date().toISOString()
            };

            console.log('💾 History entry to save:', historyEntry);

            const { data, error } = await supabase
                .from(this.tableName)
                .insert([historyEntry])
                .select()
                .single();

            if (error) {
                console.error('❌ Save generation history error:', error.message);
                console.error('❌ Full error details:', error);
                return { data: null, error };
            }

            console.log('✅ Product description history saved:', data.id);
            return { data, error: null, success: true };
        } catch (error) {
            console.error('❌ Save generation history exception:', error);
            console.error('❌ Error stack:', error.stack);
            return { data: null, error, success: false };
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
                console.error('❌ Get history: User not authenticated');
                return { data: null, error: { message: 'User not authenticated' } };
            }

            console.log(`📚 Getting history: limit=${limit}, offset=${offset}`);

            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                console.error('❌ Get generation history error:', error.message);
                console.error('❌ Full error details:', error);
                return { data: null, error };
            }

            // Get total count for pagination
            const { count, error: countError } = await supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            if (countError) {
                console.error('❌ Get history count error:', countError.message);
                return { data, error };
            }

            console.log(`✅ Retrieved ${data?.length || 0} history items, total count: ${count}`);
            return { data, total: count, error: null };
        } catch (error) {
            console.error('❌ Get generation history exception:', error);
            console.error('❌ Error stack:', error.stack);
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

            console.log('Product description history entry deleted:', entryId);
            return { data, error: null, success: true };
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
    window.productDescriptionsHistoryManager = new ProductDescriptionsHistoryManager();
}
