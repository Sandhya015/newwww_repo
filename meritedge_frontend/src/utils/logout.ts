import { store } from '../store/store';
import { logoutUser, clearCurrentAssessment } from '../store/miscSlice';
import { logoutAdmin } from '../store/adminSlice';
import { clearAllAuth, clearUserAuth, clearAdminAuth } from './auth';
import toast from 'react-hot-toast';

/**
 * Comprehensive logout function that clears all application state
 * This function should be called whenever a user logs out
 */
export const performLogout = () => {
    // Dismiss all active toasts
    toast.dismiss();
    
    // Clear all localStorage items
    const keysToRemove = [
        'access_token',
        'refresh_token', 
        'user',
        'theme',
        'resumeParsedDetails',
        'currentAssessment'
    ];
    
    // Remove known keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear any other potential localStorage items that might contain sensitive data
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
        if (key.includes('token') || 
            key.includes('user') || 
            key.includes('auth') || 
            key.includes('assessment') ||
            key.includes('resume') ||
            key.includes('profile')) {
            localStorage.removeItem(key);
        }
    });
    
    // Clear sessionStorage as well
    sessionStorage.clear();
    
    // Clear Redux store
    store.dispatch(logoutUser());
    store.dispatch(clearCurrentAssessment());
    
    // Clear any other potential state
    // You can add more store clearing actions here if needed
    
    console.log('Logout completed - all application state cleared');
};

/**
 * Admin-specific logout function
 */
export const performAdminLogout = () => {
    // Clear admin authentication
    clearAdminAuth();
    
    // Clear admin Redux state
    store.dispatch(logoutAdmin());
    
    console.log('Admin logout completed');
};

/**
 * User-specific logout function
 */
export const performUserLogout = () => {
    // Clear user authentication
    clearUserAuth();
    
    // Clear user Redux state
    store.dispatch(logoutUser());
    store.dispatch(clearCurrentAssessment());
    
    console.log('User logout completed');
};

/**
 * Complete logout function that clears everything
 */
export const performCompleteLogout = () => {
    // Clear all authentication
    clearAllAuth();
    
    // Clear all Redux state
    store.dispatch(logoutUser());
    store.dispatch(logoutAdmin());
    store.dispatch(clearCurrentAssessment());
    
    // Clear other localStorage items
    const keysToRemove = [
        'theme',
        'resumeParsedDetails',
        'currentAssessment'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    console.log('Complete logout completed - all state cleared');
};

/**
 * Check if user is logged in by verifying access token
 */
export const isUserLoggedIn = (): boolean => {
    const token = localStorage.getItem('access_token');
    return !!token && token.trim() !== '';
};

/**
 * Get current access token
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem('access_token');
};

/**
 * Clear only authentication-related data (useful for token refresh scenarios)
 */
export const clearAuthData = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    
    // Clear auth-related Redux state
    store.dispatch(logoutUser());
};
