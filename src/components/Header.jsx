import { GraduationCap, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 backdrop-blur-sm bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-900 rounded-lg flex items-center justify-center group-hover:bg-blue-800 transition-colors">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-blue-900 tracking-tight">
              ITEP Mock Portal
            </span>
          </Link>

          {/* Right: User */}
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500 hidden sm:block">
                  Welcome, <span className="font-semibold text-slate-800">{user.firstName}</span>
                </span>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                </div>
              </div>
              <div className="w-px h-6 bg-slate-200"></div>
              <button 
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
