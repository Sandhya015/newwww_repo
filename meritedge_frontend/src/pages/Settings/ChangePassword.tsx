// @ts-nocheck

import { useState } from "react";
import { Form } from "antd";
import { Eye, EyeOff, Loader2, Check, X } from "lucide-react";

// Components
import SettingSideMenu from "../../components/Settings/SettingSideMenu";

// API
import { useHandleChangePassword } from "../../api/Auth/Auth";

export default function ChangePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);

  // Change Password Form
  const [changePasswordForm] = Form.useForm();

  // Check if passwords match
  const handlePasswordChange = () => {
    const newPassword = changePasswordForm.getFieldValue("new_password");
    const confirmPassword = changePasswordForm.getFieldValue("confirm_password");
    
    if (newPassword && confirmPassword) {
      setPasswordsMatch(newPassword === confirmPassword);
    } else {
      setPasswordsMatch(null);
    }
  };

  // API Change Password
  const { changePassword, isChangePasswordLoading, changePasswordError } =
    useHandleChangePassword();

  const handleChangePassword = (formData: any) => {
    let data = {
      current_password: formData?.old_password,
      new_password: formData?.new_password,
      confirm_password: formData?.confirm_password,
    };

    changePassword(data, changePasswordForm);
    // Reset password match indicator after submission
    setPasswordsMatch(null);
  };

  return (
    <section className="flex flex-col md:flex-row h-auto">
      <SettingSideMenu />

      <div className="w-auto relative flex-1 pl-5 md:pl-0 pr-5 md:pr-4 md:py-6 md:pr-10 md:py-8 mb-5">
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
              Change Password
              <hr
                className="mt-5 sm:mt-5 w-full border border-solid max-md:mt-6 max-md:max-w-full"
                style={{ borderColor: "var(--border-primary)" }}
              />
            </h5>
          </div>

          <div className="flex min-w-auto flex-col gap-1 p-2 font-sans text-base font-normal">
            <Form
              form={changePasswordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              className="w-full"
            >
                <div
                  className="overflow-hidden w-full text-sm tracking-normal p-1 max-md:max-w-full"
                  style={{ color: "var(--text-primary)" }}
                >
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                    <div>
                      <div className="w-full max-md:max-w-full">
                        <Form.Item
                          label={
                            <label
                              htmlFor="old_password"
                              className="block text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Old Password{" "}
                              <span className="text-red-500">*</span>
                            </label>
                          }
                          name="old_password"
                          rules={[
                            {
                              required: true,
                              message: "Old password is required",
                            },
                          ]}
                          required={false}
                        >
                          <div>
                            <input
                              type={
                                showOldPassword === false ? "password" : "text"
                              }
                              placeholder="Enter old password"
                              className="flex w-full h-13 px-5 py-3.5 items-center gap-2 self-stretch rounded-full border focus:outline-none"
                              style={{
                                borderColor: "var(--border-primary)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                              }}
                              onChange={(e) => {
                                changePasswordForm.setFieldsValue({
                                  old_password: e.target.value,
                                });
                              }}
                              autoComplete="new-password"
                              onInput={(e) => {
                                const input = e.target as HTMLInputElement;
                                input.value = input.value.replace(/\s/g, "");
                              }}
                            />

                            <div
                              className="absolute right-5 top-1/2 transform -translate-y-1/2 cursor-pointer"
                              onClick={() =>
                                setShowOldPassword((prev) => !prev)
                              }
                            >
                              {showOldPassword === false ? <EyeOff /> : <Eye />}
                            </div>
                          </div>
                        </Form.Item>
                      </div>
                    </div>

                    <div>
                      <div className="w-full max-md:max-w-full">
                        <Form.Item
                          label={
                            <label
                              htmlFor="new_password"
                              className="block text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              New Password{" "}
                              <span className="text-red-500">*</span>
                            </label>
                          }
                          name="new_password"
                          rules={[
                            {
                              required: true,
                              message: "New password is required",
                            },
                            {
                              min: 6,
                              message: "Password must be at least 6 characters",
                            },
                            {
                              validator: (_, value) =>
                                value && !/[A-Z]/.test(value)
                                  ? Promise.reject(
                                      new Error(
                                        "Password must contain at least one uppercase letter (A-Z)"
                                      )
                                    )
                                  : Promise.resolve(),
                            },
                            {
                              validator: (_, value) =>
                                value && !/[a-z]/.test(value)
                                  ? Promise.reject(
                                      new Error(
                                        "Password must contain at least one lowercase letter (a-z)"
                                      )
                                    )
                                  : Promise.resolve(),
                            },
                            {
                              validator: (_, value) =>
                                value && !/[0-9]/.test(value)
                                  ? Promise.reject(
                                      new Error(
                                        "Password must contain at least one number (0-9)"
                                      )
                                    )
                                  : Promise.resolve(),
                            },
                            {
                              validator: (_, value) =>
                                value &&
                                !/[!@#$%^&*()\-_=+\[\]{}|;:',.<>?/]/.test(value)
                                  ? Promise.reject(
                                      new Error(
                                        "Password must contain at least one special character"
                                      )
                                    )
                                  : Promise.resolve(),
                            },
                          ]}
                          required={false}
                        >
                          <div>
                            <input
                              type={
                                showNewPassword === false ? "password" : "text"
                              }
                              placeholder="Enter new password"
                              className="flex w-full h-13 px-5 py-2.5 items-center gap-2 self-stretch rounded-full border focus:outline-none"
                              style={{
                                borderColor: "var(--border-primary)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                              }}
                              onChange={(e) => {
                                changePasswordForm.setFieldsValue({
                                  new_password: e.target.value,
                                });
                                changePasswordForm.validateFields([
                                  "confirm_password",
                                ]);
                                handlePasswordChange();
                              }}
                              autoComplete="new-password"
                              onInput={(e) => {
                                const input = e.target as HTMLInputElement;
                                input.value = input.value.replace(/\s/g, "");
                              }}
                            />

                            <div
                              className="absolute right-5 top-1/2 transform -translate-y-1/2 cursor-pointer"
                              onClick={() =>
                                setShowNewPassword((prev) => !prev)
                              }
                            >
                              {showNewPassword === false ? <EyeOff /> : <Eye />}
                            </div>
                          </div>
                        </Form.Item>
                      </div>
                    </div>

                    <div>
                      <div className="w-full max-md:max-w-full">
                        <Form.Item
                          label={
                            <label
                              htmlFor="confirm_password"
                              className="block text-sm font-semibold mt-1"
                              style={{ color: "var(--text-primary)" }}
                            >
                              Confirm Password{" "}
                              <span className="text-red-500">*</span>
                            </label>
                          }
                          name="confirm_password"
                          autoComplete="new-password"
                          rules={[
                            {
                              required: true,
                              message: "Confirm password is required",
                            },
                            ({ getFieldValue }) => ({
                              validator(_, value) {
                                if (
                                  !value ||
                                  getFieldValue("new_password") === value
                                ) {
                                  return Promise.resolve();
                                }

                                return Promise.reject(
                                  new Error("Confirm password does not match")
                                );
                              },
                            }),
                          ]}
                          onChange={(e) => {
                            changePasswordForm.setFieldsValue({
                              confirm_password: e.target.value,
                            });
                            handlePasswordChange();
                          }}
                          required={false}
                          className="relative"
                        >
                          <div className="relative">
                            <input
                              type={
                                showConfirmPassword === false
                                  ? "password"
                                  : "text"
                              }
                              placeholder="Enter confirm password"
                              className="flex w-full h-13 px-5 py-2.5 items-center gap-2 self-stretch rounded-full border focus:outline-none"
                              style={{
                                borderColor: passwordsMatch === true 
                                  ? "#10b981" 
                                  : passwordsMatch === false 
                                  ? "#ef4444" 
                                  : "var(--border-primary)",
                                backgroundColor: "var(--bg-secondary)",
                                color: "var(--text-primary)",
                              }}
                              autoComplete="new-password"
                              onInput={(e) => {
                                const input = e.target as HTMLInputElement;
                                input.value = input.value.replace(/\s/g, "");
                              }}
                            />

                            {/* Password Match Indicator */}
                            {passwordsMatch !== null && (
                              <div
                                className="absolute right-14 top-1/2 transform -translate-y-1/2 flex items-center gap-1"
                              >
                                {passwordsMatch ? (
                                  <>
                                    <Check className="w-5 h-5 text-green-500" />
                                    <span className="text-xs text-green-500 font-medium">Match</span>
                                  </>
                                ) : (
                                  <>
                                    <X className="w-5 h-5 text-red-500" />
                                    <span className="text-xs text-red-500 font-medium">Not Match</span>
                                  </>
                                )}
                              </div>
                            )}

                            <div
                              className="absolute right-5 top-1/2 transform -translate-y-1/2 cursor-pointer"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                            >
                              {showConfirmPassword === false ? (
                                <EyeOff />
                              ) : (
                                <Eye />
                              )}
                            </div>
                          </div>
                        </Form.Item>
                      </div>
                      <div className="flex flex-row justify-between gap-3 my-5 mt-[-10px]">
                        <span
                          className="flex text-start font-normal leading-none"
                          style={{ color: "#ff4d4f" }}
                        >
                          {changePasswordError && <>{changePasswordError}</>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex z-0 flex-wrap gap-5 items-center w-full text-sm font-medium tracking-normal text-center whitespace-nowrap max-md:max-w-full">
                  <button
                    className="h-13 !text-white rounded-[56px] transition cursor-pointer flex items-center justify-center gap-2 !font-semibold min-h-[39px] rounded-[56px] w-[150px] max-md:px-5 cursor-pointer"
                    style={{ backgroundColor: "var(--accent-primary)" }}
                    type="submit"
                    disabled={isChangePasswordLoading}
                  >
                    {isChangePasswordLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>Update</>
                    )}
                  </button>
                </div>
              </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
