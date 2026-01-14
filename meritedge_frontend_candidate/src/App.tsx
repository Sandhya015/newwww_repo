import { createBrowserRouter, RouterProvider } from "react-router";
import { ConfigProvider, theme } from "antd";
import { useSecureMode } from "./hooks/useSecureMode";

// Layout
import UserLayout from "./components/Layout/UserLayout";

// Common
import NotFound from "./pages/Common/NotFound";
import InternalServerError from "./pages/Common/InternalServerError";

// Assessment
import Assessment from "./pages/Assessment/Assessment";
import AssessmentForm from "./pages/Assessment/AssessmentForm";
import AssessmentGuideline from "./pages/Assessment/AssessmentGuideline";
import SectionSelection from "./pages/Assessment/SectionSelection";
import Section1Instruction from "./pages/Assessment/Section1Instruction";
import Section2Instruction from "./pages/Assessment/Section2Instruction";
import CameraCapture from "./pages/Assessment/CameraCapture";
import AssessmentDetails from "./pages/Assessment/AssessmentDetails";

// Test
import Test from "./pages/Test/Test";
import AssessmentSuccess from "./pages/Test/AssessmentSuccess";
import SectionTransition from "./pages/Test/SectionTransition";

const basename = import.meta.env.BASE_URL;

const router = createBrowserRouter(
  [
    {
      path: "/:candidate_id",
      element: <UserLayout />,
      errorElement: <InternalServerError />,
      children: [
        {
          index: true,
          element: <Assessment />,
        },
        {
          path: "camera-capture",
          element: <CameraCapture />,
        },
        {
          path: "assessment-details",
          element: <AssessmentDetails />,
        },
        {
          path: "assessment-form",
          element: <AssessmentForm />,
        },
        {
          path: "assessment-guideline",
          element: <AssessmentGuideline />,
        },
        {
          path: "section-selection",
          element: <SectionSelection />,
        },
        {
          path: "section-1-instructions",
          element: <Section1Instruction />,
        },
        {
          path: "section-2-instructions",
          element: <Section2Instruction />,
        },
        {
          path: "test",
          element: <Test />,
        },
        {
          path: "assessment-success",
          element: <AssessmentSuccess />,
        },
        {
          path: "section-transition",
          element: <SectionTransition />,
        },
      ],
    },
    {
      path: "/",
      element: <Assessment />,
    },
    {
      path: "*",
      element: <NotFound />,
    },
  ],
  { basename }
);

function App() {
  // Global secure mode - active throughout entire application
  const { secureMode, secureModeLoading, SECURE_MODE_ENABLED } =
    useSecureMode();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorBgContainer: "#23242a",
          colorText: "#fff",
        },
      }}
    >
      <main className="bg-black min-h-[var(--height-main)]">
     
        {/* {(secureMode || secureModeLoading) && SECURE_MODE_ENABLED && (
          <div className="fixed top-0 left-0 right-0 z-[9999] bg-green-900/90 border-b border-green-500/30 p-2">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  secureMode
                    ? "bg-green-500 animate-pulse"
                    : "bg-yellow-500 animate-ping"
                }`}
              ></div>
              <span className="text-green-400 text-sm font-medium">
                {secureMode
                  ? "Secure Browser Mode Active"
                  : "Activating Secure Mode..."}
              </span>
            </div>
          </div>
        )} */}

        {/* Development Mode Indicator - Hidden to allow full page usage */}
        {/* {!SECURE_MODE_ENABLED && (
          <div className="fixed top-0 left-0 right-0 z-[9999] bg-orange-900/90 border-b border-orange-500/30 p-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
              <span className="text-orange-400 text-sm font-medium">
                🛠️ Development Mode - Secure Mode Disabled
              </span>
            </div>
          </div>
        )} */}

        <div className="pt-0">
          <RouterProvider router={router}></RouterProvider>
        </div>
      </main>
    </ConfigProvider>
  );
}

export default App;
