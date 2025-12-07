# Admin Tool Access Management Implementation Guide

## Overview

This guide provides a complete implementation for Admin User capabilities to manage regular users' tool access and usage counters. The implementation includes:

1. Granting/revoking access to specific tools per user
2. Resetting usage counters on a per-tool, per-user basis
3. Audit logging for all admin actions
4. Enhanced admin dashboard UI

## Database Schema Changes

### 1. User Tool Access Table

Create a new table to manage tool access permissions:

```sql
-- ============================================
-- USER TOOL ACCESS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_tool_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_type TEXT NOT NULL CHECK (
    tool_type IN ('blog_generator', 'social_captions', 'email_campaigns', 'product_descriptions')
  ),
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Admin who granted access
  UNIQUE(user_id, tool_type)
);

-- Enable RLS
ALTER TABLE user_tool_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own tool access
CREATE POLICY "Users can view own tool access"
  ON user_tool_access FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all tool access
CREATE POLICY "Admins can view all tool access"
  ON user_tool_access FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Admins can manage tool access
CREATE POLICY "Admins can manage tool access"
  ON user_tool_access FOR ALL
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_tool_access_user_id ON user_tool_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tool_access_tool_type ON user_tool_access(tool_type);
```

### 2. Admin Action Log Table

Create audit trail for admin actions:

```sql
-- ============================================
-- ADMIN ACTION LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_action_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL CHECK (
    action_type IN ('grant_access', 'revoke_access', 'reset_usage', 'bulk_grant', 'bulk_revoke')
  ),
  tool_type TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_action_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all admin logs
CREATE POLICY "Admins can view admin logs"
  ON admin_action_log FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM auth.users
      WHERE email = 'setyourownsalary@gmail.com'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_action_log_admin_id ON admin_action_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_target_user_id ON admin_action_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_log_created_at ON admin_action_log(created_at DESC);
```

## Database Functions

### 1. Tool Access Management Functions

