# Admin API Documentation

## Overview

This document describes the API endpoints for Admin User management capabilities, including tool access control and usage counter management.

## Authentication

All admin API endpoints require:
- Valid JWT token from Supabase Auth
- User must be an admin (email: `setyourownsalary@gmail.com`)
- Token must be sent in `Authorization: Bearer <token>` header

## Endpoints

### 1. Grant/Revoke Tool Access

**Endpoint**: `POST /api/admin/grant-tool-access`

**Description**: Grants or revokes tool access for a specific user

**Request Body**:
```json
{
  "user_id": "uuid",
  "tool_type": "blog_generator|social_captions|email_campaigns|product_descriptions",
  "is_enabled": true|false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Tool access granted successfully"
}
```

**Error Responses**:
- `400` - Missing required fields or invalid tool type
- `401` - Unauthorized (invalid or missing token)
- `403` - Admin access required
- `500` - Server error

**Example**:
```javascript
const response = await fetch('/api/admin/grant-tool-access', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <jwt_token>'
  },
  body: JSON.stringify({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    tool_type: 'blog_generator',
    is_enabled: true
  })
});

const result = await response.json();
```

### 2. Reset Usage Counter

**Endpoint**: `POST /api/admin/reset-usage-counter`

**Description**: Resets the usage counter for a specific tool and user

**Request Body**:
```json
{
  "user_id": "uuid",
  "tool_type": "blog_generator|social_captions|email_campaigns|product_descriptions"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Usage counter reset successfully"
}
```

**Error Responses**:
- `400` - Missing required fields or invalid tool type
- `401` - Unauthorized (invalid or missing token)
- `403` - Admin access required
- `500` - Server error

**Example**:
```javascript
const response = await fetch('/api/admin/reset-usage-counter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <jwt_token>'
  },
  body: JSON.stringify({
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    tool_type: 'social_captions'
  })
});

const result = await response.json();
```

### 3. Get User Tool Access

**Endpoint**: `GET /api/admin/user-tool-access?user_id=<uuid>`

**Description**: Retrieves tool access status and usage information for a user

**Query Parameters**:
- `user_id` (required): UUID of the user

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "tool_type": "blog_generator",
      "is_enabled": true,
      "generation_count": 25,
      "monthly_limit": 100,
      "remaining_usage": 75
    },
    {
      "tool_type": "social_captions",
      "is_enabled": false,
      "generation_count": 0,
      "monthly_limit": 100,
      "remaining_usage": 100
    }
  ]
}
```

**Error Responses**:
- `400` - Missing user_id parameter
- `401` - Unauthorized (invalid or missing token)
- `403` - Admin access required
- `500` - Server error

**Example**:
```javascript
const response = await fetch('/api/admin/user-tool-access?user_id=123e4567-e89b-12d3-a456-426614174000', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});

const result = await response.json();
```

## Database Functions

### 1. set_tool_access

**Function**: `set_tool_access(p_user_id, p_tool_type, p_is_enabled, p_admin_id)`

**Description**: Sets tool access for a user and logs the action

**Parameters**:
- `p_user_id` (UUID): Target user ID
- `p_tool_type` (TEXT): Tool type
- `p_is_enabled` (BOOLEAN): Whether access is enabled
- `p_admin_id` (UUID): Admin user ID performing the action

**Returns**: `BOOLEAN` - Success status

**Usage**:
```sql
SELECT set_tool_access(
  '123e4567-e89b-12d3-a456-426614174000',
  'blog_generator',
  true,
  'admin_user_uuid'
);
```

### 2. reset_tool_usage

**Function**: `reset_tool_usage(p_user_id, p_tool_type, p_admin_id)`

**Description**: Resets usage counter for a user and logs the action

**Parameters**:
- `p_user_id` (UUID): Target user ID
- `p_tool_type` (TEXT): Tool type
- `p_admin_id` (UUID): Admin user ID performing the action

**Returns**: `BOOLEAN` - Success status

**Usage**:
```sql
SELECT reset_tool_usage(
  '123e4567-e89b-12d3-a456-426614174000',
  'social_captions',
  'admin_user_uuid'
);
```

### 3. get_user_tool_access

**Function**: `get_user_tool_access(p_user_id)`

**Description**: Gets comprehensive tool access and usage information for a user

**Parameters**:
- `p_user_id` (UUID): Target user ID

**Returns**: TABLE with columns:
- `tool_type` (TEXT)
- `is_enabled` (BOOLEAN)
- `generation_count` (INTEGER)
- `monthly_limit` (INTEGER)
- `remaining_usage` (INTEGER)

**Usage**:
```sql
SELECT * FROM get_user_tool_access('123e4567-e89b-12d3-a456-426614174000');
```

### 4. can_use_tool (Updated)

**Function**: `can_use_tool(p_user_id, p_tool_type)`

**Description**: Updated function that checks both subscription status and tool-specific access

**Parameters**:
- `p_user_id` (UUID): User ID
- `p_tool_type` (TEXT): Tool type

**Returns**: `BOOLEAN` - Whether user can use the tool

**Logic Flow**:
1. Check if user has active subscription
2. Check if tool access is enabled for user
3. Check if usage limit is not exceeded

## Database Schema

### user_tool_access Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| tool_type | TEXT | Tool type (blog_generator, social_captions, etc.) |
| is_enabled | BOOLEAN | Whether tool access is enabled |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |
| created_by | UUID | Admin user who granted access |

### admin_action_log Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| admin_id | UUID | Admin user who performed action |
| target_user_id | UUID | User affected by action |
| action_type | TEXT | Type of action (grant_access, revoke_access, reset_usage) |
| tool_type | TEXT | Tool type (if applicable) |
| details | JSONB | Additional action details |
| created_at | TIMESTAMPTZ | Action timestamp |

## Security Considerations

### 1. Authentication & Authorization
- All endpoints require valid JWT token
- Admin status verified by email check
- Row Level Security (RLS) policies enforced

### 2. Input Validation
- Tool type validation against allowed values
- UUID format validation
- Boolean type validation for is_enabled

### 3. Audit Trail
- All admin actions logged with:
  - Admin user ID
  - Target user ID
  - Action type
  - Timestamp
  - Additional details

### 4. Error Handling
- Generic error messages to prevent information leakage
- Detailed logging for debugging
- Proper HTTP status codes

## Frontend Integration

### AdminUserManager Methods

```javascript
// Grant tool access
await adminUserManager.grantToolAccess(userId, toolType);

