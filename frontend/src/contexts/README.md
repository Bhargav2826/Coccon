# AuthContext Documentation

## Overview

The `AuthContext` provides centralized authentication state management and automatic redirects for the application. It handles user authentication, role-based access control, and onboarding flow.

## Features

- **Automatic Authentication Checks**: Verifies user authentication on every route change
- **Role-Based Access Control**: Redirects users to appropriate dashboards based on their role
- **Onboarding Flow**: Handles the onboarding process for new users
- **Automatic Redirects**: Redirects unauthenticated users to login, authenticated users to their dashboard
- **Error Handling**: Provides user-friendly error messages for authentication issues
- **Logout Functionality**: Centralized logout with proper cleanup

## Usage

### Basic Usage

```jsx
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { authUser, isAuthenticated, isLoading, logout } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {authUser.fullName}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
};
```

### Available Properties

#### State
- `authUser`: Current authenticated user object (null if not authenticated)
- `isAuthenticated`: Boolean indicating if user is authenticated
- `isOnboarded`: Boolean indicating if user has completed onboarding
- `isLoading`: Boolean indicating if authentication check is in progress
- `error`: Any authentication error that occurred

#### Actions
- `logout()`: Logs out the user and redirects to login page
- `refreshAuth()`: Refreshes the authentication data

#### Utilities
- `getDashboardPath()`: Returns the appropriate dashboard path for the user's role
- `isProtectedRoute(pathname)`: Checks if a route requires authentication
- `requiresRole(pathname, role)`: Checks if a route requires a specific role

## Route Protection

### Automatic Redirects

The AuthContext automatically handles redirects based on authentication state:

1. **Unauthenticated users** accessing protected routes → Redirected to `/login`
2. **Authenticated but not onboarded** users → Redirected to `/onboarding`
3. **Authenticated and onboarded** users accessing login/signup → Redirected to their dashboard
4. **Wrong role access** → Redirected to appropriate dashboard

### Protected Routes

Use the `ProtectedRoute` component to wrap protected content:

```jsx
import ProtectedRoute from '../components/ProtectedRoute';

// Basic protection
<ProtectedRoute>
  <MyProtectedComponent />
</ProtectedRoute>

// Role-specific protection
<ProtectedRoute requiredRole="faculty">
  <FacultyOnlyComponent />
</ProtectedRoute>
```

## Route Configuration

### Public Routes
- `/login` - Login page
- `/signup` - Registration page  
- `/onboarding` - User onboarding

### Protected Routes
- `/` - Home page (classroom members)
- `/friends` - Friends page
- `/faculty-dashboard` - Faculty dashboard (faculty only)
- `/parent-dashboard` - Parent dashboard (parent only)
- `/student-dashboard` - Student dashboard (student only)
- `/faculty-messages` - Faculty messages (student only)
- `/notifications` - Notifications page
- `/call/:id` - Video call page
- `/chat/:id` - Chat page

## Error Handling

The AuthContext provides automatic error handling:

- **401 Unauthorized**: "Session expired. Please log in again."
- **403 Forbidden**: "Access denied. You don't have permission for this action."
- **Network Errors**: "Network error. Please check your connection."

## Integration

The AuthContext is automatically integrated into the app via `main.jsx`:

```jsx
<AuthProvider>
  <App />
</AuthProvider>
```

All components can access authentication state using the `useAuth` hook.
