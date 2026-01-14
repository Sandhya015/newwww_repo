import React, { useContext, useEffect, useRef } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Context
import { SidebarProvider } from "../../context/SidebarContext";
import { UserContext } from "../../context/User/UserContext";

// UI
import LeftSideBar from "../ui/LeftSideBar";
import Header from "../ui/Header";

import { Layout } from "antd";
const { Content } = Layout;

const UserLayout = () => {
  // Context
  const userContext = useContext(UserContext);
  const location = useLocation();
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <SidebarProvider>
      {userContext?.access_token ? (
        <Layout
          className="!min-h-screen !h-screen"
          style={{
            backgroundColor: "var(--bg-primary)",
            color: "var(--text-primary)",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* Video Background - only show in dark theme */}
          <video
            className="absolute top-0 left-0 w-screen h-screen object-cover z-0 brightness-19 [object-position:60%_190%]"
            autoPlay
            muted
            loop
            style={{ display: "var(--video-display)" }}
          >
            <source
              src={`${import.meta.env.BASE_URL}common/technology-computer.mp4`}
              type="video/mp4"
            />
            Your browser does not support the video tag.
          </video>

          <Header />

          <Layout className="!h-full">
            <LeftSideBar />

            <Layout
              className="!pt-3 sm:!pt-4 md:!pt-6 lg:!pt-8 !pr-2 sm:!pr-3 md:!pr-4 lg:!pr-8 !pl-1 sm:!pl-2 !h-full"
              style={{
                backgroundColor: "var(--bg-primary)",
                height: "100%",
                overflow: "hidden",
              }}
            >
              <Content
                style={{
                  margin: 0,
                  height: "100%",
                  backgroundColor: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  padding: "0 8px 12px 6px",
                  overflow: "auto",
                }}
                ref={contentRef}
                className="sm:!p-[0_12px_16px_10px] md:!p-[0_16px_20px_14px] lg:!p-[0_24px_24px_20px]"
              >
                <Toaster 
                  position="top-right" 
                  reverseOrder={false}
                  toastOptions={{
                    duration: 3000,
                    style: {
                      maxWidth: '500px',
                    },
                  }}
                />

                <ScrollRestoration />
                <Outlet />
              </Content>

              {/* <Content
                                className="bg-white rounded-xl"
                                style={{
                                    padding: 24,
                                    margin: 0,
                                    minHeight: 280,
                                }}
                            >
                                Content
                            </Content> */}
            </Layout>
          </Layout>
        </Layout>
      ) : (
        <>
          <Toaster 
            position="top-right" 
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: {
                maxWidth: '500px',
              },
            }}
          />

          <ScrollRestoration />
          <Outlet />
        </>
      )}
    </SidebarProvider>
  );
};

export default UserLayout;
