import React from 'react';

interface NavigationProps {
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  totalSlides: number;
}

const Navigation: React.FC<NavigationProps> = ({ onPrev, onNext, currentIndex, totalSlides }) => {

  const buttonClasses = `px-6 py-2 border border-[var(--border)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold`;
  
  const textClasses = `font-medium text-sm text-[var(--muted-foreground)]`;

  return (
    <div className="flex justify-center items-center space-x-4">
      <button
        onClick={onPrev}
        disabled={currentIndex === 0}
        className={buttonClasses}
        style={{ borderRadius: 'var(--radius-md)'}}
        aria-label="Previous Slide"
      >
        Previous
      </button>
      <span className={textClasses} aria-live="polite">
        {currentIndex + 1} / {totalSlides}
      </span>
      <button
        onClick={onNext}
        disabled={currentIndex === totalSlides - 1}
        className={buttonClasses}
        style={{ borderRadius: 'var(--radius-md)'}}
        aria-label="Next Slide"
      >
        Next
      </button>
    </div>
  );
};

export default Navigation;