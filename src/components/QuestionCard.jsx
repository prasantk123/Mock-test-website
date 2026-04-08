import LatexText from './LatexText';
import { useState } from 'react';

export default function QuestionCard({ 
  question, 
  assameseQuestion, 
  globalMedium = 'en', 
  selectedOption, 
  onOptionSelect 
}) {
  const [localMedium, setLocalMedium] = useState(globalMedium);

  // Check if translation is allowed and exists
  const canTranslate = assameseQuestion && question.subject?.toLowerCase() !== 'english';
  
  // Choose which language data to display
  const activeData = (canTranslate && localMedium === 'as') ? assameseQuestion : question;

  const options = [
    { key: 'A', text: activeData.option_a },
    { key: 'B', text: activeData.option_b },
    { key: 'C', text: activeData.option_c },
    { key: 'D', text: activeData.option_d },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Optional Per-Question Language Toggle */}
      {canTranslate && (
        <div className="flex justify-end mb-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
            <button
              onClick={() => setLocalMedium('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${localMedium === 'en' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              English
            </button>
            <button
              onClick={() => setLocalMedium('as')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${localMedium === 'as' ? 'bg-blue-50 text-blue-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              অসমীয়া
            </button>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 mb-5 shadow-sm">
        <div className="text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
          <LatexText text={activeData.question_text} />
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.key;
          return (
            <label
              key={option.key}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                isSelected
                  ? 'border-blue-900 bg-blue-50/70 shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
              onClick={() => onOptionSelect(option.key)}
            >
              <input
                type="radio"
                name={`question-${question._id}`}
                className="option-radio"
                checked={isSelected}
                onChange={() => onOptionSelect(option.key)}
              />
              <span className={`font-semibold text-sm w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? 'bg-blue-900 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
              }`}>
                {option.key}
              </span>
              <div className={`text-sm sm:text-base transition-colors ${
                isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'
              }`}>
                <LatexText text={option.text} />
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
