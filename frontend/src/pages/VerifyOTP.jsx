import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);
    const navigate = useNavigate();
    const location = useLocation();

    // Get email from navigation state
    const email = location.state?.email || '';

    // Redirect to register if no email provided
    useEffect(() => {
        if (!email) {
            navigate('/register');
        }
    }, [email, navigate]);

    // Focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index, value) => {
        // Only allow single digit
        if (value.length > 1) return;

        // Only allow numbers
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                // If current is empty, focus previous
                inputRefs.current[index - 1]?.focus();
            }
        }
        // Handle paste
        else if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            navigator.clipboard.readText().then(text => {
                const digits = text.replace(/\D/g, '').slice(0, 6).split('');
                const newOtp = [...otp];
                digits.forEach((digit, i) => {
                    if (i < 6) newOtp[i] = digit;
                });
                setOtp(newOtp);
                // Focus last filled input or last input
                const lastIndex = Math.min(digits.length, 5);
                inputRefs.current[lastIndex]?.focus();
            });
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpCode = otp.join('');

        if (otpCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('http://localhost:8000/auth/verify-registration', {
                email: email,
                otp_code: otpCode
            });

            setSuccess('Email verified successfully! Redirecting to login...');

            // Redirect to login after successful verification
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid OTP code');
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResending(true);
        setError('');
        setSuccess('');

        try {
            await axios.post('http://localhost:8000/auth/resend-otp', { email });
            setSuccess('OTP resent successfully! Check your email.');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to resend OTP');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Verify Your Account</h1>
                    <p className="text-gray-400 text-sm">
                        Enter the 6-digit code sent to <span className="text-primary font-medium">{email}</span>
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {success}
                    </div>
                )}

                {/* OTP Form */}
                <form onSubmit={handleVerify} className="space-y-6">
                    {/* OTP Input Boxes */}
                    <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                            <React.Fragment key={index}>
                                <input
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    className="w-14 h-14 bg-[#1a1a1a] border border-gray-800 text-white text-center text-2xl font-semibold rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary transition duration-200"
                                />
                                {index === 2 && <span className="text-gray-600 text-2xl self-center">-</span>}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-black font-semibold py-3 rounded-lg transition duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        {loading ? 'Verifying...' : 'Verify Account'}
                    </button>
                </form>

                {/* Resend OTP Link */}
                <p className="mt-6 text-center text-gray-400 text-sm">
                    Didn't receive a code?{' '}
                    <button
                        onClick={handleResendOTP}
                        disabled={resending}
                        className="text-primary hover:text-primary/80 font-medium transition duration-200 disabled:opacity-50"
                    >
                        {resending ? 'Sending...' : 'Resend OTP'}
                    </button>
                </p>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <div className="flex justify-center gap-4 text-gray-500 text-xs">
                        <Link to="/terms" className="hover:text-gray-300 transition duration-200">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/privacy" className="hover:text-gray-300 transition duration-200">Privacy Policy</Link>
                    </div>
                    <p className="mt-3 text-gray-600 text-xs">
                        <Link to="/register" className="hover:text-gray-400 transition duration-200">← Back to registration</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VerifyOTP;
