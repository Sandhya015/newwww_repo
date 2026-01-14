/* eslint-disable @typescript-eslint/no-explicit-any */
import { Form } from "antd";
import { useLocation } from "react-router-dom";

// Components
import { CustomInput } from "../../components/ui/CustomInput";
import SettingSideMenu from "../../components/Settings/SettingSideMenu";

// API
import {
  useHandleProfileUpdate,
} from "../../api/Profile/Profile";

export default function UpdateProfile() {
  const [form] = Form.useForm();
  const location = useLocation();

  // Determine if we should show the sidebar based on current route
  // /profile -> Show only form (no sidebar)
  // /settings, /update-profile, /change-password, /verify-email-change -> Show sidebar + form
  const showSidebar =
    location.pathname === "/settings" ||
    location.pathname === "/update-profile" ||
    location.pathname === "/change-password" ||
    location.pathname === "/verify-email-change";

  // API Profile
  const { profile, profileUpdateError } = useHandleProfileUpdate();

  const handleSubmit = (formData: any) => {
    profile(formData, form);
  };

  return (
    <section className="flex flex-col lg:flex-row justify-center">
      {/* Conditionally render sidebar - only show on settings-related routes */}
      {showSidebar && <SettingSideMenu />}

      <div className="w-auto relative flex-1 md:pl-0 md:py-8">
        <div
          className="relative flex h-auto w-full w-auto flex-col rounded-xl bg-clip-border p-4 shadow-xl shadow-blue-gray-900/5 border"
          style={{
            backgroundColor: "var(--bg-tertiary)",
            borderColor: "var(--border-primary)",
            color: "var(--text-primary)",
          }}
        >
          <div className="p-4">
            <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal">
              Update Profile
              <hr
                className="mt-5 sm:mt-5 w-full border border-solid max-md:mt-6 max-md:max-w-full"
                style={{ borderColor: "var(--border-primary)" }}
              />
            </h5>
          </div>

          <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              className="w-full"
            >
                <div
                  className="overflow-hidden w-full text-sm tracking-normal p-1 max-md:max-w-full"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                    <div>
                      <div className="w-full max-md:max-w-full">
                        <Form.Item
                          label={
                            <label
                              htmlFor="new_email"
                              className="block mb-2 text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Email <span className="text-red-500">*</span>
                            </label>
                          }
                          name="new_email"
                          rules={[
                            { required: true, message: "Email is required" },
                            { type: "email", message: "Enter valid email" },
                          ]}
                          required={false}
                        >
                          <CustomInput placeholder="Enter Email" />
                        </Form.Item>

                        {profileUpdateError && (
                          <span
                            className="flex text-start font-normal leading-none mt-[-20px] mb-3"
                            style={{ color: "#ff4d4f" }}
                          >
                            {profileUpdateError}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex z-0 flex-wrap gap-5 items-center w-full text-sm font-medium tracking-normal text-center whitespace-nowrap max-md:max-w-full">
                  <button
                    type="submit"
                    className="gap-3.5 self-stretch px-7 py-4 my-auto !text-white min-h-[39px] rounded-[56px] w-[130px] max-md:px-5 cursor-pointer"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                  >
                    Update
                  </button>
                </div>
              </Form>
          </nav>
        </div>
      </div>
    </section>
  );
}
