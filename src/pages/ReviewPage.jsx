import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, XCircle, MinusCircle, BookOpen, ArrowUp } from 'lucide-react';
import LatexText from '../components/LatexText';

export default function ReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [assameseQuestions, setAssameseQuestions] = useState([]);
  const [globalMedium, setGlobalMedium] = useState('en');
  const [localMediums, setLocalMediums] = useState({});

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

  // Fetch translated questions if available
  useEffect(() => {
    const fetchAs = async () => {
      try {
        if (!id) return;
        const asId = id.replace('.json', '_as.json');
        if (asId !== id) {
          const res = await fetch(`${import.meta.env.BASE_URL}data/${asId}?t=${Date.now()}`);
          if (res.ok) {
            const dataAs = await res.json();
            setAssameseQuestions(dataAs.questions.map((q, i) => ({ ...q, _id: i })));
          }
        }
      } catch (e) {
        // ignore if not found
      }
    };
    fetchAs();
  }, [id]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const { questions, answers, score } = result;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">Answer Review</h1>
            <p className="text-xs sm:text-sm text-slate-400">Detailed analysis and explanations</p>
          </div>
          <div className="flex items-center gap-3">
            {assameseQuestions.length > 0 && (
              <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button 
                  onClick={() => { setGlobalMedium('en'); setLocalMediums({}); }}
                  className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${globalMedium === 'en' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  English
                </button>
                <button 
                  onClick={() => { setGlobalMedium('as'); setLocalMediums({}); }}
                  className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${globalMedium === 'as' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  অসমীয়া
                </button>
              </div>
            )}
            <Link
              to={`/results/${encodeURIComponent(id)}`}
              className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors border border-slate-200 px-3 py-2 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Summary
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-emerald-600">{score.correct}</span>
            <span className="text-slate-400">Correct</span>
          </div>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-red-500" />
            <span className="font-bold text-red-500">{score.wrong}</span>
            <span className="text-slate-400">Incorrect</span>
          </div>
          <div className="w-px h-4 bg-slate-200"></div>
          <div className="flex items-center gap-1.5">
            <MinusCircle className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-500">{score.unanswered}</span>
            <span className="text-slate-400">Skipped</span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {questions.map((q, index) => {
          const userAnswer = answers[q._id];
          const isCorrect = userAnswer === q.correct_answer;
          const isSkipped = userAnswer === undefined;
          
          const qMedium = localMediums[index] || globalMedium;
          const canTranslate = assameseQuestions[index] && q.subject?.toLowerCase() !== 'english';
          const activeQ = (canTranslate && qMedium === 'as') ? assameseQuestions[index] : q;

          const options = [
            { key: 'A', text: activeQ.option_a },
            { key: 'B', text: activeQ.option_b },
            { key: 'C', text: activeQ.option_c },
            { key: 'D', text: activeQ.option_d },
          ];

          return (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in-up"
            >
              {/* Question Header */}
              <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg uppercase tracking-wider">
                    Question {index + 1}
                  </span>
                  {canTranslate && (
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                      <button
                        onClick={() => setLocalMediums(prev => ({ ...prev, [index]: 'en' }))}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${qMedium === 'en' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        EN
                      </button>
                      <button
                        onClick={() => setLocalMediums(prev => ({ ...prev, [index]: 'as' }))}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-colors ${qMedium === 'as' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        অসমীয়া
                      </button>
                    </div>
                  )}
                </div>
                {isSkipped ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <MinusCircle className="w-3.5 h-3.5" />
                    Skipped
                  </span>
                ) : isCorrect ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Correct (+{q.marks})
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">
                    <XCircle className="w-3.5 h-3.5" />
                    Incorrect (0)
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="px-5 sm:px-6 pb-4">
                <div className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed">
                  <LatexText text={activeQ.question_text} />
                </div>
              </div>

              {/* Options */}
              <div className="px-5 sm:px-6 pb-4 space-y-2">
                {options.map((opt) => {
                  const isThisCorrect = opt.key === q.correct_answer;
                  const isThisUserAnswer = opt.key === userAnswer;
                  const isWrongAnswer = isThisUserAnswer && !isThisCorrect;

                  let optionClasses = 'border border-slate-200 bg-white text-slate-600';
                  let icon = null;

                  if (isThisCorrect) {
                    optionClasses = 'border-2 border-emerald-400 bg-emerald-50 text-emerald-800';
                    icon = <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
                  } else if (isWrongAnswer) {
                    optionClasses = 'border-2 border-red-400 bg-red-50 text-red-700';
                    icon = <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
                  }

                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm ${optionClasses} transition-all`}
                    >
                      <div className="flex-1 overflow-x-auto"><LatexText text={opt.text} /></div>
                      {icon}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {activeQ.explanation && activeQ.explanation.trim() !== '' && (
                <div className="mx-5 sm:mx-6 mb-5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5">
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1">Explanation</p>
                      <div className="text-sm text-blue-700 leading-relaxed"><LatexText text={activeQ.explanation} /></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/results/${encodeURIComponent(id)}`}
            className="flex-1 py-3.5 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-all flex items-center justify-center gap-2 btn-press"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Summary
          </Link>
          <Link
            to="/"
            className="flex-1 py-3.5 px-6 rounded-xl bg-blue-900 text-white font-semibold hover:bg-blue-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 btn-press"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-blue-800 transition-all animate-fade-in-up z-40"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
