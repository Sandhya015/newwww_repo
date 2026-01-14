import React from "react";
import { Navigate } from "react-router-dom";
import { isUserAuthenticated, isAdminAuthenticated } from "../utils/auth";

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
    // If user is authenticated but not admin, redirect to cognitive
    if (isUserAuthenticated() && !isAdminAuthenticated()) {
        return <Navigate to="/cognitive" replace />;
    }

    // If neither admin nor user is authenticated, redirect to admin login
    if (!isAdminAuthenticated()) {
        return <Navigate to="/admin/login" replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
