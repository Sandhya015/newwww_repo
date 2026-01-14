/* eslint-disable @typescript-eslint/no-explicit-any */

import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";

// Context
import { UserContext } from "../../context/User/UserContext";

// API Methods
import { postAPI } from "../../lib/api";

// Store actions
import { loginUser } from "../../store/miscSlice";

// Login With Password API Start

export const useHandleLoginWithPassword = () => {
    // Context
    const userContext = useContext(UserContext);
    
    // Redux dispatch
    const dispatch = useDispatch();

    const [isLoginWithPasswordLoading, setIsLoginWithPasswordLoading] = useState<boolean>(false);
    const [loginWithPasswordError, setLoginWithPasswordError] = useState<string | null>(null);

    const navigate = useNavigate();

    const loginWithPassword = async (formData: any) => {
        try {
            // Start Loading State
            setIsLoginWithPasswordLoading(true);

            // Call Login API
            const response = await postAPI("users/login", formData);
            
            // Handle API Success
            if (response?.success === true && response?.data?.access_token) {
                // Set Error NULL
                setLoginWithPasswordError(null);

                // Set `access_token` In Local Storage
                localStorage.setItem("access_token", response?.data?.access_token);
                localStorage.setItem("refresh_token", response?.data?.refresh_token);

                // Update UserContext
                userContext?.setAccessToken(response?.data?.access_token);

                // Save user data to Redux store
                dispatch(loginUser({
                    user: response?.data?.user,
                    auth: {
                        access_token: response?.data?.access_token,
                        refresh_token: response?.data?.refresh_token,
                        token_type: response?.data?.token_type,
                        expires_in: response?.data?.expires_in
                    }
                }));

                // Show Toast Message
                toast.success("Login successfully.");

                // Redirect To `cognitive`
                navigate("/cognitive");
            } else {
                // Handle API Error
                if (response?.status_code === 500) {
                    toast.error('Internal server error');
                    setLoginWithPasswordError('Internal server error');
                } else if (response?.status_code === 401 || response?.status_code === 400) {
                    // Invalid credentials
                    setLoginWithPasswordError('Invalid email or password');
                } else {
                    // Use API message if available, otherwise show invalid credentials
                    const errorMessage = response?.data?.message || response?.data?.detail || 'Invalid email or password';
                    setLoginWithPasswordError(errorMessage);
                }
            }
        } catch (error) {
            // Console Error
            console.error('Error while login: ', error);
        } finally {
            // End Loading State
            setIsLoginWithPasswordLoading(false);
        }
    };

    return { loginWithPassword, isLoginWithPasswordLoading, loginWithPasswordError };
};
// Login With Password  API End

// Change Password API Start

export const useHandleChangePassword = () => {
    const [isChangePasswordLoading, setIsChangePasswordLoading] = useState<boolean>(false);
    const [changePasswordError, setChangePasswordError] = useState<string | null>(null);

    const changePassword = async (formData: any, changePasswordForm: any) => {
        // Start Loading State
        setIsChangePasswordLoading(true);

        try {
            // Call Change Password API
            const response = await postAPI("users/change-password", formData);

            // Handle API Success
            if (response.success === true) {
                // Reset form
                changePasswordForm.resetFields();
                
                // Set Error NULL
                setChangePasswordError(null);

                // Show Toast Message
                toast.success(response?.data?.message ?? "Password changed successfully.");
            } else {
                // Handle API Error
                if (response?.status_code === 500) {
                    toast.error('Internal server error');
                    setChangePasswordError('Internal server error');
                } else {
                    // Extract error message from response - check both 'detail' and 'message' fields
                    const errorMessage = 
                        response?.data?.detail || 
                        response?.data?.message || 
                        'Something went wrong please try again!';
                    
                    toast.error(errorMessage);
                    setChangePasswordError(errorMessage);
                }
            }
        } catch (error) {
            // Console Error
            console.error('Error while changing password: ', error);
        } finally {
            // End Loading State
            setIsChangePasswordLoading(false);
        }
    };

    return { changePassword, isChangePasswordLoading, changePasswordError };
};
// Change Password API End
