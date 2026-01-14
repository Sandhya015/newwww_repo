import { Outlet, ScrollRestoration } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useSecureMode } from "../../hooks/useSecureMode";

const UserLayout = () => {
  // Ensure secure mode is active in layout
  useSecureMode();

  return (
    <div className="min-h-[var(--height-main)] overflow-y-auto">
      {/* Background Video */}
      {/* <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0 opacity-60">
                <source src={`${import.meta.env.BASE_URL}common/getty-images.mp4`} type="video/mp4" />
                Your browser does not support the video tag.
            </video> */}

      <Toaster position="top-right" reverseOrder={false} />

      <ScrollRestoration />
      <Outlet />
    </div>
  );
};

export default UserLayout;
