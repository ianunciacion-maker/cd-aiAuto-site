/**
 * Email Campaigns History Manager
 * Handles Supabase history for email campaign generation
 */

class EmailCampaignsHistoryManager {
    constructor() {
        this.tableName = 'email_campaigns_history';
    }

    async saveGeneration(params) {
        try {
            const user = await authManager.getCurrentUser();
            if (!user) return { data: null, error: { message: 'User not authenticated' } };

            const { data, error } = await supabase
                .from(this.tableName)
                .insert([{
                    user_id: user.id,
                    subject: params.subject,
                    purpose: params.purpose || null,
                    audience: params.audience || null,
                    tone: params.tone,
                    key_points: params.key_points || null,
                    cta: params.cta || null,
                    image_url: params.image_url || null,
                    generated_email: params.generated_email,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) {
                console.error('❌ Save history error:', error.message);
                return { data: null, error };
            }

            console.log('✅ Email history saved:', data.id);
            return { data, error: null, success: true };
        } catch (error) {
            console.error('❌ Save history exception:', error);
            return { data: null, error, success: false };
        }
    }

    async getHistory(limit = 20, offset = 0) {
        try {
            const user = await authManager.getCurrentUser();
            if (!user) return { data: null, error: { message: 'User not authenticated' } };

            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) return { data: null, error };

            const { count } = await supabase
                .from(this.tableName)
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id);

            return { data, total: count, error: null };
        } catch (error) {
            console.error('❌ Get history exception:', error);
            return { data: null, error };
        }
    }

    async deleteEntry(entryId) {
        try {
            const user = await authManager.getCurrentUser();
            if (!user) return { data: null, error: { message: 'User not authenticated' } };

            const { data, error } = await supabase
                .from(this.tableName)
                .delete()
                .eq('id', entryId)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) return { data: null, error };
            return { data, error: null, success: true };
        } catch (error) {
            return { data: null, error };
        }
    }

    async getEntryById(entryId) {
        try {
            const user = await authManager.getCurrentUser();
            if (!user) return { data: null, error: { message: 'User not authenticated' } };

            const { data, error } = await supabase
                .from(this.tableName)
                .select('*')
                .eq('id', entryId)
                .eq('user_id', user.id)
                .single();

            return { data, error };
        } catch (error) {
            return { data: null, error };
        }
    }
}

if (typeof window !== 'undefined') {
    window.emailCampaignsHistoryManager = new EmailCampaignsHistoryManager();
}
