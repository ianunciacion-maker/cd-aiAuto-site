// Avatar Selection Tracking API
// Records user avatar selections for analytics and user experience improvements

import { supabase } from '../supabase.js';

export default async function handler(req, res) {
  // Enable CORS for all routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Parse request body
    const { avatar_emoji, avatar_name, category } = req.body;

    // Validate required fields
    if (!avatar_emoji || !avatar_name || !category) {
      return res.status(400).json({ error: 'Missing required fields: avatar_emoji, avatar_name, category' });
    }

    // Insert avatar selection into database
    const { data, error } = await supabase
      .from('avatar_selection_history')
      .insert({
        user_id: user.id,
        avatar_emoji: avatar_emoji,
        avatar_name: avatar_name,
        category: category
      });

    if (error) {
      console.error('Avatar selection tracking error:', error);
      return res.status(500).json({ error: 'Failed to track avatar selection' });
    }

    console.log('Avatar selection tracked:', { user_id: user.id, avatar_emoji, avatar_name, category });

    return res.status(200).json({ 
      success: true,
      message: 'Avatar selection tracked successfully',
      data: {
        avatar_emoji,
        avatar_name,
        category,
        tracked_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Avatar selection tracking error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}