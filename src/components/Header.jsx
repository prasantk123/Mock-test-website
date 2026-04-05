import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">Welcome, Student</span>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
              S
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
