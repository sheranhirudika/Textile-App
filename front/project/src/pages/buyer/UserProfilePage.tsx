import React, { useState, useEffect } from 'react';
import { Calendar, Loader2, Mail, UserCircle, UserX, X, Save, Edit } from 'lucide-react';

// Define types
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

interface ApiResponse<T> {
    message: string;
    data?: T;
}

const UserProfilePage = () => {
    const [userData, setUserData] = useState<ApiResponse<User> | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [formData, setFormData] = useState({
        name: '',
        email: ''
    });
    const [updateLoading, setUpdateLoading] = useState<boolean>(false);
    const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    // Get user info from localStorage as fallback
    const getUserFromLocalStorage = () => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                return JSON.parse(userString);
            } catch (err) {
                console.error("Failed to parse user from localStorage", err);
                return null;
            }
        }
        return null;
    };

    // Fixed: Extract user ID from URL or use localStorage
    const getUserIdFromUrl = () => {
        const pathSegments = window.location.pathname.split('/');
        const urlId = pathSegments[pathSegments.length - 1];
        
        // If URL is just "/profile" or similar without ID, use logged in user's ID
        if (!urlId || urlId === "profile") {
            const localUser = getUserFromLocalStorage();
            return localUser?._id || "me"; // Fallback to "me" endpoint
        }
        
        return urlId;
    };

    const id = getUserIdFromUrl();

    // Fetch user function - with proper error handling and fallback
    const fetchUser = async (userId: string) => {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Authentication token not found');
        }

        try {
            // Try endpoint with userId
            const endpoint = userId === "me" 
                ? `http://localhost:5000/api/users/me` 
                : `http://localhost:5000/api/users/${userId}`;
                
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Not authorized, no token');
                }
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("API fetch error:", error);
            
            // Fallback to local storage data if API fails
            const localUser = getUserFromLocalStorage();
            if (localUser) {
                return {
                    message: "Using locally stored data (offline mode)",
                    data: localUser
                };
            }
            throw error;
        }
    };

    // Update user function - fixed endpoint URL
    const updateUser = async () => {
        setUpdateLoading(true);
        setUpdateError(null);
        setUpdateSuccess(false);

        try {
            const token = localStorage.getItem('token');

            if (!token) {
                throw new Error('Authentication token not found');
            }

            // Fixed: Updated API endpoint to match backend expectations
            const endpoint = id === "me" 
                ? `http://localhost:5000/api/users/me` 
                : `http://localhost:5000/api/users/me/${id}`;
                
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
            }

            const updatedUserData = await response.json();
            setUserData(updatedUserData);
            setUpdateSuccess(true);
            
            // Update local storage if this is the current user
            const localUser = getUserFromLocalStorage();
            if (localUser && localUser._id === updatedUserData.data._id) {
                localStorage.setItem('user', JSON.stringify(updatedUserData.data));
            }

            // Close modal after short delay
            setTimeout(() => {
                setIsEditModalOpen(false);
                setUpdateSuccess(false);
            }, 1500);

        } catch (err) {
            if (err instanceof Error) {
                setUpdateError(err.message || 'An error occurred while updating the profile');
            } else {
                setUpdateError('An error occurred while updating the profile');
            }
            console.error(err);
        } finally {
            setUpdateLoading(false);
        }
    };

    useEffect(() => {
        const loadUserData = async () => {
            setIsLoading(true);
            try {
                // First try to load from API
                const response = await fetchUser(id);
                setUserData(response);
                
                if (response.data) {
                    setFormData({
                        name: response.data.name,
                        email: response.data.email
                    });
                } else if (response.message) {
                    // If API returns a message but no data, try local storage
                    const localUser = getUserFromLocalStorage();
                    if (localUser) {
                        setUserData({
                            message: "Using local data",
                            data: localUser
                        });
                        setFormData({
                            name: localUser.name,
                            email: localUser.email
                        });
                    } else {
                        setError(response.message);
                    }
                }
            } catch (err) {
                // If API fails, try to use localStorage as fallback
                const localUser = getUserFromLocalStorage();
                if (localUser) {
                    setUserData({
                        message: "Using offline data",
                        data: localUser
                    });
                    setFormData({
                        name: localUser.name,
                        email: localUser.email
                    });
                } else if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError('An unexpected error occurred');
                }
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, [id]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return "Not available";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-purple-500', 'bg-blue-500', 'bg-green-500',
            'bg-pink-500', 'bg-indigo-500', 'bg-rose-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        updateUser();
    };

    // Go back function
    const goBack = () => {
        window.history.back();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 size={40} className="animate-spin text-purple-500" />
                    <p className="text-gray-600 animate-pulse">Loading user profile...</p>
                </div>
            </div>
        );
    }

    if (error || !userData?.data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-md p-8 text-center animate-fadeIn">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <UserX size={32} className="text-red-500" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">User Not Found</h2>
                        <p className="text-gray-600 max-w-md">
                            {error === 'Not authorized, no token'
                                ? 'You need to be logged in to view this profile'
                                : (error || 'User information not available')}
                        </p>
                        <div className="flex space-x-4">
                            <button
                                onClick={goBack}
                                className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800 transition-colors duration-200"
                            >
                                Go Back
                            </button>
                            {error === 'Not authorized, no token' && (
                                <button
                                    onClick={() => window.location.href = '/login'}
                                    className="mt-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-md text-white transition-colors duration-200"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const { name, email, role, _id, createdAt } = userData.data;
    const avatarColor = getAvatarColor(name);
    const initials = getInitials(name);

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fadeIn">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                        <div className="flex flex-col items-center sm:flex-row sm:items-center gap-6">
                            <div
                                className={`w-24 h-24 ${avatarColor} rounded-full flex items-center justify-center text-white font-medium text-3xl`}
                                aria-label={`Avatar for ${name}`}
                            >
                                {initials}
                            </div>

                            <div className="text-center sm:text-left">
                                <h1 className="text-2xl font-bold text-white mb-1">{name}</h1>
                                <span className="inline-block bg-purple-400 bg-opacity-30 text-white text-sm px-3 py-1 rounded-full">
                                    {role.charAt(0).toUpperCase() + role.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail className="text-purple-500 w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Email</p>
                                    <p className="text-gray-800">{email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <UserCircle className="text-purple-500 w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">User ID</p>
                                    <p className="text-gray-800 font-mono text-sm">{_id}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar className="text-purple-500 w-5 h-5 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500 font-medium">Member Since</p>
                                    <p className="text-gray-800">{formatDate(createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50 flex items-center gap-2"
                            >
                                <Edit size={16} />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Profile Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Edit Profile</h2>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form className="p-6" onSubmit={handleSubmit}>
                            {updateError && (
                                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    {updateError}
                                </div>
                            )}

                            {updateSuccess && (
                                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                                    Profile updated successfully!
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateLoading}
                                    className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-md transition-colors duration-200 flex items-center gap-2"
                                >
                                    {updateLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfilePage;