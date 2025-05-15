import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, LogOut } from 'lucide-react';

interface UserType {
  _id?: string;
  id?: string;
  name: string;
  role: string;
  email: string;
}

interface CartItemType {
  id: string;
  name: string;
  quantity: number;
}

const Navbar = () => {
  const tokenExists = localStorage.getItem('token') !== null;
  const [isAuthenticated, setIsAuthenticated] = useState(tokenExists);
  const [user, setUser] = useState<UserType | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const toggleProfileMenu = () => setProfileMenuOpen(!profileMenuOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/login';
  };

  const handleProfileClick = () => {
    if (localStorage.getItem('token')) {
      // Get the user ID from localStorage or use 'me' endpoint
      const userStorageData = localStorage.getItem('user');
      if (userStorageData) {
        try {
          const userData = JSON.parse(userStorageData);
          const userId = userData._id || userData.id;
          if (userId) {
            window.location.href = `/profile/${userId}`;
          } else {
            window.location.href = `/profile/me`;
          }
        } catch (e) {
          console.error('Error parsing user data:', e);
          window.location.href = `/profile/me`;
        }
      } else {
        window.location.href = `/profile/me`;
      }
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setIsAuthenticated(false);
            return;
          }
          
          // Try to get user from localStorage first
          const userStorageData = localStorage.getItem('user');
          if (userStorageData) {
            try {
              const userData = JSON.parse(userStorageData);
              setUser(userData);
            } catch (e) {
              console.error('Error parsing localStorage user data:', e);
            }
          }
          
          // Then fetch from API to ensure data is fresh
          const response = await fetch('http://localhost:5000/api/users/my', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            if (userData.data) {
              setUser(userData.data);
              localStorage.setItem('user', JSON.stringify(userData.data));
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    };

    const getCartItemsCount = () => {
      const cartData = localStorage.getItem('cart');
      if (cartData) {
        try {
          const cart = JSON.parse(cartData);
          const count = cart.reduce((total: number, item: CartItemType) => total + item.quantity, 0);
          setTotalItems(count);
        } catch (e) {
          console.error('Error parsing cart data:', e);
        }
      }
    };

    fetchUserData();
    getCartItemsCount();
  }, [isAuthenticated]);

  const isAdmin = user?.role === 'admin';

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center">
              <span className="text-xl font-bold text-purple-700">TextileShop</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex space-x-4">
              <a 
                href="/products" 
                className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
              >
                Products
              </a>

              {isAuthenticated && isAdmin && (
                <>
                  <a 
                    href="/admin/dashboard" 
                    className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                  <a 
                    href="/admin/orders" 
                    className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Orders
                  </a>
                  <a 
                    href="/admin/products" 
                    className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Manage Products
                  </a>
                </>
              )}

              {isAuthenticated && !isAdmin && (
                <a 
                  href="/buyer/orders" 
                  className="text-gray-700 hover:text-purple-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  My Orders
                </a>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4">
              {!isAdmin && (
                <a 
                  href="/cart" 
                  className="p-2 text-gray-700 hover:text-purple-600 relative transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </a>
              )}

              {isAuthenticated ? (
                <div className="relative ml-2">
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center text-sm rounded-full focus:outline-none"
                  >
                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                      {user?.name?.charAt(0) || <User className="h-4 w-4" />}
                    </div>
                    <span className="ml-2 text-gray-700 font-medium">{user?.name || 'User'}</span>
                  </button>

                  {profileMenuOpen && (
                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            handleProfileClick();
                            setProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Your Profile
                        </button>
                        <button
                          onClick={() => {
                            handleLogout();
                            setProfileMenuOpen(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href="/login"
                  className="ml-4 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Login
                </a>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {!isAdmin && (
              <a href="/cart" className="p-2 text-gray-700 relative mr-2">
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </a>
            )}
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-700 hover:text-purple-600 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="/products"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Products
            </a>

            {isAuthenticated && isAdmin && (
              <>
                <a
                  href="/admin/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </a>
                <a
                  href="/admin/orders"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Orders
                </a>
                <a
                  href="/admin/products"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Manage Products
                </a>
              </>
            )}

            {isAuthenticated && !isAdmin && (
              <a
                href="/buyer/orders"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Orders
              </a>
            )}
          </div>

          <div className="pt-4 pb-3 border-t border-gray-200">
            {isAuthenticated ? (
              <>
                <div className="flex items-center px-5">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700">
                    {user?.name?.charAt(0) || <User className="h-5 w-5" />}
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">{user?.name || 'User'}</div>
                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <button
                    onClick={() => {
                      handleProfileClick();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50"
                  >
                    Your Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 flex items-center"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <div className="px-5 py-3">
                <a
                  href="/login"
                  className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-purple-600 hover:bg-purple-700"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;