// Revoke tool access
await adminUserManager.revokeToolAccess(userId, toolType);

// Reset usage counter
await adminUserManager.resetUsageCounter(userId, toolType);

// Get user tool access
const { data } = await adminUserManager.getUserToolAccess(userId);
```

### UI Components

1. **Tool Access Toggles**:
   - Switch components for each tool
   - Visual feedback for enabled/disabled state
   - Confirmation dialogs for actions

2. **Usage Reset Buttons**:
   - Reset buttons next to each tool
   - Confirmation before reset
   - Success/error notifications

3. **User Management Grid**:
   - Expandable rows for tool access details
   - Bulk operation capabilities
   - Real-time status updates

## Testing

### Unit Tests

1. **API Endpoint Tests**:
   - Test authentication requirements
   - Test authorization checks
   - Test input validation
   - Test error responses

2. **Database Function Tests**:
   - Test tool access grant/revoke
   - Test usage counter reset
   - Test audit logging
   - Test edge cases

### Integration Tests

1. **End-to-End Workflows**:
   - Complete admin workflow
   - User access validation
   - Usage tracking accuracy

2. **Security Tests**:
   - Unauthorized access attempts
   - SQL injection prevention
   - XSS prevention

## Monitoring & Logging

### 1. Application Logs
- API request/response logging
- Error tracking and alerting
- Performance monitoring

### 2. Database Logs
- Admin action audit trail
- Query performance monitoring
- Connection pool monitoring

### 3. User Analytics
- Tool usage patterns
- Admin action frequency
- User access changes over time

## Rate Limiting

Consider implementing rate limiting for:
- API endpoints to prevent abuse
- Admin actions to prevent accidental bulk changes
- Usage reset operations to maintain data integrity

## Deployment Considerations

### 1. Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
ADMIN_EMAIL=setyourownsalary@gmail.com
```

### 2. Database Migration
- Run SQL scripts in order
- Verify table creation
- Test RLS policies
- Validate function creation

### 3. API Deployment
- Deploy new endpoint files
- Update routing configuration
- Test authentication flow
- Monitor for errors

## Troubleshooting

### Common Issues

1. **401 Unauthorized**:
   - Check JWT token validity
   - Verify token format in header
   - Ensure user is logged in

2. **403 Forbidden**:
   - Verify admin email is correct
   - Check admin authentication
   - Confirm RLS policies

3. **400 Bad Request**:
   - Validate request body format
   - Check required fields
   - Verify tool type values

4. **500 Server Error**:
   - Check database connection
   - Review server logs
   - Verify environment variables

### Debugging Steps

1. Check browser console for JavaScript errors
2. Review network tab for failed requests
3. Check server logs for detailed errors
4. Verify database function execution
5. Test with known good data

This documentation provides comprehensive information for implementing, testing, and maintaining the admin tool access management system.