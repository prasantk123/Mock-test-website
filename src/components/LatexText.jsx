import React, { Component } from 'react';
import Latex from 'react-latex-next';

class LatexErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("LaTeX Rendering Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return <span>{this.props.rawText}</span>;
    }
    return this.props.children;
  }
}

export default function LatexText({ text }) {
  if (!text) return null;

  // Use \mathbf instead of \textbf, sometimes \textbf is problematic
  const processedText = text.toString().replace(/\*\*(.*?)\*\*/g, '$\\mathbf{$1}$');

  const delimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '$', right: '$', display: false },
    { left: '\\[', right: '\\]', display: true },
  ];

  return (
    <LatexErrorBoundary rawText={text.toString()}>
      <Latex 
        delimiters={delimiters}
        strict="ignore"
        throwOnError={false}
      >
        {processedText}
      </Latex>
    </LatexErrorBoundary>
  );
}
