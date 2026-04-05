import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Trophy, ArrowRight, Home, BarChart3, CheckCircle2, XCircle, MinusCircle, Clock } from 'lucide-react';

export default function ResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('lastTestResult');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.testId === id) {
        setResult(parsed);
      } else {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [id, navigate]);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { score, testData, timeTaken } = result;
  const percentage = score.maxMarks > 0 ? Math.round((score.finalScore / score.maxMarks) * 100) : 0;
  const clampedPercentage = Math.max(0, percentage);

  const formatTimeTaken = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const getGradeInfo = (pct) => {
    if (pct >= 80) return { label: 'Excellent!', color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (pct >= 60) return { label: 'Good Job!', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (pct >= 40) return { label: 'Keep Trying', color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { label: 'Needs Improvement', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const grade = getGradeInfo(clampedPercentage);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16 text-center animate-fade-in-up">
          <div className="w-20 h-20 mx-auto mb-5 flex items-center justify-center">
            <Trophy className="w-16 h-16 text-amber-400 drop-shadow-lg" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Examination Completed
          </h1>
          <p className="text-slate-300 text-sm sm:text-base">
            Here is your detailed performance analysis
          </p>
        </div>
      </div>

      {/* Score Card */}
      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up stagger-1">
          <div className="py-10 px-6 text-center border-b border-slate-100">
            <div className="relative inline-block mb-4">
              <span className="text-7xl sm:text-8xl font-black text-slate-800 tracking-tight">
                {clampedPercentage}%
              </span>
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${grade.bg} ${grade.color} ${grade.border} border`}>
              {grade.label}
            </div>
            <p className="text-slate-500 text-sm mt-3">
              Total Score: <span className="font-bold text-slate-800">{score.finalScore}</span> out of <span className="font-bold text-slate-800">{score.maxMarks}</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
            <div className="p-5 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Questions</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-800">{score.totalQuestions}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Correct</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{score.correct}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Incorrect</p>
              <p className="text-2xl sm:text-3xl font-black text-red-500">{score.wrong}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Skipped</p>
              <p className="text-2xl sm:text-3xl font-black text-slate-400">{score.unanswered}</p>
            </div>
          </div>

          {/* Marks & Time */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-600">Marks Scored: <span className="font-bold text-emerald-600">{score.totalMarks}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Time: <span className="font-bold text-slate-800">{formatTimeTaken(timeTaken)}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Subject-wise Breakdown */}
        {result.subjectWise && result.subjectWise.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 mt-6 overflow-hidden animate-fade-in-up stagger-2">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-900" />
                Subject-wise Performance
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {result.subjectWise.map((subject, i) => {
                const subPct = subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;
                return (
                  <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{subject.name}</p>
                      <p className="text-xs text-slate-400">{subject.correct}/{subject.total} correct</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            subPct >= 70 ? 'bg-emerald-500' : subPct >= 40 ? 'bg-amber-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${subPct}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-bold w-10 text-right ${
                        subPct >= 70 ? 'text-emerald-600' : subPct >= 40 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {subPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8 mb-12 animate-fade-in-up stagger-3">
          <Link
            to="/"
            className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-all duration-200 flex items-center justify-center gap-2 btn-press"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <Link
            to={`/review/${encodeURIComponent(id)}`}
            className="flex-1 py-3.5 px-6 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 btn-press"
          >
            Review Answers
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
