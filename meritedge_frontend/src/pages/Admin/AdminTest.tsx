import React from 'react';
import { Typography, Card, Button, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUserType, isUserAuthenticated, isAdminAuthenticated } from '../../utils/auth';
import { isRouteAccessible, getRedirectPathForRoute, shouldRedirectFromCurrentRoute } from '../../utils/routeProtection';

const { Title, Text } = Typography;

export default function AdminTest() {
    const navigate = useNavigate();
    const userType = getUserType();
    const isUser = isUserAuthenticated();
    const isAdmin = isAdminAuthenticated();
    
    // Test route protection
    const testRoutes = [
        '/',
        '/dashboard',
        '/admin/login',
        '/admin/dashboard',
        '/admin/users',
        '/admin/settings'
    ];
    
    const routeAccessibility = testRoutes.map(route => ({
        route,
        accessible: isRouteAccessible(route),
        redirectTo: getRedirectPathForRoute(route)
    }));
    
    const currentRouteRedirect = shouldRedirectFromCurrentRoute('/admin/test');

    return (
        <div className="min-h-screen p-6">
            <div className="max-w-4xl mx-auto">
                <Card>
                    <Title level={1} className="!mb-4">Admin System Test</Title>
                    
                    {/* Authentication Status */}
                    <div className="mb-6">
                        <Alert
                            message={`Current Authentication Status: ${userType.toUpperCase()}`}
                            description={
                                <div>
                                    <p><strong>User Authenticated:</strong> {isUser ? 'Yes' : 'No'}</p>
                                    <p><strong>Admin Authenticated:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                                    <p><strong>Current Route:</strong> /admin/test</p>
                                </div>
                            }
                            type={userType === 'admin' ? 'success' : userType === 'user' ? 'warning' : 'info'}
                            showIcon
                            className="mb-4"
                        />
                    </div>
                    
                    <Text className="text-lg block mb-6">
                        This is a test page to verify that the admin routing system is working correctly.
                    </Text>
                    
                    <div className="space-y-4">
                        <div>
                            <Text className="font-semibold">✅ Admin Routes Created:</Text>
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li>/admin/login - Admin login page</li>
                                <li>/admin/dashboard - Admin dashboard</li>
                                <li>/admin/users - User management</li>
                                <li>/admin/settings - System settings</li>
                            </ul>
                        </div>
                        
                        <div>
                            <Text className="font-semibold">🛡️ Route Protection Test:</Text>
                            <div className="mt-2 p-3 bg-gray-100 rounded-lg">
                                <p className="mb-2"><strong>Current Route Status:</strong></p>
                                <p className="text-sm">Should Redirect: {currentRouteRedirect.shouldRedirect ? 'Yes' : 'No'}</p>
                                <p className="text-sm">Redirect To: {currentRouteRedirect.redirectTo}</p>
                            </div>
                        </div>
                        
                        <div>
                            <Text className="font-semibold">🔒 Route Accessibility Matrix:</Text>
                            <div className="mt-2 space-y-2">
                                {routeAccessibility.map(({ route, accessible, redirectTo }) => (
                                    <div key={route} className="p-2 bg-gray-100 rounded text-sm">
                                        <span className="font-mono">{route}</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs ${accessible ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {accessible ? 'Accessible' : 'Blocked'}
                                        </span>
                                        {!accessible && <span className="ml-2 text-xs text-gray-600">→ {redirectTo}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <Text className="font-semibold">✅ Components Created:</Text>
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li>AdminLogin - Authentication form</li>
                                <li>AdminLayout - Layout wrapper</li>
                                <li>AdminDashboard - Main dashboard</li>
                                <li>AdminUsers - User management</li>
                                <li>AdminSettings - System settings</li>
                            </ul>
                        </div>
                        
                        <div>
                            <Text className="font-semibold">✅ Store & Middleware:</Text>
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li>adminSlice - Redux state management</li>
                                <li>AdminProtectedRoute - Route protection</li>
                                <li>AdminGuestRoute - Guest route protection</li>
                            </ul>
                        </div>
                        
                        <div>
                            <Text className="font-semibold">✅ API Integration:</Text>
                            <ul className="list-disc list-inside ml-4 mt-2">
                                <li>adminPostAPI - Admin API calls</li>
                                <li>AdminAuth - Authentication logic</li>
                                <li>Token storage as admin_access_token</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="mt-8 space-x-4">
                        <Button type="primary" onClick={() => navigate('/admin/login')}>
                            Test Admin Login
                        </Button>
                        <Button onClick={() => navigate('/admin/dashboard')}>
                            Test Admin Dashboard
                        </Button>
                        <Button onClick={() => navigate('/')}>
                            Back to Main App
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
