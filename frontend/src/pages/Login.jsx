import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Power } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8000/auth/token',
                new URLSearchParams({
                    'username': email,
                    'password': password,
                }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
            );

            const token = response.data.access_token;
            localStorage.setItem('token', token);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
            console.error(err);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* TrackChanges Icon */}
                <div className="flex justify-center mb-8">
                    <div className="text-primary">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* Outer circle with gap */}
                            <path
                                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* Inner circle with gap */}
                            <path
                                d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                fill="none"
                            />
                            {/* Center dot */}
                            <circle cx="12" cy="12" r="2" fill="currentColor" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Log In to CryptoBeacon</h1>
                    <p className="text-gray-400 text-sm">Welcome back! Please enter your details.</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email Field */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full bg-[#1a1a1a] border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                            required
                        />
                    </div>

                    {/* Password Field */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full bg-[#1a1a1a] border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition duration-200"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-right">
                        <Link to="/forgot-password" className="text-primary text-sm hover:text-primary/80 transition duration-200">
                            Forgot Password?
                        </Link>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg transition duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                    >
                        Log In
                    </button>
                </form>

                {/* Sign Up Link */}
                <p className="mt-6 text-center text-gray-400 text-sm">
                    Don't have an account? <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition duration-200">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
