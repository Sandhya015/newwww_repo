import { Key } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function SettingSideMenu() {
  const location = useLocation();

  return (
    <div className="max-w-sm relative flex-1 py-6 md:py-0 lg:py-8">
      <div
        className="relative flex h-auto w-full max-w-[20rem] flex-col rounded-xl bg-clip-border p-4 shadow-xl shadow-blue-gray-900/5 border"
        style={{
          backgroundColor: "var(--bg-tertiary)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      >
        <div className="p-4 mb-2">
          <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal">
            Setting
            <hr
              className="mt-5 sm:mt-5 w-full border border-solid max-md:mt-6 max-md:max-w-full"
              style={{ borderColor: "var(--border-primary)" }}
            />
          </h5>
        </div>

        <nav
          className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal"
          style={{ color: "var(--text-primary)", fontSize: "16px" }}
        >
          {/* Update Profile menu item - links to /settings route */}
          <Link
            to="/settings"
            role="button"
            className={`flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer ${
              (location.pathname === "/settings" ||
                location.pathname === "/update-profile" ||
                location.pathname === "/verify-email-change") &&
              "bg-[radial-gradient(ellipse_at_bottom,_#a78bfa_0%,_#7c3aed_60%)] p-2 rounded-lg"
            } hover:bg-[radial-gradient(ellipse_at_bottom,_#a78bfa_0%,_#7c3aed_60%)] p-2 rounded-lg`}
            style={{
              color:
                location.pathname === "/settings" ||
                location.pathname === "/update-profile" ||
                location.pathname === "/verify-email-change"
                  ? "#ffffff"
                  : "var(--text-primary)",
            }}
          >
            <div className="grid mr-4 place-items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </div>
            Update Profile
          </Link>

          <Link
            to="/change-password"
            role="button"
            className={`flex items-center w-full p-3 leading-tight transition-all rounded-lg outline-none text-start cursor-pointer ${
              location.pathname === "/change-password" &&
              "bg-[radial-gradient(ellipse_at_bottom,_#a78bfa_0%,_#7c3aed_60%)] p-2 rounded-lg"
            } hover:bg-[radial-gradient(ellipse_at_bottom,_#a78bfa_0%,_#7c3aed_60%)] p-2 rounded-lg`}
            style={{
              color:
                location.pathname === "/change-password"
                  ? "#ffffff"
                  : "var(--text-primary)",
            }}
          >
            <div className="grid mr-4 place-items-center">
              <Key size={20} />
            </div>
            Change Password
          </Link>
        </nav>
      </div>
    </div>
  );
}