```sql
-- ============================================
-- GRANT/REVOKE TOOL ACCESS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.set_tool_access(
  p_user_id UUID,
  p_tool_type TEXT,
  p_is_enabled BOOLEAN,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_existing_access RECORD;
  v_action_type TEXT;
BEGIN
  -- Validate tool type
  IF p_tool_type NOT IN ('blog_generator', 'social_captions', 'email_campaigns', 'product_descriptions') THEN
    RAISE EXCEPTION 'Invalid tool type: %', p_tool_type;
  END IF;

  -- Check if access record exists
  SELECT * INTO v_existing_access
  FROM user_tool_access
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  -- Determine action type for logging
  IF p_is_enabled THEN
    v_action_type := 'grant_access';
  ELSE
    v_action_type := 'revoke_access';
  END IF;

  -- Insert or update access
  IF v_existing_access IS NULL THEN
    INSERT INTO user_tool_access (user_id, tool_type, is_enabled, created_by)
    VALUES (p_user_id, p_tool_type, p_is_enabled, p_admin_id);
  ELSE
    UPDATE user_tool_access
    SET is_enabled = p_is_enabled,
        updated_at = NOW()
    WHERE user_id = p_user_id AND tool_type = p_tool_type;
  END IF;

  -- Log admin action
  INSERT INTO admin_action_log (admin_id, target_user_id, action_type, tool_type, details)
  VALUES (
    p_admin_id,
    p_user_id,
    v_action_type,
    p_tool_type,
    jsonb_build_object(
      'is_enabled', p_is_enabled,
      'previous_state', v_existing_access.is_enabled
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in set_tool_access: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Usage Counter Reset Function

```sql
-- ============================================
-- RESET TOOL USAGE COUNTER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.reset_tool_usage(
  p_user_id UUID,
  p_tool_type TEXT,
  p_admin_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_current_limit INTEGER;
BEGIN
  -- Validate tool type
  IF p_tool_type NOT IN ('blog_generator', 'social_captions', 'email_campaigns', 'product_descriptions') THEN
    RAISE EXCEPTION 'Invalid tool type: %', p_tool_type;
  END IF;

  -- Get current usage for logging
  SELECT generation_count, monthly_limit INTO v_current_usage, v_current_limit
  FROM tool_usage
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  -- Reset usage counter
  UPDATE tool_usage
  SET generation_count = 0,
      last_used_at = NULL,
      updated_at = NOW()
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  -- Log admin action
  INSERT INTO admin_action_log (admin_id, target_user_id, action_type, tool_type, details)
  VALUES (
    p_admin_id,
    p_user_id,
    'reset_usage',
    p_tool_type,
    jsonb_build_object(
      'previous_usage', v_current_usage,
      'monthly_limit', v_current_limit
    )
  );

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in reset_tool_usage: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Updated Tool Access Check Function

```sql
-- ============================================
-- UPDATED CAN_USE_TOOL FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.can_use_tool(
  p_user_id UUID,
  p_tool_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_subscription_active BOOLEAN;
  v_usage_available BOOLEAN;
  v_tool_access_enabled BOOLEAN;
BEGIN
  -- Check if subscription is active
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
  ) INTO v_subscription_active;

  IF NOT v_subscription_active THEN
    RETURN FALSE;
  END IF;

  -- Check if tool access is enabled
  SELECT COALESCE(is_enabled, TRUE) INTO v_tool_access_enabled
  FROM user_tool_access
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  -- Default to TRUE if no specific access record exists
  IF v_tool_access_enabled IS NULL THEN
    v_tool_access_enabled := TRUE;
  END IF;

  IF NOT v_tool_access_enabled THEN
    RETURN FALSE;
  END IF;

  -- Check if usage is available
  SELECT (generation_count < monthly_limit) INTO v_usage_available
  FROM tool_usage
  WHERE user_id = p_user_id AND tool_type = p_tool_type;

  RETURN COALESCE(v_usage_available, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Get User Tool Access Function

```sql
-- ============================================
-- GET USER TOOL ACCESS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_tool_access(p_user_id UUID)
RETURNS TABLE (
  tool_type TEXT,
  is_enabled BOOLEAN,
  generation_count INTEGER,
  monthly_limit INTEGER,
  remaining_usage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tu.tool_type,
    COALESCE(uta.is_enabled, TRUE) as is_enabled,
    tu.generation_count,
    tu.monthly_limit,
    (tu.monthly_limit - tu.generation_count) as remaining_usage
  FROM tool_usage tu
  LEFT JOIN user_tool_access uta ON tu.user_id = uta.user_id AND tu.tool_type = uta.tool_type
  WHERE tu.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## API Endpoints

### 1. Grant/Revoke Tool Access Endpoint

Create file: `api/admin/grant-tool-access.js`

```javascript
/**
 * Admin Tool Access Management Endpoint
 * Grants or revokes tool access for a user
 * 
 * POST /api/admin/grant-tool-access
 * Body: { user_id: string, tool_type: string, is_enabled: boolean }
 * Returns: { success: boolean, message: string }
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

  try {
    const { user_id, tool_type, is_enabled } = req.body;

    // Validate required fields
    if (!user_id || !tool_type || typeof is_enabled !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields: user_id, tool_type, is_enabled (boolean)'
      });
    }

    // Validate tool type
    if (!VALID_TOOLS.includes(tool_type)) {
      return res.status(400).json({
        error: `Invalid tool type. Must be one of: ${VALID_TOOLS.join(', ')}`
      });
    }

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin status
    const isAdmin = user.email === 'setyourownsalary@gmail.com';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Call database function
    const { data, error } = await supabase.rpc('set_tool_access', {
      p_user_id: user_id,
      p_tool_type: tool_type,
      p_is_enabled: is_enabled,
      p_admin_id: user.id
    });

    if (error) {
      console.error('Error setting tool access:', error);
      return res.status(500).json({
        error: 'Failed to update tool access'
      });
    }

    if (!data) {
      return res.status(400).json({
        error: 'Failed to update tool access'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Tool access ${is_enabled ? 'granted' : 'revoked'} successfully`
    });

  } catch (error) {
    console.error('Tool access management error:', error);
    return res.status(500).json({
      error: 'Failed to process request'
    });
  }
};
```

### 2. Reset Usage Counter Endpoint

Create file: `api/admin/reset-usage-counter.js`

```javascript
/**
 * Admin Usage Counter Reset Endpoint
 * Resets usage counter for a specific tool and user
 * 
 * POST /api/admin/reset-usage-counter
 * Body: { user_id: string, tool_type: string }
 * Returns: { success: boolean, message: string }
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

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin status
    const isAdmin = user.email === 'setyourownsalary@gmail.com';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Call database function
    const { data, error } = await supabase.rpc('reset_tool_usage', {
      p_user_id: user_id,
      p_tool_type: tool_type,
      p_admin_id: user.id
    });

    if (error) {
      console.error('Error resetting usage counter:', error);
      return res.status(500).json({
        error: 'Failed to reset usage counter'
      });
    }

    if (!data) {
      return res.status(400).json({
        error: 'Failed to reset usage counter'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usage counter reset successfully'
    });

  } catch (error) {
    console.error('Usage counter reset error:', error);
    return res.status(500).json({
      error: 'Failed to process request'
    });
  }
};
```

### 3. Get User Tool Access Endpoint

Create file: `api/admin/user-tool-access.js`

```javascript
/**
 * Admin User Tool Access Endpoint
 * Retrieves tool access status for a user
 * 
 * GET /api/admin/user-tool-access?user_id=UUID
 * Returns: { success: boolean, data: Array }
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async (req, res) => {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user_id } = req.query;

    // Validate required fields
    if (!user_id) {
      return res.status(400).json({
        error: 'Missing required query parameter: user_id'
      });
    }

    // Get current admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      req.headers.authorization?.replace('Bearer ', '')
    );

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin status
    const isAdmin = user.email === 'setyourownsalary@gmail.com';
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get user tool access
    const { data, error } = await supabase.rpc('get_user_tool_access', {
      p_user_id: user_id
    });

    if (error) {
      console.error('Error getting user tool access:', error);
      return res.status(500).json({
        error: 'Failed to retrieve tool access'
      });
    }

    return res.status(200).json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get user tool access error:', error);
    return res.status(500).json({
      error: 'Failed to process request'
    });
  }
};
```

## Frontend Implementation

### 1. Enhanced AdminUserManager Class

Extend the existing `AdminUserManager` class in `supabase.js`:

```javascript
// Add these methods to the existing AdminUserManager class

// Grant tool access to user
async grantToolAccess(userId, toolType) {
  try {
    const user = await authManager.getCurrentUser();
    if (!user) {
      return { error: { message: 'Admin not authenticated' } };
    }

    const response = await fetch(`${window.location.origin}/api/admin/grant-tool-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      },
      body: JSON.stringify({
        user_id: userId,
        tool_type: toolType,
        is_enabled: true
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Grant tool access error:', result);
      return { error: result };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Grant tool access exception:', error);
    return { error };
  }
}

// Revoke tool access from user
async revokeToolAccess(userId, toolType) {
  try {
    const user = await authManager.getCurrentUser();
    if (!user) {
      return { error: { message: 'Admin not authenticated' } };
    }

    const response = await fetch(`${window.location.origin}/api/admin/revoke-tool-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      },
      body: JSON.stringify({
        user_id: userId,
        tool_type: toolType,
        is_enabled: false
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Revoke tool access error:', result);
      return { error: result };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Revoke tool access exception:', error);
    return { error };
  }
}

// Reset usage counter for user
async resetUsageCounter(userId, toolType) {
  try {
    const user = await authManager.getCurrentUser();
    if (!user) {
      return { error: { message: 'Admin not authenticated' } };
    }

    const response = await fetch(`${window.location.origin}/api/admin/reset-usage-counter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      },
      body: JSON.stringify({
        user_id: userId,
        tool_type: toolType
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Reset usage counter error:', result);
      return { error: result };
    }

    return { data: result, error: null };
  } catch (error) {
    console.error('Reset usage counter exception:', error);
    return { error };
  }
}

// Get user tool access status
async getUserToolAccess(userId) {
  try {
    const user = await authManager.getCurrentUser();
    if (!user) {
      return { data: null, error: { message: 'Admin not authenticated' } };
    }

    const response = await fetch(`${window.location.origin}/api/admin/user-tool-access?user_id=${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session.access_token}`
      }
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Get user tool access error:', result);
      return { data: null, error: result };
    }

    return { data: result.data, error: null };
  } catch (error) {
    console.error('Get user tool access exception:', error);
    return { data: null, error };
  }
}
```

### 2. Enhanced Admin Dashboard UI

Update the `renderUsers` method in `admin/dashboard.html` to include tool access controls:

```javascript
// Enhanced renderUsers method with tool access controls
async renderUsers(users, subscriptions) {
  if (!users || users.length === 0) {
    this.usersContainer.innerHTML = `
      <div class="empty">
        <p>No users yet.</p>
      </div>
    `;
    return;
  }

  // Get tool access for all users
  const usersWithToolAccess = await Promise.all(
    users.map(async (user) => {
      const { data: toolAccess } = await adminUserManager.getUserToolAccess(user.id);
      return { ...user, toolAccess: toolAccess || [] };
    })
  );

  const usersHTML = usersWithToolAccess.map(user => {
    const sub = subscriptions[user.id];
    const status = sub?.status || 'inactive';
    const joinDate = new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });

    // Create tool access toggles
    const toolToggles = this.toolTypes.map(tool => {
      const access = user.toolAccess.find(t => t.tool_type === tool.id);
      const isEnabled = access ? access.is_enabled : true; // Default to enabled
      
      return `
        <div class="tool-access-toggle">
          <label class="toggle-label">${tool.name}</label>
          <div class="toggle-switch">
            <input type="checkbox" 
                   id="tool-${user.id}-${tool.id}" 
                   ${isEnabled ? 'checked' : ''}
                   onchange="dashboard.toggleToolAccess('${user.id}', '${tool.id}', this.checked)">
            <span class="toggle-slider"></span>
          </div>
          <button class="reset-btn" onclick="dashboard.resetUsage('${user.id}', '${tool.id}')"
                  title="Reset usage counter">↻</button>
        </div>
      `;
    }).join('');

    return `
      <div class="user-row expanded">
        <div class="user-basic-info">
          <div class="user-email">${this.escapeHtml(user.email)}</div>
          <div class="user-details">
            <span>${this.escapeHtml(user.full_name || 'N/A')}</span>
            <span class="join-date">${joinDate}</span>
          </div>
        </div>
        <div class="user-status ${status}">${status}</div>
        <div class="user-actions">
          <button class="action-btn delete" onclick="dashboard.cancelUserSub('${user.id}')">Cancel</button>
        </div>
      </div>
      <div class="user-tool-access">
        <div class="tool-access-header">
          <h4>Tool Access</h4>
        </div>
        <div class="tool-access-grid">
          ${toolToggles}
        </div>
      </div>
    `;
  }).join('');

  this.usersContainer.innerHTML = usersHTML;
}

// Toggle tool access
async toggleToolAccess(userId, toolType, isEnabled) {
  try {
    const result = isEnabled 
      ? await adminUserManager.grantToolAccess(userId, toolType)
      : await adminUserManager.revokeToolAccess(userId, toolType);
    
    if (result.error) {
      alert(`Failed to ${isEnabled ? 'grant' : 'revoke'} tool access`);
      // Revert toggle
      document.getElementById(`tool-${userId}-${toolType}`).checked = !isEnabled;
    } else {
      console.log(`Tool access ${isEnabled ? 'granted' : 'revoked'} successfully`);
    }
  } catch (error) {
    alert('Error updating tool access');
    console.error('Toggle tool access error:', error);
  }
}

// Reset usage counter
async resetUsage(userId, toolType) {
  if (!confirm('Reset usage counter for this tool? This cannot be undone.')) {
    return;
  }

  try {
    const { error } = await adminUserManager.resetUsageCounter(userId, toolType);
    if (error) {
      alert('Failed to reset usage counter');
    } else {
      alert('Usage counter reset successfully');
      await this.loadDashboard(); // Refresh dashboard
    }
  } catch (error) {
    alert('Error resetting usage counter');
    console.error('Reset usage error:', error);
  }
}
```

### 3. CSS for Enhanced UI

Add these styles to the admin dashboard:

```css
/* Enhanced user management styles */
.user-row.expanded {
  grid-template-columns: 1fr auto auto;
  padding: var(--space-md);
  border-bottom: var(--border-thin);
}

