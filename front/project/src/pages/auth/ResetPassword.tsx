import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { resetPassword, verifyResetToken } from '../../services/authService';
import toast from 'react-hot-toast';

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [checkingToken, setCheckingToken] = useState(true);
  
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Verify token validity when component mounts
    const checkToken = async () => {
      if (!token) {
        setError('No reset token provided in URL');
        setTokenChecked(true);
        setCheckingToken(false);
        return;
      }
      
      try {
        setCheckingToken(true);
        console.log('Verifying token:', token);
        await verifyResetToken(token);
        setTokenValid(true);
        console.log('Token verified successfully');
      } catch (err: any) {
        console.error('Token verification failed:', err);
        setError(err.response?.data?.message || 'This password reset link is invalid or has expired');
      } finally {
        setTokenChecked(true);
        setCheckingToken(false);
      }
    };
    
    checkToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsSubmitting(true);
      await resetPassword(token as string, password);
      setSuccess(true);
      toast.success('Password reset successful!');
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Password reset failed:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
      toast.error('Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while token is being verified
  if (checkingToken) {
    return (
      <div className="text-center py-8">
        <p>Verifying reset link...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter a new password for your account
        </p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {success ? (
        <div className="mt-8 space-y-6">
          <div className="p-4 bg-green-50 text-green-700 rounded-md">
            <p className="text-center">
              Password reset successful! You will be redirected to login.
            </p>
          </div>
          <div>
            <Link
              to="/login"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <ArrowLeft className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
              </span>
              Go to login
            </Link>
          </div>
        </div>
      ) : tokenValid ? (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="New password"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Confirm new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <KeyRound className="h-5 w-5 text-purple-500 group-hover:text-purple-400" />
              </span>
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
          
          <div className="text-center">
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
              Back to login
            </Link>
          </div>
        </form>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            <p className="text-center">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <div>
            <Link
              to="/forgot-password"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Request a new reset link
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResetPassword;