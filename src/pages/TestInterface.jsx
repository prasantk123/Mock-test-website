import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Bookmark, Eraser, ArrowRight, Menu, X, ChevronLeft, AlertTriangle } from 'lucide-react';
import QuestionCard from '../components/QuestionCard';
import QuestionPalette from '../components/QuestionPalette';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';

export default function TestInterface() {
  const { id } = useParams(); // id is now the filename, e.g. "mock_test_1.json"
  const navigate = useNavigate();
  const { user } = useUser();

  const [testData, setTestData] = useState(null);
  const [assameseData, setAssameseData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [assameseQuestions, setAssameseQuestions] = useState([]);
  const [globalMedium, setGlobalMedium] = useState('en');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStatus, setQuestionStatus] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionTimes, setQuestionTimes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  // Handle browser back and reload
  useEffect(() => {
    if (loading || submitted) return;

    window.history.pushState(null, null, window.location.pathname);

    const handlePopState = (e) => {
      e.preventDefault();
      setShowExitModal(true);
      window.history.pushState(null, null, window.location.pathname);
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, submitted]);

  // Fetch test data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/${id}?t=${Date.now()}`);
        if (!response.ok) throw new Error('Test not found');
        const data = await response.json();
        setTestData(data.mock_test);

        // Attempt to fetch Assamese file silently
        try {
          const asId = id.replace('.json', '_as.json');
          if (asId !== id) {
            const responseAs = await fetch(`${import.meta.env.BASE_URL}data/${asId}?t=${Date.now()}`);
            if (responseAs.ok) {
              const dataAs = await responseAs.json();
              setAssameseData(dataAs.mock_test);
              setAssameseQuestions(dataAs.questions.map((q, i) => ({
                ...q, _id: i, marks: q.marks || 1
              })));
            }
          }
        } catch (e) {
          // It's totally fine if translation doesn't exist
          console.log("No translated version found");
        }

        // Assign sequential IDs if not present
        const questionsWithIds = data.questions.map((q, i) => ({
          ...q,
          _id: i, // internal ID for tracking
          marks: q.marks || 1,
        }));

        setQuestions(questionsWithIds);
        setTimeLeft(data.mock_test.duration * 60);

        // Initialize question status
        const initialStatus = {};
        questionsWithIds.forEach((_, i) => {
          initialStatus[i] = 'not-visited';
        });
        initialStatus[0] = 'not-answered';
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

  // Per-Question Timer
  useEffect(() => {
    if (loading || submitted || questions.length === 0) return;

    const qTimer = setInterval(() => {
      setQuestionTimes((prev) => {
        const qId = questions[currentQuestionIndex]?._id;
        if (qId === undefined) return prev;
        return {
          ...prev,
          [qId]: (prev[qId] || 0) + 1,
        };
      });
    }, 1000);

    return () => clearInterval(qTimer);
  }, [loading, submitted, currentQuestionIndex, questions]);

  const saveAndNavigate = useCallback((isAutoSubmit = false) => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    let totalMarks = 0;

    questions.forEach((q) => {
      if (answers[q._id] !== undefined) {
        if (answers[q._id] === q.correct_answer) {
          correct++;
          totalMarks += q.marks;
        } else {
          wrong++;
        }
      } else {
        unanswered++;
      }
    });

    const maxMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const timeTaken = testData ? (testData.duration * 60) - timeLeft : 0;

    // Subject-wise breakdown
    const subjectMap = {};
    questions.forEach((q) => {
      const subject = q.subject || 'General';
      if (!subjectMap[subject]) {
        subjectMap[subject] = { name: subject, correct: 0, wrong: 0, total: 0 };
      }
      subjectMap[subject].total++;
      if (answers[q._id] !== undefined) {
        if (answers[q._id] === q.correct_answer) {
          subjectMap[subject].correct++;
        } else {
          subjectMap[subject].wrong++;
        }
      }
    });

    const resultData = {
      testId: id,
      testData,
      questions,
      answers,
      score: {
        correct,
        wrong,
        unanswered,
        totalMarks,
        finalScore: totalMarks,
        totalQuestions: questions.length,
        maxMarks,
      },
      subjectWise: Object.values(subjectMap),
      timeTaken,
      questionTimes,
      timestamp: new Date().toISOString(),
      autoSubmitted: isAutoSubmit,
    };

    localStorage.setItem('lastTestResult', JSON.stringify(resultData));

    // Save to attempt history
    const historyKey = `testHistory_${id}`;
    const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
    history.push({
      attemptNumber: history.length + 1,
      score: totalMarks,
      maxMarks,
      correct,
      wrong,
      unanswered,
      percentage: maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0,
      timeTaken,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem(historyKey, JSON.stringify(history));

    // Save to Firestore asynchronously
    const percentageScore = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100) : 0;
    
    if (user && db) {
      addDoc(collection(db, 'results'), {
        phoneNumber: user.phoneNumber,
        firstName: user.firstName,
        testId: id,
        testTitle: testData?.title || id,
        score: totalMarks,
        maxMarks: maxMarks,
        correct: correct,
        wrong: wrong,
        unanswered: unanswered,
        percentage: percentageScore,
        timeTaken: timeTaken,
        questionTimes: questionTimes,
        subjectWise: Object.values(subjectMap),
        timestamp: serverTimestamp(),
        autoSubmitted: isAutoSubmit,
        answers: answers,
        questions: questions
      }).catch(err => {
        console.error("Failed to save result to Firestore:", err);
      });
    }

    navigate(`/results/${encodeURIComponent(id)}`);
  }, [questions, answers, testData, timeLeft, id, navigate, user]);

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

  const formatQuestionTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = (optionKey) => {
    setAnswers((prev) => ({ ...prev, [questions[currentQuestionIndex]._id]: optionKey }));
  };

  const handleSaveAndNext = () => {
    const qId = questions[currentQuestionIndex]._id;
    const hasAnswer = answers[qId] !== undefined;

    setQuestionStatus((prev) => ({
      ...prev,
      [currentQuestionIndex]: hasAnswer ? 'answered' : 'not-answered',
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
    const qId = questions[currentQuestionIndex]._id;
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
  const isCritical = timeLeft <= 300;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-full mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExitModal(true)}
                className="text-slate-400 hover:text-slate-600 transition-colors lg:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="hidden sm:block">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Section:</span>
                <span className="ml-2 text-sm font-bold text-blue-900">{currentQuestion.subject || 'General'}</span>
              </div>
              <span className="sm:hidden text-xs font-bold text-blue-900 uppercase">{currentQuestion.subject || 'General'}</span>
            </div>

            <div className="flex items-center gap-3">
              {assameseData && (
                <div className="hidden sm:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button 
                    onClick={() => setGlobalMedium('en')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${globalMedium === 'en' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setGlobalMedium('as')}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-all ${globalMedium === 'as' ? 'bg-white shadow-sm text-blue-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    অসমীয়া
                  </button>
                </div>
              )}
              <div className={`bg-blue-50 px-4 py-2 rounded-xl flex items-center gap-2 border border-blue-100 ${isCritical ? 'timer-critical bg-red-50 border-red-200' : ''}`}>
                <Clock className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-blue-900'}`} />
                <span className={`font-mono font-bold text-sm sm:text-base ${isCritical ? 'text-red-500' : 'text-blue-900'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              <button
                onClick={() => setShowPalette(true)}
                className="lg:hidden w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                title="Open Navigation Palette"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
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
                  <div className="flex items-center bg-slate-100 px-3 py-1 rounded-lg border border-slate-200" title="Time spent on this question">
                    <Clock className="w-4 h-4 text-slate-500 mr-2" />
                    <span className="text-sm font-semibold text-slate-600 font-mono">
                      {formatQuestionTime(questionTimes[currentQuestion._id] || 0)}
                    </span>
                  </div>
                  <span className="text-emerald-500 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                    +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Question Card */}
              <QuestionCard
                key={`${currentQuestionIndex}-${globalMedium}`}
                question={currentQuestion}
                assameseQuestion={assameseQuestions.length > currentQuestionIndex ? assameseQuestions[currentQuestionIndex] : null}
                globalMedium={globalMedium}
                selectedOption={answers[currentQuestion._id]}
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

        {/* Desktop Sidebar */}
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

      {/* Mobile Palette */}
      {showPalette && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 fade-in lg:hidden" onClick={() => setShowPalette(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl slide-in-right lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Navigation</h3>
              <button onClick={() => setShowPalette(false)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
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

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-fade-in-up">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Exit Test?</h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to exit the test? Your progress will be lost and the test will not be saved.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors btn-press"
              >
                Resume
              </button>
              <button
                onClick={() => {
                  setShowExitModal(false);
                  navigate('/');
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/25 btn-press"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
