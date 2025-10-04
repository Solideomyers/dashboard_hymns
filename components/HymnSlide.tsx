import React, { useRef, useState, useLayoutEffect } from 'react';
import { Slide, SlideType, StyleOptions } from '../types';

type Theme = 'light' | 'dark';

interface HymnSlideProps {
  slide: Slide;
  currentSlideIndex: number;
  totalSlides: number;
  theme: Theme;
  styleOptions: StyleOptions;
}

const DESIGN_WIDTH = 1280;
const DESIGN_HEIGHT = 720;

const HymnSlide: React.FC<HymnSlideProps> = ({ slide, currentSlideIndex, totalSlides, theme, styleOptions }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const containerElement = containerRef.current;
    if (!containerElement) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        setScale(width / DESIGN_WIDTH);
      }
    });

    resizeObserver.observe(containerElement);
    
    // Set initial scale
    const initialWidth = containerElement.getBoundingClientRect().width;
    if (initialWidth > 0) {
        setScale(initialWidth / DESIGN_WIDTH);
    }

    return () => resizeObserver.disconnect();
  }, []);
  
  // This effect handles the automatic text fitting
  useLayoutEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    // Reset transform to get the true overflow height
    contentElement.style.transform = 'scale(1)';

    // Check for overflow with a small buffer
    const isOverflowing = contentElement.scrollHeight > contentElement.clientHeight + 2;

    if (isOverflowing) {
        // Calculate the scale factor needed to fit the content
        const scaleFactor = (contentElement.clientHeight / contentElement.scrollHeight);
        // Apply the scale transform from the top center
        contentElement.style.transform = `scale(${scaleFactor})`;
        contentElement.style.transformOrigin = 'center top';
    }
  }, [slide, styleOptions, scale]); // Rerun when slide, styles, or the main container scale changes


  const isDark = theme === 'dark';
  
  const isCover = slide.type === SlideType.COVER;
  const isTitleSlide = slide.type === SlideType.TITLE;

  const getLineStyle = (isTitleSlide: boolean): React.CSSProperties => {
    const style = isTitleSlide ? styleOptions.hymnTitle : styleOptions.lyrics;
    const lightModeColor = 'var(--foreground)';
    return {
      fontFamily: style.fontFace,
      fontSize: `${style.fontSize}px`,
      color: isDark ? style.color : lightModeColor,
      fontWeight: isTitleSlide && styleOptions.hymnTitle.bold ? 'bold' : 'normal',
      textAlign: 'align' in style ? style.align : 'center',
    };
  };
  
  const getTitleStyle = (isTitleSlide: boolean): React.CSSProperties => {
    const style = isTitleSlide ? styleOptions.hymnNumber : styleOptions.sectionTitle;
    const lightModeColor = 'var(--foreground)';
    return {
      fontFamily: style.fontFace,
      fontSize: `${style.fontSize}px`,
      color: isDark ? style.color : lightModeColor,
      textDecoration: !isTitleSlide && styleOptions.sectionTitle.underline ? 'underline' : 'none',
    };
  };

  const getSlideNumberStyle = (): React.CSSProperties => {
    const style = styleOptions.slideNumber;
    const lightModeColor = 'var(--muted-foreground)';
    return {
      fontFamily: style.fontFace,
      fontSize: `${style.fontSize}px`,
      color: isDark ? style.color : lightModeColor,
    };
  };
  
  const textShadow = isDark ? '0 2px 4px rgba(0, 0, 0, 0.7)' : 'none';

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-5xl aspect-[16/9] overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: isDark ? '#000' : 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)'
      }}
      role="region"
      aria-label={`Slide ${currentSlideIndex + 1} of ${totalSlides}`}
    >
      <div 
        className="absolute top-0 left-0"
        style={{
          width: `${DESIGN_WIDTH}px`,
          height: `${DESIGN_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        {isDark && (
          <>
            <div
              key={`bg-${currentSlideIndex}`}
              style={{
                backgroundImage: `url(${slide.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: DESIGN_WIDTH,
                height: DESIGN_HEIGHT,
              }}
              className="absolute inset-0 animate-kenBurns"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </>
        )}

        {!isCover && (
          <div 
            style={{ 
                ...getSlideNumberStyle(), 
                textShadow,
                position: 'absolute',
                top: '28px',
                right: '42px',
                fontWeight: 'bold',
                zIndex: 20
            }}
          >
            {currentSlideIndex}/{totalSlides - 1}
          </div>
        )}

        <div 
          key={`content-${currentSlideIndex}`}
          ref={contentRef}
          className="relative z-10 w-full h-full flex flex-col items-center justify-start text-center"
          style={{ padding: '64px', paddingTop: '80px', paddingBottom: '96px'}}
        >
          {!isCover && (
            <>
              {slide.title && (
                <h2 
                  className="font-bold animate-fadeInUp"
                  style={{ 
                      ...getTitleStyle(isTitleSlide), 
                      textShadow, 
                      animationDelay: '100ms', 
                      opacity: 0,
                      marginBottom: '24px',
                      flexShrink: 0
                  }}
                >
                  {slide.title}
                </h2>
              )}
              <div style={{width: '100%', textAlign: styleOptions.lyrics.align}}>
                {slide.lines.map((line, index) => (
                  <p 
                    key={index} 
                    className="animate-fadeInUp"
                    style={{
                      ...getLineStyle(isTitleSlide),
                      textShadow,
                      animationDelay: `${(slide.title ? 300 : 100) + index * 150}ms`,
                      opacity: 0,
                      marginBottom: '12px',
                      lineHeight: 1.4,
                    }}
                  >
                    {line}
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default HymnSlide;
