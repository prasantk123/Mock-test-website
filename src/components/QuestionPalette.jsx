import { Send } from 'lucide-react';

export default function QuestionPalette({
  totalQuestions,
  questionStatus,
  currentQuestionIndex,
  onQuestionClick,
  onSubmit,
}) {
  const getStatusColor = (index) => {
    const status = questionStatus[index];
    switch (status) {
      case 'answered':
        return 'bg-emerald-500 text-white border-emerald-500';
      case 'not-answered':
        return 'bg-red-500 text-white border-red-500';
      case 'marked':
        return 'bg-purple-500 text-white border-purple-500';
      default:
        return 'bg-slate-200 text-slate-600 border-slate-200';
    }
  };

  const getCounts = () => {
    const counts = { answered: 0, 'not-answered': 0, marked: 0, 'not-visited': 0 };
    for (let i = 0; i < totalQuestions; i++) {
      const status = questionStatus[i] || 'not-visited';
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  };

  const counts = getCounts();

  return (
    <div className="flex flex-col h-full">
      {/* Legend */}
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Question Palette</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-emerald-500 flex-shrink-0"></span>
            <span className="text-xs text-slate-600">Answered ({counts.answered})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-red-500 flex-shrink-0"></span>
            <span className="text-xs text-slate-600">Not Answered ({counts['not-answered']})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-slate-200 flex-shrink-0"></span>
            <span className="text-xs text-slate-600">Not Visited ({counts['not-visited']})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded bg-purple-500 flex-shrink-0"></span>
            <span className="text-xs text-slate-600">Marked ({counts.marked})</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: totalQuestions }, (_, i) => (
            <button
              key={i}
              onClick={() => onQuestionClick(i)}
              className={`palette-item w-full aspect-square rounded-lg text-xs sm:text-sm font-semibold border-2 flex items-center justify-center ${
                getStatusColor(i)
              } ${
                currentQuestionIndex === i
                  ? 'ring-2 ring-blue-900 ring-offset-2 scale-110'
                  : ''
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={onSubmit}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 btn-press"
        >
          <Send className="w-4 h-4" />
          Submit Test
        </button>
      </div>
    </div>
  );
}
