import Latex from 'react-latex-next';

export default function LatexText({ text }) {
  if (!text) return null;

  // Convert markdown **bold** to KaTeX \textbf{bold} recursively or just simply
  // so it renders correctly natively inside react-latex-next
  const processedText = text.toString().replace(/\*\*(.*?)\*\*/g, '$\\textbf{$1}$');

  // Define delimiters explicitly to ensure $...$ works
  const delimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
  ];

  return (
    <Latex 
      delimiters={delimiters}
      strict="ignore"
      throwOnError={false}
    >
      {processedText}
    </Latex>
  );
}
