/* eslint-disable @typescript-eslint/no-unused-vars */
import { createBrowserRouter, RouterProvider } from "react-router";

// context
import { ToastProvider } from "./context/ToastContext";
import { AppContextsProvider } from "./context/AppContextsProvider";

// Layout
import UserLayout from "./components/Layout/UserLayout";
import ThemeAwareConfig from "./components/ui/ThemeAwareConfig";

// Middlewares
import ProtectedRoute from "./middleware/ProtectedRoute";
import GuestRoute from "./middleware/GuestRoute";
import AdminProtectedRoute from "./middleware/AdminProtectedRoute";
import AdminGuestRoute from "./middleware/AdminGuestRoute";

// Auth
import Login from "./pages/Auth/Login/Login";
import ForgotPassword from "./pages/Auth/ForgotPassword/ForgotPassword";

// Admin
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminTest from "./pages/Admin/AdminTest";
import AdminOrganizations from "./pages/Admin/AdminOrganizations";
import AdminCompanies from "./pages/Admin/AdminCompanies";
import AdminCompanyUsers from "./pages/Admin/AdminCompanyUsers";

// Dashboard
import Dashboard from "./pages/Dashboard/Dashboard";

// Profile
import Profile from "./pages/Profile/Profile";

// Settings
import UpdateProfile from "./pages/Settings/UpdateProfile";
import ChangePassword from "./pages/Settings/ChangePassword";
import VerifyEmailChange from "./pages/Settings/VerifyEmailChange";

// Cognitive
import Cognitive from "./pages/Cognitive/Cognitive";
import Dynamic from "./pages/Cognitive/Dynamic";
import OtoVideo from "./pages/Cognitive/OtoVideo";
import AssessmentDetail from "./pages/AssessmentDetail/AssessmentDetail";
import AssessmentDashboard from "./pages/AssessmentDashboard/AssessmentDashboard";

// Question Library
import QuestionLibrary from "./pages/QuestionLibrary/QuestionLibrary";

// Candidates
import Candidates from "./pages/Candidates/Candidates";

// Question
import QuestionAdd from "./pages/QuestionAdd/QuestionAdd";

// Question Settings
import QuestionSettings from "./pages/QuestionSettings/QuestionSettings";

// Reports
import Reports from "./pages/Reports/Reports";
import CandidateReport from "./pages/Reports/CandidateReport";
import Performance from "./pages/Reports/Performance";
import ProfessionalReport from "./pages/Reports/ProfessionalReport";

// Common
import NotFound from "./pages/Common/NotFound";
import InternalServerError from "./pages/Common/InternalServerError";

const basename = import.meta.env.BASE_URL;

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <UserLayout />,
      errorElement: <InternalServerError />,
      children: [
        {
          index: true,
          element: (
            <GuestRoute>
              <Login />
            </GuestRoute>
          ),
        },
        {
          path: "forgot-password",
          element: (
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          ),
        },
        // Profile route - shows comprehensive profile page with hierarchy and sub-users
        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },
        // Settings route - shows settings sidebar menu + update profile form
        {
          path: "settings",
          element: (
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          ),
        },
        // Legacy route - kept for backward compatibility
        {
          path: "update-profile",
          element: (
            <ProtectedRoute>
              <UpdateProfile />
            </ProtectedRoute>
          ),
        },
        {
          path: "change-password",
          element: (
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          ),
        },
        {
          path: "verify-email-change",
          element: (
            <ProtectedRoute>
              <VerifyEmailChange />
            </ProtectedRoute>
          ),
        },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "cognitive",
          element: (
            <ProtectedRoute>
              <Cognitive />
            </ProtectedRoute>
          ),
        },
        {
          path: "dynamic",
          element: (
            <ProtectedRoute>
              <Dynamic />
            </ProtectedRoute>
          ),
        },
        {
          path: "oto-video",
          element: (
            <ProtectedRoute>
              <OtoVideo />
            </ProtectedRoute>
          ),
        },
        {
          path: "assessment-detail/:assessmentId",
          element: (
            <ProtectedRoute>
              <AssessmentDetail />
            </ProtectedRoute>
          ),
        },
        {
          path: "assessment-dashboard/:assessmentId",
          element: (
            <ProtectedRoute>
              <AssessmentDashboard />
            </ProtectedRoute>
          ),
        },
        {
          path: "question-library",
          element: (
            <ProtectedRoute>
              <QuestionLibrary />
            </ProtectedRoute>
          ),
        },
        {
          path: "candidates",
          element: (
            <ProtectedRoute>
              <Candidates />
            </ProtectedRoute>
          ),
        },
        {
          path: "question-add",
          element: (
            <ProtectedRoute>
              <QuestionAdd />
            </ProtectedRoute>
          ),
        },
        {
          path: "question-setting",
          element: (
            <ProtectedRoute>
              <QuestionSettings />
            </ProtectedRoute>
          ),
        },
        {
          path: "reports",
          element: (
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          ),
        },
        {
          path: "reports/candidate/:candidateId",
          element: (
            <ProtectedRoute>
              <CandidateReport />
            </ProtectedRoute>
          ),
        },
        {
          path: "reports/performance/:candidateId",
          element: (
            <ProtectedRoute>
              <Performance />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: "/admin",
      children: [
        {
          path: "login",
          element: (
            <AdminGuestRoute>
              <AdminLogin />
            </AdminGuestRoute>
          ),
        },
        {
          path: "dashboard",
          element: (
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "users",
          element: (
            <AdminProtectedRoute>
              <AdminUsers />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "organizations",
          element: (
            <AdminProtectedRoute>
              <AdminOrganizations />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "companies",
          element: (
            <AdminProtectedRoute>
              <AdminCompanies />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "companies/:organizationId",
          element: (
            <AdminProtectedRoute>
              <AdminCompanies />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "company-users",
          element: (
            <AdminProtectedRoute>
              <AdminCompanyUsers />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "company-users/:organizationId",
          element: (
            <AdminProtectedRoute>
              <AdminCompanyUsers />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "company-users/:organizationId/:companyId",
          element: (
            <AdminProtectedRoute>
              <AdminCompanyUsers />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "settings",
          element: (
            <AdminProtectedRoute>
              <AdminSettings />
            </AdminProtectedRoute>
          ),
        },
        {
          path: "test",
          element: <AdminTest />,
        },
      ],
    },
    {
      path: "/professional-report/candidate/:candidateId",
      element: (
        <ProtectedRoute>
          <ProfessionalReport />
        </ProtectedRoute>
      ),
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  { basename }
);

function App() {
  return (
    <AppContextsProvider>
      <ToastProvider>
        <ThemeAwareConfig>
          <main>
            <RouterProvider router={router}></RouterProvider>
          </main>
        </ThemeAwareConfig>
      </ToastProvider>
    </AppContextsProvider>
  );
}

export default App;
