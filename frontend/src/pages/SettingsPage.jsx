import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings, Moon, Sun, Trash2, Shield, Star, Bell, AlertTriangle, LogOut } from 'lucide-react';
import UserButton from '../components/UserButton';
import SearchBar from '../components/SearchBar';
import { useTheme } from '../context/ThemeContext';
import DeleteAccountModal from '../components/DeleteAccountModal';

import LogoutConfirmationModal from '../components/LogoutConfirmationModal';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SettingsPage = () => {
    const { theme, toggleTheme } = useTheme();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background text-text transition-colors duration-300">
            {/* Navigation Header */}
            <header className="border-b border-gray-800/20 backdrop-blur-sm sticky top-0 z-40 bg-background/80">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="text-primary transition-transform group-hover:scale-110">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                </svg>
                            </div>
                            <span className="text-lg font-semibold tracking-tight">CryptoBeacon</span>
                        </Link>
                        {/* Search Bar - Center */}
                        <div className="flex-1 max-w-lg mx-8 hidden md:block">
                            <SearchBar />
                        </div>
                        {/* Right Side Actions */}
                        <div className="flex items-center gap-3">
                            <Link to="/wishlist" className="p-2 bg-card rounded-lg hover:bg-gray-800/50 transition-colors text-text-muted hover:text-primary border border-transparent hover:border-primary/20" title="Watchlist">
                                <Star size={18} />
                            </Link>
                            <UserButton />
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <Settings size={32} className="text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">Settings</h1>
                            <p className="text-text-muted mt-1">Manage your account preferences and appearance</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Appearance Section */}
                        <div className="bg-card rounded-2xl border border-gray-800/20 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Sun size={20} className="text-primary" />
                                Appearance
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text">Theme Preference</h3>
                                    <p className="text-sm text-text-muted">Switch between dark and light mode interactions</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <span
                                        className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${theme === 'dark' ? 'translate-x-[26px]' : 'translate-x-1'}`}
                                    >
                                        {theme === 'dark' ? (
                                            <Moon size={14} className="text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        ) : (
                                            <Sun size={14} className="text-orange-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* General Account */}
                        <div className="bg-card rounded-2xl border border-gray-800/20 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                                <Shield size={20} className="text-primary" />
                                Account
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text">Sign Out</h3>
                                    <p className="text-sm text-text-muted">Securely log out of your account on this device</p>
                                </div>
                                <button
                                    onClick={() => setShowLogoutModal(true)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text rounded-lg transition-all font-medium text-sm flex items-center gap-2"
                                >
                                    <LogOut size={16} />
                                    Log Out
                                </button>
                            </div>
                        </div>

                        {/* Danger Zone */}
                        <div className="bg-danger/5 rounded-2xl border border-danger/20 p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-6 text-danger flex items-center gap-2">
                                <AlertTriangle size={20} />
                                Danger Zone
                            </h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-medium text-text">Delete Account</h3>
                                    <p className="text-sm text-text-muted">Permanently remove your account and all associated data</p>
                                </div>
                                <button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="px-4 py-2 bg-danger/10 hover:bg-danger text-danger hover:text-white rounded-lg transition-all font-medium text-sm flex items-center gap-2 border border-danger/20 hover:border-danger"
                                >
                                    <Trash2 size={16} />
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main>

            <DeleteAccountModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            />
            <LogoutConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
};

export default SettingsPage;
