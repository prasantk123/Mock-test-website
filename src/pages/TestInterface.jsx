import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Bookmark, Eraser, ArrowRight, Menu, X, ChevronLeft, AlertTriangle } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';

export default function TestInterface() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch test data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/data/mock_test_${id}.json`);
        if (!response.ok) throw new Error('Test not found');
        const data = await response.json();
        setTestData(data.mock_test);
        setQuestions(data.questions);
        setTimeLeft(data.mock_test.duration * 60);

        // Initialize question status
        const initialStatus = {};
        data.questions.forEach((_, i) => {
          initialStatus[i] = 'not-visited';
        });
        initialStatus[0] = 'not-answered'; // First question is visited
        setQuestionStatus(initialStatus);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, submitted]);

  const saveAndNavigate = useCallback((isAutoSubmit = false) => {
    // Calculate score
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    let totalMarks = 0;
    let negativeMarks = 0;

    questions.forEach((q) => {
      if (answers[q.id]) {
        if (answers[q.id] === q.correct_answer) {
          correct++;
          totalMarks += q.marks;
        } else {
          wrong++;
          negativeMarks += q.negative_marks;
        }
      } else {
        unanswered++;
      }
    });

    const finalScore = totalMarks - negativeMarks;
    const marksPerQuestion = questions.length > 0 ? questions[0].marks : 4;
    const timeTaken = testData ? (testData.duration * 60) - timeLeft : 0;

    // Subject-wise breakdown
    const subjectMap = {};
    questions.forEach((q) => {
      if (!subjectMap[q.subject]) {
        subjectMap[q.subject] = { name: q.subject, correct: 0, wrong: 0, total: 0 };
      }
      subjectMap[q.subject].total++;
      if (answers[q.id]) {
        if (answers[q.id] === q.correct_answer) {
          subjectMap[q.subject].correct++;
        } else {
          subjectMap[q.subject].wrong++;
        }
      }
    });

    const resultData = {
      testId: id,
      testData,
      questions,
      answers,
      score: { correct, wrong, unanswered, totalMarks, negativeMarks, finalScore, totalQuestions: questions.length, marksPerQuestion },
      subjectWise: Object.values(subjectMap),
      timeTaken,
      timestamp: new Date().toISOString(),
      autoSubmitted: isAutoSubmit,
    };

    // Save to localStorage
    localStorage.setItem('lastTestResult', JSON.stringify(resultData));

    // Save to attempt history
    const historyKey = `testHistory_${id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({
      attemptNumber: history.length + 1,
      score: finalScore,
      maxMarks: questions.length * marksPerQuestion,
      correct,
      wrong,
      unanswered,
      percentage: Math.max(0, Math.round((finalScore / (questions.length * marksPerQuestion)) * 100)),
      timeTaken,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(historyKey, JSON.stringify(history));

    navigate(`/results/${id}`);
  }, [questions, answers, testData, timeLeft, id, navigate]);

  const handleAutoSubmit = () => {
    setSubmitted(true);
    saveAndNavigate(true);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionKey) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestionIndex].id]: optionKey }));
  };

  const handleSaveAndNext = () => {
    const qId = questions[currentQuestionIndex].id;
    const hasAnswer = answers[qId];

    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: hasAnswer ? 'answered' : 'not-answered',
    }));

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      // Mark next as visited if not-visited
      setQuestionStatus((prev) => ({
        ...prev,
        [nextIndex]: prev[nextIndex] === 'not-visited' ? 'not-answered' : prev[nextIndex],
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleMarkForReview = () => {
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: 'marked',
    }));
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setQuestionStatus((prev) => ({
        ...prev,
        [nextIndex]: prev[nextIndex] === 'not-visited' ? 'not-answered' : prev[nextIndex],
      }));
    }
  };

  const handleClearResponse = () => {
    const qId = questions[currentQuestionIndex].id;
    setAnswers((prev) => {
      const newAnswers = { ...prev };
      delete newAnswers[qId];
      return newAnswers;
    });
    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: 'not-answered',
    }));
  };

  const handleQuestionClick = (index) => {
    setCurrentQuestionIndex(index);
    setQuestionStatus((prev) => ({
      ...prev,
      [index]: prev[index] === 'not-visited' ? 'not-answered' : prev[index],
    }));
    setShowPalette(false);
  };

  const handleSubmit = () => {
    setShowSubmitModal(true);
  };

  const confirmSubmit = () => {
    setSubmitted(true);
    setShowSubmitModal(false);
    saveAndNavigate(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Test Not Found</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-900 text-white font-semibold py-2 px-6 rounded-xl hover:bg-blue-800 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCritical = timeLeft <= 300; // 5 minutes

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Left - Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Section:</span>
                <span className="ml-2 text-sm font-bold text-blue-900">{currentQuestion.subject}</span>
              </div>
              <span className="sm:hidden text-xs font-bold text-blue-900 uppercase">{currentQuestion.subject}</span>
            </div>

            {/* Right - Timer + Palette Toggle */}
            <div className="flex items-center gap-3">
              <div className={`bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100 ${isCritical ? 'timer-critical bg-red-50 border-red-200' : ''}`}>
                <Clock className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-blue-900'}`} />
                <span className={`font-mono font-bold text-sm sm:text-base ${isCritical ? 'text-red-500' : 'text-blue-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowPalette(true)}
                className="lg:hidden w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Question {currentQuestionIndex + 1}
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    of {questions.length}
                  </span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    +{currentQuestion.marks} Marks
                  </span>
                  <span className="text-red-500 font-bold text-sm bg-red-50 px-3 py-1 rounded-lg border border-red-200">
                    −{currentQuestion.negative_marks} Mark
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <QuestionCard
                key={currentQuestionIndex}
                question={currentQuestion}
                selectedOption={answers[currentQuestion.id]}
                onOptionSelect={handleOptionSelect}
              />
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="text-slate-600 hover:text-slate-800 font-medium py-2.5 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                >
                  <ChevronLeft className="w-4 h-4 sm:hidden" />
                  <span className="hidden sm:inline">← Previous</span>
                </button>
                <button
                  onClick={handleMarkForReview}
                  className="text-purple-600 hover:text-purple-700 font-medium py-2.5 px-3 sm:px-4 rounded-xl border-2 border-purple-200 hover:bg-purple-50 transition-all duration-200 text-sm flex items-center gap-1.5 btn-press"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="hidden sm:inline">Mark for Review</span>
                </button>
                <button
                  onClick={handleClearResponse}
                  className="text-slate-500 hover:text-slate-700 font-medium py-2.5 px-3 sm:px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all duration-200 text-sm flex items-center gap-1.5 btn-press"
                >
                  <Eraser className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
              <button
                onClick={handleSaveAndNext}
                className="bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2.5 px-4 sm:px-6 rounded-xl transition-all duration-200 text-sm flex items-center gap-2 shadow-lg shadow-blue-900/20 btn-press"
              >
                <span>Save & Next</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Palette */}
        <div className="hidden lg:block w-72 border-l border-slate-200 bg-white">
          <QuestionPalette
            totalQuestions={questions.length}
            questionStatus={questionStatus}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionClick={handleQuestionClick}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Mobile Palette Overlay */}
      {showPalette && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50 fade-in lg:hidden"
            onClick={() => setShowPalette(false)}
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl slide-in-right lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Navigation</h3>
              <button
                onClick={() => setShowPalette(false)}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <QuestionPalette
                totalQuestions={questions.length}
                questionStatus={questionStatus}
                currentQuestionIndex={currentQuestionIndex}
                onQuestionClick={handleQuestionClick}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Submit Test?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to submit? You won't be able to change your answers after submission.
            </p>

            {/* Quick Stats */}
            <div className="bg-slate-50 rounded-xl p-4 mb-6 space-y-2">
              {(() => {
                let answered = 0, notAnswered = 0, marked = 0, notVisited = 0;
                for (let i = 0; i < questions.length; i++) {
                  switch (questionStatus[i]) {
                    case 'answered': answered++; break;
                    case 'not-answered': notAnswered++; break;
                    case 'marked': marked++; break;
                    default: notVisited++; break;
                  }
                }
                return (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Answered</span>
                      <span className="font-bold text-emerald-600">{answered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Not Answered</span>
                      <span className="font-bold text-red-500">{notAnswered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Marked for Review</span>
                      <span className="font-bold text-purple-500">{marked}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Not Visited</span>
                      <span className="font-bold text-slate-400">{notVisited}</span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors btn-press"
              >
                Cancel
              </button>
              <button
                onClick={confirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/25 btn-press"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
