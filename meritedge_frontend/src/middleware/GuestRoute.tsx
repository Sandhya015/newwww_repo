import React from "react";
import { Navigate } from "react-router-dom";
import { isUserAuthenticated, isAdminAuthenticated } from "../utils/auth";

interface GuestRouteProps {
    children: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({ children }) => {
    // If admin is logged in, redirect to admin dashboard
    if (isAdminAuthenticated()) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // If user is authenticated, redirect to cognitive
    if (isUserAuthenticated()) {
        return <Navigate to="/cognitive" replace />;
    }

    return <>{children}</>;
};

export default GuestRoute;