.user-basic-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.user-details {
  display: flex;
  gap: var(--space-md);
  font-size: 14px;
  opacity: 0.7;
}

.join-date {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.user-tool-access {
  grid-column: 1 / -1;
  padding: var(--space-md);
  background: var(--bg-paper);
  border-top: var(--border-thin);
}

.tool-access-header h4 {
  margin: 0 0 var(--space-md) 0;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.tool-access-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
}

.tool-access-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-white);
  border: var(--border-thin);
  border-radius: var(--border-radius-sm);
}

.toggle-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  min-width: 100px;
}

.toggle-switch {
  position: relative;
  width: 44px;
  height: 24px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--gold);
  transition: 0.2s;
  border-radius: 24px;
  border: var(--border-thin);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: var(--green);
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.reset-btn {
  width: 24px;
  height: 24px;
  border: var(--border-thin);
  background: var(--bg-paper);
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  font-size: 14px;
  transition: all 0.2s;
}

.reset-btn:hover {
  transform: rotate(90deg);
  box-shadow: var(--shadow-hard);
}

@media (max-width: 768px) {
  .tool-access-grid {
    grid-template-columns: 1fr;
  }
  
  .user-row.expanded {
    grid-template-columns: 1fr;
    gap: var(--space-md);
  }
}
```

## Implementation Steps

1. **Database Setup**:
   - Execute the SQL script to create new tables and functions
   - Verify all RLS policies are correctly applied

2. **API Endpoints**:
   - Create the three new API endpoint files
   - Test each endpoint with proper authentication

3. **Frontend Updates**:
   - Update the `AdminUserManager` class with new methods
   - Enhance the admin dashboard UI with tool access controls
   - Add the new CSS styles

4. **Testing**:
   - Test granting/revoking tool access
   - Test usage counter reset functionality
   - Verify audit logging is working
   - Test with non-admin users to ensure security

5. **Deployment**:
   - Deploy the new API endpoints
   - Update the frontend files
   - Monitor for any issues

## Security Considerations

1. **Admin Verification**: All endpoints verify the user is an admin before processing
2. **Input Validation**: All inputs are validated on both client and server side
3. **Audit Trail**: All admin actions are logged with details
4. **RLS Policies**: Proper Row Level Security ensures users can only access their own data
5. **Error Handling**: Comprehensive error handling prevents information leakage

## Future Enhancements

1. **Bulk Operations**: Allow bulk granting/revoking of tool access
2. **Usage Analytics**: Detailed usage analytics and reporting
3. **Custom Limits**: Allow setting custom usage limits per user
4. **Tool Groups**: Group tools into categories for easier management
5. **Scheduled Actions**: Schedule tool access changes or usage resets

This implementation provides a comprehensive solution for admin users to manage regular users' tool access and usage counters while maintaining security and auditability.