/**
 * Tool Usage Tracking Endpoint
 * Increments tool usage counter and validates subscription
 *
 * POST /api/tools/use-tool
 * Body: { user_id: string, tool_type: string }
 * Returns: { success: boolean, remaining_usage: number }
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Valid tool types
const VALID_TOOLS = [
  'blog_generator',
  'social_captions',
  'email_campaigns',
  'product_descriptions'
];

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

  try {
    const { user_id, tool_type } = req.body;

    // Validate required fields
    if (!user_id || !tool_type) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, tool_type'
      });
    }

    // Validate tool type
    if (!VALID_TOOLS.includes(tool_type)) {
      return res.status(400).json({
        error: `Invalid tool type. Must be one of: ${VALID_TOOLS.join(', ')}`
      });
    }

    // Call database function to increment usage
    const { data, error } = await supabase.rpc('increment_tool_usage', {
      p_user_id: user_id,
      p_tool_type: tool_type
    });

    if (error) {
      console.error('Error incrementing tool usage:', error);
      return res.status(400).json({
        error: 'Unable to use tool. Check subscription status and usage limits.'
      });
    }

    // If function returned false, usage could not be incremented
    if (!data) {
      return res.status(403).json({
        error: 'Subscription inactive or usage limit reached',
        code: 'USAGE_LIMIT_EXCEEDED'
      });
    }

    // Get updated usage stats
    const { data: usage, error: usageError } = await supabase
      .from('tool_usage')
      .select('generation_count, monthly_limit')
      .eq('user_id', user_id)
      .eq('tool_type', tool_type)
      .single();

    if (usageError) {
      console.error('Error fetching usage stats:', usageError);
      return res.status(200).json({
        success: true,
        message: 'Tool usage recorded'
      });
    }

    return res.status(200).json({
      success: true,
      usage: {
        used: usage.generation_count,
        limit: usage.monthly_limit,
        remaining: usage.monthly_limit - usage.generation_count
      }
    });

  } catch (error) {
    console.error('Tool usage error:', error);
    return res.status(500).json({
      error: 'Failed to process tool usage'
    });
  }
};
