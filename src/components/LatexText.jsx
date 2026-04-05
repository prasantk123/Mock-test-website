import Latex from 'react-latex-next';

export default function LatexText({ text }) {
  if (!text) return null;
  // react-latex-next handles $...$ for inline and $$...$$ for block math automatically
  return <Latex>{text.toString()}</Latex>;
}
