// Authentication utility functions

/**
 * Check if a regular user is authenticated
 */
export const isUserAuthenticated = (): boolean => {
    return !!localStorage.getItem("access_token");
};

/**
 * Check if an admin is authenticated
 */
export const isAdminAuthenticated = (): boolean => {
    return !!localStorage.getItem("admin_access_token");
};

/**
 * Check if any user (regular or admin) is authenticated
 */
export const isAnyUserAuthenticated = (): boolean => {
    return isUserAuthenticated() || isAdminAuthenticated();
};

/**
 * Get the current user type
 */
export const getUserType = (): 'user' | 'admin' | 'none' => {
    if (isAdminAuthenticated()) {
        return 'admin';
    }
    if (isUserAuthenticated()) {
        return 'user';
    }
    return 'none';
};

/**
 * Clear all authentication tokens
 */
export const clearAllAuth = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("admin_access_token");
    localStorage.removeItem("user");
};

/**
 * Clear only user authentication
 */
export const clearUserAuth = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
};

/**
 * Clear only admin authentication
 */
export const clearAdminAuth = (): void => {
    localStorage.removeItem("admin_access_token");
};

/**
 * Get the appropriate redirect path based on authentication status
 */
export const getRedirectPath = (): string => {
    if (isAdminAuthenticated()) {
        return '/admin/dashboard';
    }
    if (isUserAuthenticated()) {
        return '/cognitive';
    }
    return '/';
};
