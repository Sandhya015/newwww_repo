/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

// Context
import { UserContext } from "../../context/User/UserContext";

// API Methods
import { getAPI, patchAPI, postAPI, putAPI } from "../../lib/api";
interface ProfileDetailsResponse {
    status: number | null;
    error: string | null;
    profile: {
        email: string | null;
        name: string | null;
        profile_pic: string | null;
    };
}

export const useHandleProfileDetails = () => {
    // Context
    const userContext = useContext(UserContext);
    
    const [isProfileDetailsLoading, setIsProfileDetailsLoading] = useState<boolean>(false);
    const [profileDetailsError, setProfileDetailsError] = useState<string | null>(null);
    const [profileDetailsResponse, setProfileDetailsResponse] = useState<ProfileDetailsResponse | null>(null);

    const profileDetails = async (): Promise<ProfileDetailsResponse | null> => {
        try {
            setIsProfileDetailsLoading(true);

            // Call Profile Details API
            const response = await getAPI<ProfileDetailsResponse>("profile");

            // Handle API Error
            if (response?.error) {
                setProfileDetailsError(response.error);

                return null;
            }

            // Handle API Success
            if (response?.profile) {
                setProfileDetailsResponse(response);
                setProfileDetailsError(null);

                return response;
            }

            return null;
        } catch (error) {
            console.error("Error while profile details:", error);
            return null;
        } finally {
            setIsProfileDetailsLoading(false);
        }
    };

    return { profileDetails, profileDetailsResponse, isProfileDetailsLoading, profileDetailsError };
};
// Profile Parsrd Details API End

// Profile API Start
interface UpdateProfileResponse {
    resume?: string | null;
    message: string | null;
    updated_profile: {
        email: string | null;
        modified_at: string | null;
        name: string | null;
    }
}

export const useHandleProfileUpdate = () => {
    const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
    const [profileUpdateError, setProfileUpdateError] = useState<string>('');
    const [profileResponse, setProfileResponse] = useState<UpdateProfileResponse | null>(null);

    const navigate = useNavigate();

    const profile = async (formData: any, form?: any) => {
        try {
            // Start Loading State
            setIsProfileLoading(true);

            // Call Profile API
            const response = await putAPI("users/email", formData);

            // Handle API Success
            if (response?.success === true && response?.data?.message) {
                setProfileUpdateError('');

                setProfileResponse(response?.data);

                // Clear the form after successful update
                if (form) {
                    form.resetFields();
                }

                // Dismiss any existing toasts and show success message
                toast.dismiss();
                toast.success(response?.data?.message || "Email updated successfully.");

                // TODO: Uncomment below when OTP verification is ready on backend
                // Set `new_email` In Session Storage
                // sessionStorage.setItem('new_email', formData?.new_email);
                // Redirect To `verify-email-change`
                // navigate("/verify-email-change");
            } else {
                // Handle API Error
                if (response?.status_code === 500) {
                    toast.error('Internal server error');

                    setProfileUpdateError('Internal server error');
                } else {
                    setProfileUpdateError(response?.data?.message ?? 'Something went wrong please try again!');
                }
            }
        } catch (error) {
            // Console Error
            console.error('Error while profile: ', error);
        } finally {
            // End Loading State
            setIsProfileLoading(false);
        }
    };

    return { profile, profileResponse, profileUpdateError, isProfileLoading };
};
// Profile API End

// Verify Email Change API Start
interface VerifyEmailChangeResponse {
    resume?: string | null;
    message: string | null;
    updated_profile: {
        email: string | null;
        modified_at: string | null;
        name: string | null;
    }
}

export const useHandleVerifyEmailChange = () => {
    const [isVerifyEmailChangeLoading, setIsVerifyEmailChangeLoading] = useState<boolean>(false);
    const [verifyEmailChangeError, setVerifyEmailChangeError] = useState<string>('');
    const [verifyEmailChangeResponse, setVerifyEmailChangeResponse] = useState<VerifyEmailChangeResponse | null>(null);

    const navigate = useNavigate();

    const verifyEmailChange = async (formData: any) => {
        try {
            // Start Loading State
            setIsVerifyEmailChangeLoading(true);

            // Call Profile API
            const response = await postAPI("profile/verify-email-change", formData);

            // Handle API Success
            if (response?.success === true && response?.data?.message) {
                setVerifyEmailChangeError(null);

                setVerifyEmailChangeResponse(response?.data);

                // Show Toast Message
                toast.success(response?.data?.message || "Profile updated successfully.");

                // Redirect To `update-profile`
                navigate("/update-profile");
            } else {
                // Handle API Error
                if (response?.status_code === 500) {
                    toast.error('Internal server error');

                    setVerifyEmailChangeError('Internal server error');
                } else {
                    setVerifyEmailChangeError(response?.data?.message ?? 'Something went wrong please try again!');
                }
            }
        } catch (error) {
            // Console Error
            console.error('Error while profile: ', error);
        } finally {
            // End Loading State
            setIsVerifyEmailChangeLoading(false);
        }
    };

    return { verifyEmailChange, verifyEmailChangeResponse, verifyEmailChangeError, isVerifyEmailChangeLoading };
};
// Verify Email Change API End
