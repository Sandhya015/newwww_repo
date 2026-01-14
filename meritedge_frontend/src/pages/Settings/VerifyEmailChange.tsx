import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Form } from 'antd';

// API
import { useHandleProfileUpdate, useHandleVerifyEmailChange } from '../../api/Profile/Profile';

// Components
import { CustomInput } from '../../components/ui/CustomInput';
import VerificationCodeInput from '../../components/Auth/verify-email/VerificationCodeInput';
import SettingSideMenu from '../../components/Settings/SettingSideMenu';

export default function VerifyEmailChange() {
    const [otp, setOtp] = useState("");

    const [form] = Form.useForm();
    const { verifyEmailChange, verifyEmailChangeError } = useHandleVerifyEmailChange();

    // API Profile 
    const { profile } = useHandleProfileUpdate();

    // Call API Verify Email Change
    const handleVerifyEmailChange = (formData: any) => {
        const data = {
            new_email: formData?.new_email,
            otp: otp
        }
        
        verifyEmailChange(data);
    };

    return (
        <section className="flex flex-row">
            <SettingSideMenu />

            <div className="w-auto relative flex-1 pr-4 py-6 md:pr-10 md:py-8">
                <div className="relative flex h-auto w-full w-auto flex-col rounded-xl bg-clip-border p-4 shadow-xl shadow-blue-gray-900/5 border" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                    <div className="p-4">
                        <h5 className="block font-sans text-xl antialiased font-semibold leading-snug tracking-normal" style={{ color: 'var(--text-primary)' }}>
                            Update Profile

                            <hr className="mt-5 sm:mt-5 w-full border border-solid max-md:mt-6 max-md:max-w-full" style={{ borderColor: 'var(--border-primary)' }} />
                        </h5>
                    </div>

                    <nav className="flex min-w-[240px] flex-col gap-1 p-2 font-sans text-base font-normal" style={{ color: 'var(--text-primary)' }}>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleVerifyEmailChange}
                            className="w-full"
                            initialValues={{
                                new_email: sessionStorage.getItem('new_email') || ''
                            }}
                        >
                            <div className="overflow-hidden w-full text-sm tracking-normal p-1 max-md:max-w-full" style={{ color: 'var(--text-primary)' }}>
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <div className="w-full max-md:max-w-full">
                                            <Form.Item
                                                label={<label htmlFor="new_email" className="block mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Email <span className="text-red-500">*</span></label>}
                                                name="new_email"
                                                rules={[
                                                    { required: true, message: "Email is required" },
                                                    { type: "email", message: "Enter valid email" }
                                                ]}
                                                required={false}
                                            >
                                                <CustomInput placeholder="Enter Email" readOnly />
                                            </Form.Item>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <div className="w-full max-md:max-w-full">
                                            <Form.Item
                                                label={<label htmlFor="otp" className="block mb-2 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>OTP <span className="text-red-500">*</span></label>}
                                                name="otp"
                                                required={false}
                                            >
                                                <VerificationCodeInput onChange={setOtp} />
                                            </Form.Item>

                                            {verifyEmailChangeError && (
                                                    <span className="flex text-start font-normal leading-none mt-[-20px] mb-3" style={{ color: '#ff4d4f' }}>
                                                        {verifyEmailChangeError}
                                                    </span>
                                                )}
                                        </div>

                                        <p className="text-xs text-end !mt-5" style={{ color: 'var(--text-primary)' }}>
                                            Didn’t get a code? Click to {" "}
                                            <Link
                                                className="cursor-pointer !underline"
                                                to=""
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const new_email = form.getFieldValue('new_email');
                                                    profile({ new_email });
                                                }}
                                            >
                                                resend
                                            </Link>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex z-0 flex-wrap gap-5 items-center w-full text-sm font-medium tracking-normal text-center whitespace-nowrap max-md:max-w-full">
                                <button type="submit" className="gap-3.5 self-stretch px-7 py-4 my-auto !text-white min-h-[39px] rounded-[56px] w-[130px] max-md:px-5 cursor-pointer" style={{ backgroundColor: 'var(--accent-primary)' }}>
                                    Update
                                </button>
                            </div>
                        </Form>
                    </nav>
                </div>
            </div>
        </section>
    )
}
