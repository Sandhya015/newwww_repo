import React from "react";
import { Navigate } from "react-router-dom";
import { isUserAuthenticated, isAdminAuthenticated } from "../utils/auth";

interface AdminGuestRouteProps {
    children: React.ReactNode;
}

const AdminGuestRoute: React.FC<AdminGuestRouteProps> = ({ children }) => {
    // If admin is already authenticated, redirect to admin dashboard
    if (isAdminAuthenticated()) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // If user is authenticated, redirect to cognitive
    if (isUserAuthenticated()) {
        return <Navigate to="/cognitive" replace />;
    }

    return <>{children}</>;
};

export default AdminGuestRoute;
