/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

// Store actions
import { loginAdmin } from "../../store/adminSlice";

// API Methods
import { adminPostAPI } from "../../lib/api";

// Admin Login API Start
export const useHandleAdminLogin = () => {
    // Redux dispatch
    const dispatch = useDispatch();

    const [isAdminLoginLoading, setIsAdminLoginLoading] = useState<boolean>(false);
    const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

    const navigate = useNavigate();

    const adminLogin = async (formData: any) => {
        try {
            // Start Loading State
            setIsAdminLoginLoading(true);

            // Call Admin Login API
            const response = await adminPostAPI("admin-login", formData);
            
            // Handle API Success
            if (response?.success === true && response?.data?.token) {
                // Set Error NULL
                setAdminLoginError(null);

                // Set `admin_access_token` In Local Storage
                localStorage.setItem("admin_access_token", response?.data?.token);

                // Save admin data to Redux store
                dispatch(loginAdmin({
                    user: response?.data?.user_data,
                    auth: {
                        access_token: response?.data?.token,
                        role: response?.data?.user_data?.role
                    }
                }));

                // Show Toast Message
                toast.success("Admin login successful.");

                // Redirect To `admin/dashboard`
                navigate("/admin/dashboard");
            } else {
                // Handle API Error
                if (response?.status_code === 500) {
                    toast.error('Internal server error');
                    setAdminLoginError('Internal server error');
                } else {
                    setAdminLoginError(response?.data?.message ?? 'Something went wrong please try again!');
                }
            }
        } catch (error) {
            // Console Error
            console.error('Error while admin login: ', error);
        } finally {
            // End Loading State
            setIsAdminLoginLoading(false);
        }
    };

    return { adminLogin, isAdminLoginLoading, adminLoginError };
};
// Admin Login API End
