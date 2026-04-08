import { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Lock, Download, Users, CheckCircle, Search, FileSpreadsheet, Eye, X } from 'lucide-react';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [results, setResults] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'users'
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // The passcode to access the admin portal. You can change this below.
  const ADMIN_PASSCODE = 'admin123';

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Incorrect passcode!');
      setPasscode('');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Results
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

      // 2. Fetch Users
      try {
        const uQuery = query(collection(db, 'users'));
        const uSnapshot = await getDocs(uQuery);
        setUsersList(uSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (userErr) {
        console.error("Error fetching users:", userErr);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Ensure Firebase permissions allow reading.");
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

  const filteredUsers = usersList.filter(u => 
    (u.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.phoneNumber || '').includes(searchTerm)
  );

  // Grouping by User then by Mock Test
  const groupedResults = filteredResults.reduce((acc, curr) => {
    // We group by phone number since it's unique per user
    const key = curr.phoneNumber || 'unknown-' + curr.firstName;
    if (!acc[key]) {
      acc[key] = {
        firstName: curr.firstName,
        phoneNumber: curr.phoneNumber,
        tests: {}
      };
    }
    
    // Group by test
    const testKey = curr.testId || 'unknown-test';
    if (!acc[key].tests[testKey]) {
      acc[key].tests[testKey] = {
        testTitle: curr.testTitle || curr.testId,
        testId: curr.testId,
        attempts: []
      };
    }
    
    acc[key].tests[testKey].attempts.push(curr);
    return acc;
  }, {});

  // Sort attempts per test chronologically (oldest = Attempt 1)
  Object.values(groupedResults).forEach(user => {
    Object.values(user.tests).forEach(test => {
      // The original data from Firebase is sorted desc (newest first). 
      // Reverse to get ascending order for Attempt 1, Attempt 2, etc.
      test.attempts.reverse();
    });
  });

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
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('results')}
                  className={`px-4 flex items-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'results' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <CheckCircle className="w-4 h-4" />
                  Submissions ({results.length})
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 flex items-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Users className="w-4 h-4" />
                  Registered Users ({usersList.length})
                </button>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 focus:border-blue-900 outline-none text-sm"
                />
              </div>
            </div>

            {/* Content Rendering */}
            <div className="p-4 sm:p-6 space-y-6 bg-slate-50">
              
              {/* === USERS TAB === */}
              {activeTab === 'users' && (
                filteredUsers.length === 0 ? (
                   <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
                     {searchTerm ? 'No registered users matched your search.' : 'No registered users found.'}
                   </div>
                ) : (
                   <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm bg-white">
                     <table className="w-full text-left border-collapse min-w-[600px]">
                       <thead>
                         <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                           <th className="p-4 pl-6">Student Name</th>
                           <th className="p-4">Phone Number</th>
                           <th className="p-4 text-center">Total Tests Submissions</th>
                           <th className="p-4 text-right pr-6">Last Login</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100 text-sm">
                         {filteredUsers.map(u => {
                            const testsTaken = results.filter(r => r.phoneNumber === u.phoneNumber).length;
                            return (
                             <tr key={u.phoneNumber || u.id} className="hover:bg-slate-50 transition-colors">
                               <td className="p-4 pl-6 font-bold text-slate-800 capitalize">{u.firstName} {u.lastName}</td>
                               <td className="p-4 text-slate-600 font-mono">{u.phoneNumber}</td>
                               <td className="p-4 text-center">
                                 <span className="bg-blue-50 text-blue-800 font-bold px-3 py-1 rounded-full text-xs">
                                    {testsTaken}
                                 </span>
                               </td>
                               <td className="p-4 text-slate-500 text-right pr-6 whitespace-nowrap">
                                 {u.lastLogin ? (u.lastLogin.toDate ? u.lastLogin.toDate().toLocaleDateString('en-IN') : 'Recent') : 'N/A'}
                               </td>
                             </tr>
                            );
                         })}
                       </tbody>
                     </table>
                   </div>
                )
              )}

              {/* === RESULTS TAB === */}
              {activeTab === 'results' && (
                Object.keys(groupedResults).length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 shadow-sm">
                    {searchTerm ? 'No results matched your search.' : 'No test results found in the database yet.'}
                  </div>
                ) : (
                  Object.values(groupedResults).map((user) => (
                    <div key={user.phoneNumber || Math.random()} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      {/* User Header */}
                    <div className="bg-blue-50/50 px-6 py-4 border-b border-slate-200 flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-inner">
                        {(user.firstName || 'U')[0]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 capitalize">{user.firstName || 'Unknown User'}</h3>
                        <p className="text-sm text-slate-500 font-medium">{user.phoneNumber || 'N/A'}</p>
                      </div>
                    </div>
                    
                    {/* User Tests */}
                    <div className="p-4 sm:p-6 space-y-8">
                      {Object.values(user.tests).map((test) => (
                        <div key={test.testId} className="space-y-3">
                          <h4 className="font-semibold text-blue-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            {test.testTitle}
                          </h4>
                          
                          <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                  <th className="p-3 pl-4">Attempt #</th>
                                  <th className="p-3">Date Submitted</th>
                                  <th className="p-3 text-center">Score</th>
                                  <th className="p-3 text-center">Right</th>
                                  <th className="p-3 text-center">Wrong</th>
                                  <th className="p-3 text-center">Skipped</th>
                                  <th className="p-3 text-right pr-4">Time Taken</th>
                                  <th className="p-3 text-center w-12">Details</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-sm">
                                {test.attempts.map((attempt, index) => (
                                  <tr key={attempt.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-3 pl-4 font-semibold text-slate-700 whitespace-nowrap">
                                      Attempt {index + 1}
                                    </td>
                                    <td className="p-3 text-slate-500 whitespace-nowrap">
                                      {attempt.date}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-col items-center">
                                        <span className={`font-bold ${attempt.percentage >= 60 ? 'text-emerald-600' : 'text-amber-500'}`}>
                                          {attempt.percentage}%
                                        </span>
                                        <span className="text-xs text-slate-400 font-medium">
                                          {attempt.score} / {attempt.maxMarks}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-block min-w-[2.5rem] bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md font-mono text-xs font-bold ring-1 ring-emerald-200">
                                        {attempt.correct || 0}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-block min-w-[2.5rem] bg-red-100 text-red-800 px-2 py-1 rounded-md font-mono text-xs font-bold ring-1 ring-red-200">
                                        {attempt.wrong || 0}
                                      </span>
                                    </td>
                                    <td className="p-3 text-center">
                                      <span className="inline-block min-w-[2.5rem] bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-mono text-xs font-bold ring-1 ring-slate-300">
                                        {attempt.unanswered || 0}
                                      </span>
                                    </td>
                                    <td className="p-3 pr-4 text-right font-mono text-slate-600 whitespace-nowrap">
                                      {formatTime(attempt.timeTaken || 0)}
                                    </td>
                                    <td className="p-3 text-center">
                                      <button 
                                        onClick={() => setSelectedAttempt(attempt)}
                                        className="inline-flex p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                        title="View detailed response time analysis"
                                      >
                                        <Eye className="w-5 h-5" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Attempt Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col slide-in-bottom filter drop-shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
               <div>
                 <h3 className="text-xl font-bold text-slate-800">Attempt Details</h3>
                 <div className="flex items-center gap-2 mt-1">
                   <span className="text-sm font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded capitalize">{selectedAttempt.firstName}</span>
                   <span className="text-sm text-slate-500">•</span>
                   <span className="text-sm font-semibold text-slate-700">{selectedAttempt.testTitle}</span>
                   <span className="text-sm text-slate-500">•</span>
                   <span className="text-sm text-slate-500">{selectedAttempt.date}</span>
                 </div>
               </div>
               <button 
                 onClick={() => setSelectedAttempt(null)}
                 className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
               >
                 <X className="w-5 h-5 text-slate-500" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      <th className="p-4 pl-6 w-16">Q.No</th>
                      <th className="p-4 min-w-[200px]">Question Snippet</th>
                      <th className="p-4 text-center">Correct Answer</th>
                      <th className="p-4 text-center">User Answer</th>
                      <th className="p-4 text-right pr-6">Time Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {selectedAttempt.questions && selectedAttempt.questions.length > 0 ? (
                      selectedAttempt.questions.map((q, idx) => {
                        const userAnswer = selectedAttempt.answers && selectedAttempt.answers[q._id];
                        const isCorrect = userAnswer === q.correct_answer;
                        const isUnanswered = userAnswer === undefined;
                        const timeSpent = selectedAttempt.questionTimes && selectedAttempt.questionTimes[q._id] 
                          ? selectedAttempt.questionTimes[q._id] : 0;
                          
                        let snippet = (q.text || '').replace(/\*\*/g, '').replace(/\$\$/g, '').substring(0, 60);
                        if (snippet.length === 60) snippet += '...';
                        if (!snippet && q.image) snippet = "[Image or Math Equation]";

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 pl-6 font-medium text-slate-500">{idx + 1}</td>
                            <td className="p-4 text-slate-700">{snippet}</td>
                            <td className="p-4 text-center">
                              <span className="inline-block px-2 py-1 bg-emerald-50 text-emerald-700 rounded ring-1 ring-emerald-200 font-mono text-xs">
                                Option {q.correct_answer}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {isUnanswered ? (
                                <span className="text-slate-400 text-xs font-medium">Skipped</span>
                              ) : (
                                <span className={`inline-block px-2 py-1 rounded ring-1 font-mono text-xs ${isCorrect ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-red-50 text-red-700 ring-red-200'}`}>
                                  Option {userAnswer}
                                </span>
                              )}
                            </td>
                            <td className="p-4 pr-6 text-right font-mono font-medium text-slate-600">
                              {formatTime(timeSpent)}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                         <td colSpan="5" className="p-8 text-center text-slate-500">
                           No detailed question tracking available for this attempt.
                         </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-white border-t border-slate-100 p-4 sm:p-6 flex justify-end">
               <button 
                 onClick={() => setSelectedAttempt(null)}
                 className="bg-blue-900 text-white font-semibold py-2 px-6 rounded-xl hover:bg-blue-800 transition-all shadow-md hover:shadow-lg"
               >
                 Close Details
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
