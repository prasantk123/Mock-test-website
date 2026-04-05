import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, BookOpen, Clock, Users, ChevronRight, Sparkles, History, Trophy, RotateCcw, Eye, AlertTriangle, Loader2 } from 'lucide-react';
import Header from '../components/Header';

export default function Dashboard() {
  const [mockTests, setMockTests] = useState([]);
  const [testHistories, setTestHistories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        // Fetch the manifest
        const manifestRes = await fetch(`${import.meta.env.BASE_URL}data/tests.json`);
        if (!manifestRes.ok) throw new Error('Could not load test list');
        const manifest = await manifestRes.json();

        // Fetch metadata from each test file
        const tests = [];
        for (let i = 0; i < manifest.tests.length; i++) {
          const fileName = manifest.tests[i];
          try {
            const testRes = await fetch(`${import.meta.env.BASE_URL}data/${fileName}`);
            if (!testRes.ok) continue;
            const testData = await testRes.json();
            tests.push({
              id: i + 1,
              fileName,
              title: testData.mock_test.title,
              examName: testData.mock_test.exam_name || 'NCET',
              description: testData.mock_test.description || '',
              pattern: testData.mock_test.pattern || '',
              questions: testData.mock_test.total_questions || testData.questions.length,
              duration: testData.mock_test.duration,
              totalMarks: testData.mock_test.total_marks || testData.questions.length,
            });
          } catch (e) {
            console.warn(`Failed to load ${fileName}:`, e);
          }
        }

        setMockTests(tests);

        // Load histories
        const histories = {};
        tests.forEach((test) => {
          const history = JSON.parse(localStorage.getItem(`testHistory_${test.fileName}`) || '[]');
          if (history.length > 0) {
            histories[test.fileName] = history;
          }
        });
        setTestHistories(histories);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchTests();
  }, []);

  const formatTimeTaken = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 75%, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="animate-fade-in-up">
            <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20 shadow-2xl">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>

          <h1 className="animate-fade-in-up stagger-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            Chaiduar College
            <br />
            <span className="text-blue-200">ITEP Department</span>
          </h1>

          <div className="animate-fade-in-up stagger-2 flex items-center justify-center gap-2 text-blue-200/90 text-sm sm:text-base">
            <Sparkles className="w-4 h-4" />
            <span>NCET Crash Course 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>
            <span>Official Mock Test Portal</span>
            <Sparkles className="w-4 h-4" />
          </div>

          {!loading && !error && (
            <div className="animate-fade-in-up stagger-3 mt-10 flex items-center justify-center gap-6 sm:gap-10">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{mockTests.length}</p>
                <p className="text-xs sm:text-sm text-blue-200/70">Mock Tests</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{mockTests.reduce((sum, t) => sum + t.questions, 0)}</p>
                <p className="text-xs sm:text-sm text-blue-200/70">Questions</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-white">{Math.round(mockTests.reduce((sum, t) => sum + t.duration, 0) / 60)}</p>
                <p className="text-xs sm:text-sm text-blue-200/70">Hours</p>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 32.5C672 35 768 40 864 42.5C960 45 1056 45 1152 40C1248 35 1344 25 1392 20L1440 15V60H0Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* Test Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-900 animate-spin" />
            <span className="ml-3 text-slate-500 font-medium">Loading tests...</span>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Available Mock Tests</h2>
                <p className="text-sm text-slate-500 mt-1">Choose a test to begin your preparation</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
                {mockTests.length} Test{mockTests.length !== 1 ? 's' : ''} Available
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockTests.map((test, index) => {
                const history = testHistories[test.fileName];
                const lastAttempt = history ? history[history.length - 1] : null;
                const hasAttempted = !!lastAttempt;

                return (
                  <div
                    key={test.fileName}
                    className={`test-card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm animate-fade-in-up stagger-${Math.min(index + 1, 3)}`}
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-blue-900" />
                        </div>
                        {hasAttempted ? (
                          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <History className="w-3 h-3" />
                            {history.length} Attempt{history.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                            Available
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-slate-800 mb-1">{test.title}</h3>
                      <p className="text-sm text-slate-500 mb-4">
                        {test.examName} Pattern {test.pattern ? `• ${test.pattern}` : ''}
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">{test.questions} Questions</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium">{test.duration} Minutes</span>
                        </div>
                      </div>

                      {hasAttempted && (
                        <div className="bg-slate-50 rounded-xl p-3.5 mb-4 border border-slate-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Attempt</span>
                            <span className="text-[10px] text-slate-400">{formatDate(lastAttempt.timestamp)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Trophy className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-sm font-bold text-slate-700">{lastAttempt.percentage}%</span>
                            </div>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <span className="text-xs text-slate-500">
                              {lastAttempt.score}/{lastAttempt.maxMarks} marks
                            </span>
                            <div className="w-px h-4 bg-slate-200"></div>
                            <span className="text-xs text-slate-500">
                              {formatTimeTaken(lastAttempt.timeTaken)}
                            </span>
                          </div>
                          <div className="mt-2 w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                lastAttempt.percentage >= 70 ? 'bg-emerald-500' : lastAttempt.percentage >= 40 ? 'bg-amber-400' : 'bg-red-400'
                              }`}
                              style={{ width: `${Math.max(3, lastAttempt.percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {hasAttempted ? (
                        <div className="flex gap-2">
                          <Link
                            to={`/test/${encodeURIComponent(test.fileName)}`}
                            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 btn-press shadow-lg shadow-blue-900/20 text-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Re-attempt
                          </Link>
                          <Link
                            to={`/results/${encodeURIComponent(test.fileName)}`}
                            className="py-3 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all duration-200 flex items-center justify-center gap-1.5 btn-press text-sm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Results
                          </Link>
                        </div>
                      ) : (
                        <Link
                          to={`/test/${encodeURIComponent(test.fileName)}`}
                          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 btn-press shadow-lg shadow-blue-900/20"
                        >
                          Start Test
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-slate-400">
            © 2026 Chaiduar College ITEP Department. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
