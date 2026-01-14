// Route protection utility functions

import { isUserAuthenticated, isAdminAuthenticated, getUserType } from './auth';

/**
 * Check if a route is accessible for the current user type
 */
export const isRouteAccessible = (routePath: string): boolean => {
    const userType = getUserType();
    
    // Admin routes
    if (routePath.startsWith('/admin')) {
        return userType === 'admin';
    }
    
    // User routes (excluding login)
    if (routePath === '/' || 
        routePath === '/dashboard' || 
        routePath === '/cognitive' ||
        routePath === '/question-library' ||
        routePath === '/question-add' ||
        routePath === '/question-setting' ||
        routePath === '/update-profile' ||
        routePath === '/change-password' ||
        routePath === '/verify-email-change') {
        return userType === 'user';
    }
    
    // Public routes (always accessible)
    return true;
};

/**
 * Get the appropriate redirect path based on current authentication and target route
 */
export const getRedirectPathForRoute = (targetRoute: string): string => {
    const userType = getUserType();
    
    // If trying to access admin routes as user
    if (targetRoute.startsWith('/admin') && userType === 'user') {
        return '/cognitive';
    }
    
    // If trying to access user routes as admin
    if ((targetRoute === '/' || 
         targetRoute === '/dashboard' || 
         targetRoute === '/cognitive' ||
         targetRoute === '/question-library' ||
         targetRoute === '/question-add' ||
         targetRoute === '/question-setting' ||
         targetRoute === '/update-profile' ||
         targetRoute === '/change-password' ||
         targetRoute === '/verify-email-change') && userType === 'admin') {
        return '/admin/dashboard';
    }
    
    // If not authenticated and trying to access protected routes
    if (userType === 'none') {
        if (targetRoute.startsWith('/admin')) {
            return '/admin/login';
        } else if (targetRoute !== '/') {
            return '/';
        }
    }
    
    // No redirect needed
    return targetRoute;
};

/**
 * Check if current user should be redirected from current route
 */
export const shouldRedirectFromCurrentRoute = (currentRoute: string): { shouldRedirect: boolean; redirectTo: string } => {
    const userType = getUserType();
    
    // If admin is on user routes
    if (userType === 'admin' && 
        (currentRoute === '/' || 
         currentRoute === '/dashboard' || 
         currentRoute === '/cognitive' ||
         currentRoute === '/question-library' ||
         currentRoute === '/question-add' ||
         currentRoute === '/question-setting' ||
         currentRoute === '/update-profile' ||
         currentRoute === '/change-password' ||
         currentRoute === '/verify-email-change')) {
        return { shouldRedirect: true, redirectTo: '/admin/dashboard' };
    }
    
    // If user is on admin routes
    if (userType === 'user' && currentRoute.startsWith('/admin')) {
        return { shouldRedirect: true, redirectTo: '/cognitive' };
    }
    
    // If no one is authenticated on protected routes
    if (userType === 'none') {
        if (currentRoute.startsWith('/admin') && currentRoute !== '/admin/login') {
            return { shouldRedirect: true, redirectTo: '/admin/login' };
        } else if (currentRoute !== '/') {
            return { shouldRedirect: true, redirectTo: '/' };
        }
    }
    
    return { shouldRedirect: false, redirectTo: currentRoute };
};
