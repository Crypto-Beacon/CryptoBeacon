import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('http://localhost:8000/auth/register', {
                username: formData.username,
                email: formData.email,
                password: formData.password
            });

            // Navigate to OTP verification page with email in state
            navigate('/verify-otp', { state: { email: formData.email } });
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Title */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Create Your<br />CryptoBeacon Account
                    </h1>
                    <p className="text-gray-400 text-sm">Welcome to the future of crypto tracking.</p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-6 text-center text-sm">
                        {error}
                    </div>
                )}

                {/* Registration Form */}
                <form onSubmit={handleRegister} className="space-y-5">
                    {/* Username Field */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Enter your username"
                            className="w-full bg-[#1a1a1a] border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                            required
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-white text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
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
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full bg-[#1a1a1a] border border-gray-800 text-white placeholder-gray-600 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition duration-200"
                                required
                                minLength={8}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition duration-200"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-gray-500 text-xs mt-2">
                            Minimum 8 characters.
                        </p>
                    </div>

                    {/* Create Account Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 rounded-lg transition duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                {/* Sign In Link */}
                <p className="mt-6 text-center text-gray-400 text-sm">
                    Already have an account? <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition duration-200">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
