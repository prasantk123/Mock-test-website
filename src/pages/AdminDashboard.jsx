import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Download, Users, CheckCircle, Search, FileSpreadsheet } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // The passcode to access the admin portal. You can change this below.
  const ADMIN_PASSCODE = 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      fetchResults();
    } else {
      alert('Incorrect passcode!');
      setPasscode('');
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'results'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Format timestamp for display
        date: doc.data().timestamp ? doc.data().timestamp.toDate().toLocaleDateString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }) : 'Unknown Date'
      }));
      setResults(data);
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("Failed to load results. Ensure Firebase permissions allow reading.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const downloadCSV = () => {
    if (results.length === 0) return;

    // Define CSV Headers
    const headers = [
      'Date Submitted',
      'First Name',
      'Phone Number',
      'Test Title',
      'Percentage (%)',
      'Score',
      'Max Marks',
      'Correct Answers',
      'Wrong Answers',
      'Unanswered',
      'Time Taken (seconds)'
    ];

    // Map data rows
    const rows = results.map(r => [
      `"${r.date}"`,
      `"${r.firstName || 'Unknown'}"`,
      `"${r.phoneNumber || 'N/A'}"`,
      `"${r.testTitle || r.testId}"`,
      r.percentage || 0,
      r.score || 0,
      r.maxMarks || 0,
      r.correct || 0,
      r.wrong || 0,
      r.unanswered || 0,
      r.timeTaken || 0
    ]);

    // Combine headers and rows
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mock_test_results_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = results.filter(r => 
    (r.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.phoneNumber || '').includes(searchTerm) ||
    (r.testTitle || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-blue-900" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access</h2>
          <p className="text-slate-500 text-sm mb-6">Enter the passcode to view and download student results.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Passcode..."
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full text-center px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none transition-all font-mono"
            />
            <button
              type="submit"
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-900/20"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Header */}
      <div className="bg-blue-900 text-white shadow-lg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <Users className="w-8 h-8 opacity-80" />
              Results Dashboard
            </h1>
            <p className="text-blue-200 mt-1">View and export all student test submissions</p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-2.5 px-5 rounded-xl transition-all shadow-lg hover:shadow-xl"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Export to Excel (CSV)
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mb-4"></div>
            Loading results from database...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-600 font-semibold">
                <CheckCircle className="w-5 h-5 text-blue-900" />
                {filteredResults.length} Submissions Found
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, phone, or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none text-sm"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="p-4 pl-6 whitespace-nowrap">Date</th>
                    <th className="p-4 whitespace-nowrap">Student</th>
                    <th className="p-4 whitespace-nowrap">Test</th>
                    <th className="p-4 text-center whitespace-nowrap">Score</th>
                    <th className="p-4 text-center whitespace-nowrap">Right / Wrong</th>
                    <th className="p-4 text-right pr-6 whitespace-nowrap">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 uppercase text-sm">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-slate-500">
                        {searchTerm ? 'No results matched your search.' : 'No test results found in the database yet.'}
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((result) => (
                      <tr key={result.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 pl-6 font-medium text-slate-600 normal-case whitespace-nowrap">
                          {result.date}
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-800 normal-case">{result.firstName}</div>
                          <div className="text-xs text-slate-400 normal-case">{result.phoneNumber}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-700 normal-case max-w-[200px] truncate" title={result.testTitle || result.testId}>
                          {result.testTitle || result.testId}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col items-center">
                            <span className={`font-black text-lg ${result.percentage >= 60 ? 'text-emerald-600' : 'text-amber-500'}`}>
                              {result.percentage}%
                            </span>
                            <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                              {result.score} / {result.maxMarks}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-2 font-mono text-xs">
                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{result.correct || 0}</span>
                            <span className="text-slate-300">/</span>
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{result.wrong || 0}</span>
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right font-mono text-slate-600 whitespace-nowrap normal-case">
                          {formatTime(result.timeTaken || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
