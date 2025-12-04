/**
 * Profile Update API Endpoint
 * Handles profile updates including avatar upload
 * 
 * POST /api/update-profile
 * Headers: { Authorization: Bearer <token> }
 * Body: { field: value, ... }
 */

const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase environment variables');
    return res.status(500).json({ error: 'Server configuration error: Missing Supabase configuration' });
  }

  // Initialize Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Get user from JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No auth header or invalid format:', authHeader);
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Token received:', token.substring(0, 20) + '...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Token validation error:', userError);
      return res.status(401).json({ error: 'Invalid token: ' + userError.message });
    }
    
    if (!user) {
      console.error('No user found for token');
      return res.status(401).json({ error: 'Invalid token: No user found' });
    }
    
    console.log('User authenticated:', user.id, user.email);

    // Parse form data
    const formData = req.body;
    const updates = {};
    const allowedFields = ['full_name', 'company_name', 'business_phone', 'business_address', 'target_market', 'business_industry'];

    console.log('Received form data:', formData);

    // Filter and validate allowed fields
    Object.keys(formData).forEach(key => {
      if (allowedFields.includes(key)) {
        const value = formData[key];
        // Allow empty strings for optional fields, but still trim if not empty
        if (value !== undefined && value !== null) {
          updates[key] = value.trim();
        }
      }
    });

    // Handle avatar URL separately if provided
    if (formData.avatar_url !== undefined && formData.avatar_url !== null) {
      updates.avatar_url = formData.avatar_url.trim();
    }

    console.log('Updates to apply:', updates);

    // Only validate full_name if it's being updated
    if (formData.hasOwnProperty('full_name') && (!updates.full_name || updates.full_name === '')) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    // Validate email format if being updated
    if (formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        return res.status(400).json({ error: 'Invalid email format' });
      }
      updates.email = formData.email.trim();
    }

    // Validate phone format if provided
    if (updates.business_phone) {
      const phoneRegex = /^\+?1?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(updates.business_phone.replace(/\s/g, ''))) {
        return res.status(400).json({ error: 'Invalid phone format. Use format: +1 (555) 123-4567' });
      }
    }

    // Update profile in database
    console.log('Updating profile for user:', user.id, 'with data:', updates);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update database error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      });
      return res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }

    console.log('Profile updated successfully for user:', user.id);
    console.log('Updated data:', data);
    
    return res.status(200).json({
      data: data,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update exception:', error);
    return res.status(500).json({ error: 'Server error during profile update' });
  }
};