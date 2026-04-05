export default function QuestionCard({ question, selectedOption, onOptionSelect }) {
  const options = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
    { key: 'D', text: question.option_d },
  ];

  return (
    <div className="animate-fade-in-up">
      {/* Question Text */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 mb-5 shadow-sm">
        <p className="text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
          {question.question_text}
        </p>
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
              <span className={`text-sm sm:text-base transition-colors ${
                isSelected ? 'text-blue-900 font-medium' : 'text-slate-700'
              }`}>
                {option.text}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
