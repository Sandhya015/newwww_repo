# Admin Login System

This project now includes a complete admin authentication system with the following features:

## Admin Routes

- **Admin Login**: `/admin/login` - Admin authentication page
- **Admin Dashboard**: `/admin/dashboard` - Main admin dashboard
- **User Management**: `/admin/users` - Manage platform users
- **System Settings**: `/admin/settings` - Configure platform settings

## Features

### 1. Admin Authentication
- Separate admin login endpoint: `POST /api/v1/admin-login`
- Admin tokens stored as `admin_access_token` in localStorage
- Separate Redux store for admin state management
- Protected admin routes with middleware

### 2. Admin Layout
- Professional admin interface with sidebar navigation
- Responsive design with collapsible sidebar
- User dropdown with logout functionality
- Consistent styling across all admin pages

### 3. Admin Pages
- **Dashboard**: Overview with statistics and quick actions
- **Users**: User management table with search and filters
- **Settings**: System configuration forms

## API Integration

The admin login uses the following API endpoint:
```bash
curl -X 'POST' \
  'https://k6zph7nl71.execute-api.ap-south-1.amazonaws.com/api/v1/admin-login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "admin@otomeyt.ai",
  "password": "your_password"
}'
```

### Response Format
```json
{
  "message": "Admin login successful",
  "user_data": {
    "unique_id": "user_1755520120",
    "full_name": "Platform Admin",
    "email": "admin@otomeyt.ai",
    "role": "admin",
    "status": "active",
    "force_password_change": true,
    "created_at": "2025-08-18T12:28:39Z",
    "updated_at": "2025-08-18T12:28:39Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Technical Implementation

### Redux Store
- **adminSlice**: Manages admin authentication state
- **adminSlice**: Handles admin user data and auth tokens
- **adminSlice**: Provides selectors for admin state

### Middleware
- **AdminProtectedRoute**: Protects admin routes from unauthorized access
- **AdminGuestRoute**: Prevents authenticated admins from accessing login page

### Components
- **AdminLayout**: Consistent layout wrapper for all admin pages
- **AdminLogin**: Authentication form with video background
- **AdminDashboard**: Main dashboard with statistics
- **AdminUsers**: User management interface
- **AdminSettings**: System configuration forms

## Security Features

1. **Token Storage**: Admin tokens stored separately from user tokens
2. **Route Protection**: All admin routes require valid admin authentication
3. **Session Management**: Automatic logout on token expiration
4. **Access Control**: Only users with admin role can access admin features

## Usage

### For Developers
1. Admin routes are completely separate from existing user routes
2. No changes to existing functionality
3. Admin state is managed independently in Redux
4. Easy to extend with additional admin features

### For Admins
1. Navigate to `/admin/login`
2. Enter admin credentials
3. Access admin dashboard and management tools
4. Use sidebar navigation to switch between admin pages

## File Structure

```
src/
├── api/Auth/AdminAuth.ts          # Admin authentication API
├── components/Layout/AdminLayout.tsx  # Admin layout component
├── middleware/
│   ├── AdminProtectedRoute.tsx    # Admin route protection
│   └── AdminGuestRoute.tsx        # Admin guest route protection
├── pages/Admin/
│   ├── AdminLogin.tsx             # Admin login page
│   ├── AdminDashboard.tsx         # Admin dashboard
│   ├── AdminUsers.tsx             # User management
│   └── AdminSettings.tsx          # System settings
└── store/
    └── adminSlice.ts              # Admin Redux slice
```

## Future Enhancements

- Admin user management (create, edit, delete users)
- System monitoring and analytics
- Audit logs and activity tracking
- Advanced permission management
- Bulk operations for user management
- Email notifications for admin actions
- Backup and restore functionality
- API rate limiting and security settings
