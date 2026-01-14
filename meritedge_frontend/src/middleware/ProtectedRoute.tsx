import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentAssessment } from "../store/miscSlice";
import { isUserAuthenticated, isAdminAuthenticated } from "../utils/auth";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    // If admin is logged in, redirect to admin dashboard
    if (isAdminAuthenticated()) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // If user is not authenticated, redirect to login
    if (!isUserAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

// New component to protect routes that require assessment data
interface AssessmentProtectedRouteProps {
    children: React.ReactNode;
}

export const AssessmentProtectedRoute: React.FC<AssessmentProtectedRouteProps> = ({ children }) => {
    const currentAssessment = useSelector(selectCurrentAssessment);
       
    // Check if user is authenticated and not admin
    if (!isUserAuthenticated() || isAdminAuthenticated()) {
        return <Navigate to="/" replace />;
    }

    // Check if assessment data exists in store
    if (!currentAssessment) {
        return <Navigate to="/cognitive" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
