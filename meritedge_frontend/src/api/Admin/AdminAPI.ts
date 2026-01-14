/* eslint-disable @typescript-eslint/no-explicit-any */

import { adminPostAPI } from "../../lib/api";

// Admin API function for authenticated admin calls
export const adminGetAPI = async (api_url: string) => {
    try {
        const adminToken = localStorage.getItem("admin_access_token");
        
        if (!adminToken) {
            throw new Error("Admin token not found");
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
            method: "GET",
            headers: { 
                "accept": "application/json",
                "Authorization": `Bearer ${adminToken}` 
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clear admin token and redirect to admin login
                localStorage.removeItem('admin_access_token');
                window.location.href = '/admin/login';
                return { success: false, status_code: response?.status, data: "Authentication failed" };
            } else if (response.status === 403) {
                return { success: false, status_code: response?.status, data: "Access denied" };
            } else if (response.status === 500) {
                return { success: false, status_code: response?.status, data: "Internal server error" };
            } else {
                // JSON Encode Error Response
                const jsonEncodeErrorResponse = await response.json();
                return { success: false, status_code: response?.status, data: jsonEncodeErrorResponse };
            }
        }

        // JSON Encode Response
        const jsonEncodeResponse = await response.json();
        return { success: true, data: jsonEncodeResponse };
    } catch (error) {
        console.error("Admin API Error: ", error);
        return { success: false, error };
    }
};

// Admin API function for POST requests
export const adminPostAPIWithAuth = async (api_url: string, data: unknown) => {
    try {
        const adminToken = localStorage.getItem("admin_access_token");
        
        if (!adminToken) {
            throw new Error("Admin token not found");
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
            method: "POST",
            headers: { 
                "accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}` 
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clear admin token and redirect to admin login
                localStorage.removeItem('admin_access_token');
                window.location.href = '/admin/login';
                return { success: false, status_code: response?.status, data: "Authentication failed" };
            } else if (response.status === 403) {
                return { success: false, status_code: response?.status, data: "Access denied" };
            } else if (response.status === 500) {
                return { success: false, status_code: response?.status, data: "Internal server error" };
            } else {
                // JSON Encode Error Response
                const jsonEncodeErrorResponse = await response.json();
                return { success: false, status_code: response?.status, data: jsonEncodeErrorResponse };
            }
        }

        // JSON Encode Response
        const jsonEncodeResponse = await response.json();
        return { success: true, data: jsonEncodeResponse };
    } catch (error) {
        console.error("Admin API Error: ", error);
        return { success: false, error };
    }
};

// Admin API function for PUT requests
export const adminPutAPI = async (api_url: string, data: unknown) => {
    try {
        const adminToken = localStorage.getItem("admin_access_token");
        
        if (!adminToken) {
            throw new Error("Admin token not found");
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
            method: "PUT",
            headers: { 
                "accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${adminToken}` 
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clear admin token and redirect to admin login
                localStorage.removeItem('admin_access_token');
                window.location.href = '/admin/login';
                return { success: false, status_code: response?.status, data: "Authentication failed" };
            } else if (response.status === 403) {
                return { success: false, status_code: response?.status, data: "Access denied" };
            } else if (response.status === 500) {
                return { success: false, status_code: response?.status, data: "Internal server error" };
            } else {
                // JSON Encode Error Response
                const jsonEncodeErrorResponse = await response.json();
                return { success: false, status_code: response?.status, data: jsonEncodeErrorResponse };
            }
        }

        // JSON Encode Response
        const jsonEncodeResponse = await response.json();
        return { success: true, data: jsonEncodeResponse };
    } catch (error) {
        console.error("Admin API Error: ", error);
        return { success: false, error };
    }
};

// Admin API function for DELETE requests
export const adminDeleteAPI = async (api_url: string) => {
    try {
        const adminToken = localStorage.getItem("admin_access_token");
        
        if (!adminToken) {
            throw new Error("Admin token not found");
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}${api_url}`, {
            method: "DELETE",
            headers: { 
                "accept": "application/json",
                "Authorization": `Bearer ${adminToken}` 
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clear admin token and redirect to admin login
                localStorage.removeItem('admin_access_token');
                window.location.href = '/admin/login';
                return { success: false, status_code: response?.status, data: "Authentication failed" };
            } else if (response.status === 403) {
                return { success: false, status_code: response?.status, data: "Access denied" };
            } else if (response.status === 500) {
                return { success: false, status_code: response?.status, data: "Internal server error" };
            } else {
                // JSON Encode Error Response
                const jsonEncodeErrorResponse = await response.json();
                return { success: false, status_code: response?.status, data: jsonEncodeErrorResponse };
            }
        }

        // For DELETE requests, we might not get a response body
        let responseData = null;
        try {
            responseData = await response.json();
        } catch {
            // If no response body, that's fine for DELETE
            responseData = { message: "Item deleted successfully" };
        }

        return { success: true, data: responseData };
    } catch (error) {
        console.error("Admin API Error: ", error);
        return { success: false, error: "Network error occurred" };
    }
};
