import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Phone, User, Loader2, AlertCircle } from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';

export default function LoginPage() {
  const [firstName, setFirstName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }
    
    // Validate phone number loosely (at least 10 digits as entered, or let users type whatever since it's a mock)
    // To match common Indian numbering, let's enforce exactly 10 digits
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);

    try {
      const userData = {
        firstName: firstName.trim(),
        phoneNumber: phoneNumber.trim(),
      };

      // Try to save to Firestore. This will fail if Firebase config is broken (e.g., 'YOUR_API_KEY').
      // Using merge: true so we don't erase existing document fields like createdAt if making the same login again
      try {
        const userRef = doc(db, 'users', userData.phoneNumber);
        await setDoc(userRef, {
          ...userData,
          lastLogin: serverTimestamp(),
        }, { merge: true });
      } catch (fbErr) {
        console.warn('Firestore user save failed (possibly missing config):', fbErr);
        if (fbErr.code === 'invalid-argument' || (fbErr.message && fbErr.message.includes('apiKey'))) {
             throw new Error('Firebase is not configured correctly. Please update src/firebase.js with your project credentials.');
        } else {
             // Re-throw if it wasn't a blatant misconfiguration (e.g. permission denied)
             throw fbErr;
        }
      }

      // Save to context/local storage after successful DB update
      login(userData);
      navigate('/');
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center animate-fade-in-up">
          <div className="w-16 h-16 bg-blue-900 rounded-2xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight animate-fade-in-up stagger-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          ITEP Mock Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 animate-fade-in-up stagger-2">
          Enter your details to access the tests
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in-up stagger-3">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-slate-700">
                First Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-3 border bg-slate-50 hover:bg-white transition-colors"
                  placeholder="e.g. Rahul"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-slate-300 rounded-xl py-3 border bg-slate-50 hover:bg-white transition-colors"
                  placeholder="10-digit mobile number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-blue-900/20 text-sm font-medium text-white bg-blue-900 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-900 transition-all btn-press disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </span>
                ) : (
                  'Login & Continue'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
