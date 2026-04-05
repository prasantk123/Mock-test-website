import Latex from 'react-latex-next';

export default function LatexText({ text }) {
  if (!text) return null;
  // Define delimiters explicitly to ensure $...$ works
  const delimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
  ];
  return <Latex delimiters={delimiters}>{text.toString()}</Latex>;
}
