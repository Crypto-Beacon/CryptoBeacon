import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, RefreshCw, ArrowRight } from 'lucide-react';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP + Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Handle OTP Input Change
    const handleOtpChange = (element, index) => {
        if (isNaN(element.value)) return;

        let newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Focus next input
        if (element.nextSibling && element.value) {
            element.nextSibling.focus();
        }
    };

    // Handle Paste
    const handlePaste = (e) => {
        e.preventDefault();
        const data = e.clipboardData.getData('text');

        // Only allow numbers
        if (!/^[0-9]+$/.test(data)) return;

        const pastedData = data.slice(0, 6).split('');
        const newOtp = [...otp];

        pastedData.forEach((value, i) => {
            newOtp[i] = value;
        });

        setOtp(newOtp);
    };


    // Handle Send Recovery Code
    const handleSendCode = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await axios.post('http://localhost:8000/auth/forgot-password', { email });
            setSuccess('Recovery code sent to your email.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to send recovery code.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const otpCode = otp.join('');
        if (otpCode.length !== 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setLoading(true);

        try {
            await axios.post('http://localhost:8000/auth/reset-password', {
                email,
                otp_code: otpCode,
                new_password: newPassword
            });
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 font-sans">
            {/* Brand Header */}
            <div className="mb-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="text-[#00FF9D]">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <path
                                d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                            />
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-white">CryptoBeacon</h1>
            </div>

            <div className="w-full max-w-md bg-[#1a1a1a] rounded-xl p-8 shadow-2xl border border-gray-800">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">Forgot Password</h1>
                    <p className="text-gray-400 text-sm">
                        {step === 1
                            ? "Enter your registered email address to receive a recovery code."
                            : "Enter the code sent to your email and your new password."}
                    </p>
                </div>

                {/* Feedback Messages */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={step === 1 ? handleSendCode : handleResetPassword} className="space-y-6">
                    {/* Email Input */}
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                className={`w-full bg-black border ${step === 1 ? 'border-gray-700' : 'border-gray-800 text-gray-500'} text-white placeholder-gray-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200`}
                                required
                                disabled={step === 2}
                            />
                        </div>
                    </div>

                    {/* Step 2 Inputs */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            {/* OTP Input */}
                            <div>
                                <label className="block text-gray-400 text-sm mb-2">Enter 6-Digit Code</label>
                                <div className="flex justify-between gap-2">
                                    {otp.map((data, index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength="1"
                                            value={data}
                                            onChange={(e) => handleOtpChange(e.target, index)}
                                            onPaste={handlePaste}
                                            onFocus={(e) => e.target.select()}
                                            className="w-12 h-12 bg-black border border-gray-700 text-white text-center text-xl rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                                        />

                                    ))}
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        className="w-full bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                                        required={step === 2}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <div className="relative">
                                    <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        className="w-full bg-black border border-gray-700 text-white placeholder-gray-600 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                                        required={step === 2}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#00FF9D] hover:bg-[#00cc7d] text-black font-bold py-3 rounded-lg transition duration-200 shadow-[0_0_20px_rgba(0,255,157,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Processing...' : (step === 1 ? 'Send Recovery Code' : 'Reset Password')}
                        {!loading && step === 1 && <ArrowRight size={18} />}
                    </button>
                </form>

                {/* Back to Login */}
                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Remember your password?{' '}
                        <Link to="/login" className="text-[#00FF9D] hover:text-[#00cc7d] font-medium transition duration-200">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
