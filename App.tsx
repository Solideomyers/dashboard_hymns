import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Hymn, Slide, SlideType, StyleOptions } from './types';
import { COVER_IMAGE_PATH, TITLE_IMAGE_PATH, LYRIC_IMAGE_PATH } from './constants';
import HymnSlide from './components/HymnSlide';
import Navigation from './components/Navigation';
import StyleEditor from './components/StyleEditor';

// Make PptxGenJS and JSZip globally available from the script tags in index.html
declare var PptxGenJS: any;
declare var JSZip: any;

type Theme = 'light' | 'dark';

const defaultLyrics = `HIMNO: 14
TÍTULO: VENID, GLORIFICAD A DIOS

Efesios 1:5-6
Venid, glorificad a Dios...
Sin manchas, puros en Su luz...

Venid, glorificad a Dios, que en Cristo gracia da...
En Él Dios ya nos reveló Su eterna voluntad...

CORO:
¡Alaben al Señor!
¡Por su gracia y amor!

Venid, glorificad a Dios, creyentes del Señor...
Él garantiza nuestra fe hasta el día final...`;

const FONT_BASKERVILLE = "Baskerville, 'Goudy Old Style', 'Palatino', 'Book Antiqua', serif";
const FONT_GEORGIA = 'Georgia, serif';

const defaultStyles: StyleOptions = {
  hymnTitle: { fontFace: FONT_BASKERVILLE, fontSize: 60, color: '#FFFFFF', bold: true },
  hymnNumber: { fontFace: FONT_BASKERVILLE, fontSize: 32, color: '#FFFFFF' },
  sectionTitle: { fontFace: FONT_GEORGIA, fontSize: 28, color: '#FFFFFF', underline: true },
  lyrics: { fontFace: FONT_GEORGIA, fontSize: 44, color: '#FFFFFF', align: 'center' },
  slideNumber: { fontFace: FONT_GEORGIA, fontSize: 18, color: '#FFFFFF' },
};

const parseLyrics = (text: string): Hymn => {
    const lines = text.split('\n').map(line => line.trim());
    
    let hymnNumber = '';
    let hymnTitle = 'Hymn';
    
    const findAndRemove = (regex: RegExp): string => {
        const index = lines.findIndex(line => regex.test(line));
        if (index > -1) {
            const match = lines[index].match(regex);
            lines.splice(index, 1);
            return match ? match[1].trim() : '';
        }
        return '';
    };

    hymnNumber = findAndRemove(/^(?:HIMNO|NUMBER):(.*)/i);
    hymnTitle = findAndRemove(/^(?:TÍTULO|TITLE):(.*)/i) || 'Hymn';

    const slides: Slide[] = [];

    slides.push({ type: SlideType.COVER, lines: [], backgroundImage: COVER_IMAGE_PATH });
    slides.push({
        type: SlideType.TITLE,
        title: `HIMNO: ${hymnNumber}`,
        lines: [hymnTitle.toUpperCase()],
        backgroundImage: TITLE_IMAGE_PATH
    });

    let currentLines: string[] = [];
    let currentTitle: string | undefined = undefined;

    const createLyricsSlide = () => {
        if (currentLines.length > 0) {
            slides.push({
                type: SlideType.LYRICS,
                title: currentTitle,
                lines: currentLines,
                backgroundImage: LYRIC_IMAGE_PATH
            });
            currentLines = [];
            currentTitle = undefined;
        }
    };

    for (const line of lines) {
        if (line === '') {
            createLyricsSlide();
            continue;
        }

        const isGroupTitle = /^(CORO|CHORUS|ESTROFA|VERSE|PUENTE|BRIDGE|Efesios[^\n]*)/i.test(line);
        if (isGroupTitle) {
            createLyricsSlide();
            currentTitle = line.replace(':', '').toUpperCase();
            continue;
        }

        currentLines.push(line);
        if (currentLines.length >= 4) {
            createLyricsSlide();
        }
    }
    createLyricsSlide();

    return { id: hymnNumber, title: hymnTitle, slides };
};

const imageToBase64 = (url: string): Promise<string> =>
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.blob();
    })
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));


const createPptx = async (hymn: Hymn, styles: StyleOptions) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  const [coverImg, titleImg, lyricImg] = await Promise.all([
    imageToBase64(COVER_IMAGE_PATH),
    imageToBase64(TITLE_IMAGE_PATH),
    imageToBase64(LYRIC_IMAGE_PATH),
  ]);

  pptx.defineSlideMaster({ title: 'COVER_MASTER', background: { data: coverImg } });
  pptx.defineSlideMaster({ title: 'TITLE_MASTER', background: { data: titleImg } });
  pptx.defineSlideMaster({ title: 'LYRICS_MASTER', background: { data: lyricImg } });

  hymn.slides.forEach((slideData, index) => {
    let masterName = '';
    switch (slideData.type) {
      case SlideType.COVER: masterName = 'COVER_MASTER'; break;
      case SlideType.TITLE: masterName = 'TITLE_MASTER'; break;
      case SlideType.LYRICS: masterName = 'LYRICS_MASTER'; break;
    }
    
    const slide = pptx.addSlide({ masterName });

    if (slideData.type !== SlideType.COVER) {
       slide.addText(`${index}/${hymn.slides.length - 1}`, { 
         x: '88%', y: '4%', w: '10%', h: '8%', 
         fontFace: styles.slideNumber.fontFace, 
         fontSize: styles.slideNumber.fontSize, 
         color: styles.slideNumber.color.replace('#', ''), 
         align: 'right' 
       });
    }

    const isTitleSlide = slideData.type === SlideType.TITLE;
    
    if (slideData.title) { // Hymn Number or Section Title
        const style = isTitleSlide ? styles.hymnNumber : styles.sectionTitle;
        slide.addText(slideData.title, {
            x: 0, y: isTitleSlide ? '30%' : '20%', w: '100%',
            align: 'center', 
            fontFace: style.fontFace,
            fontSize: style.fontSize,
            color: style.color.replace('#', ''), 
            underline: isTitleSlide ? false : styles.sectionTitle.underline
        });
    }

    if (slideData.lines.length > 0) { // Hymn Title or Lyrics
        const style = isTitleSlide ? styles.hymnTitle : styles.lyrics;
        slide.addText(slideData.lines.join('\n'), {
            x: 0, y: isTitleSlide ? '45%' : '35%', w: '100%', h: '60%',
            align: 'align' in style ? style.align : 'center', 
            fontFace: style.fontFace,
            fontSize: style.fontSize,
            color: style.color.replace('#', ''), 
            bold: isTitleSlide ? styles.hymnTitle.bold : false,
            lineSpacing: style.fontSize * 1.5
        });
    }
  });

  await pptx.writeFile({ fileName: `${hymn.title.replace(/ /g, '_') || 'hymn'}.pptx` });
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('hymn-app-theme');
        if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });
  
  const [lyrics, setLyrics] = useState(defaultLyrics);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [styleOptions, setStyleOptions] = useState<StyleOptions>(defaultStyles);
  const [isLyricsEditorCollapsed, setIsLyricsEditorCollapsed] = useState(false);
  const [isStyleEditorCollapsed, setIsStyleEditorCollapsed] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const importPptxInputRef = useRef<HTMLInputElement>(null);

  const parsedHymn = useMemo(() => parseLyrics(lyrics), [lyrics]);

  useEffect(() => {
    localStorage.setItem('hymn-app-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  const safeSlideIndex = Math.min(currentSlideIndex, parsedHymn.slides.length > 0 ? parsedHymn.slides.length - 1 : 0);

  useEffect(() => {
    if (currentSlideIndex >= parsedHymn.slides.length) {
      setCurrentSlideIndex(Math.max(0, parsedHymn.slides.length - 1));
    }
  }, [parsedHymn, currentSlideIndex]);
  
  const handleGenerateClick = async () => {
    if(!lyrics.trim()) {
        alert("Please enter some lyrics to generate a presentation.");
        return;
    }
    setIsGenerating(true);
    try {
        await createPptx(parsedHymn, styleOptions);
    } catch (error) {
        console.error("Failed to generate PPTX:", error);
        alert("An error occurred while generating the presentation. Please check the console for details.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleImportClick = () => {
    importPptxInputRef.current?.click();
  };

  const handlePptxFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    try {
        const zip = await JSZip.loadAsync(file);
        const slidePromises: Promise<string>[] = [];
        
        // Find all slide XML files
        zip.folder('ppt/slides')?.forEach((relativePath, file) => {
            if (relativePath.startsWith('slide') && relativePath.endsWith('.xml')) {
                slidePromises.push(file.async('string'));
            }
        });

        const slideXmls = await Promise.all(slidePromises);
        const parser = new DOMParser();
        let fullText = '';
        
        slideXmls.forEach(xmlString => {
            const xmlDoc = parser.parseFromString(xmlString, 'application/xml');
            const textNodes = xmlDoc.getElementsByTagName('a:t');
            let slideText = '';
            for (let i = 0; i < textNodes.length; i++) {
                slideText += (textNodes[i].textContent || '') + ' ';
            }
            if (slideText.trim()) {
                fullText += slideText.trim().replace(/ +/g, ' ') + '\n\n';
            }
        });
        
        setLyrics(fullText.trim());
        setCurrentSlideIndex(0);

    } catch (error) {
        console.error("Failed to import PPTX:", error);
        alert("An error occurred while importing the presentation. It may be corrupted or in an unsupported format.");
    } finally {
        setIsImporting(false);
        // Reset file input to allow importing the same file again
        if(event.target) event.target.value = '';
    }
  };


  const handlePrev = () => {
    setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentSlideIndex(prev => Math.min(parsedHymn.slides.length - 1, prev + 1));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (loadEvent) => {
          const content = loadEvent.target?.result;
          if (typeof content === 'string') {
            setLyrics(content);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please drop a .txt file.");
      }
    }
  };
    
  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8 px-4">
          <svg className="w-8 h-8 text-[var(--primary)]" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        <h1 className="text-xl font-bold text-[var(--sidebar-foreground)]">Hymn Generator</h1>
      </div>

      <div className="px-4 mb-4 grid grid-cols-2 gap-2">
        <input type="file" ref={importPptxInputRef} onChange={handlePptxFileChange} accept=".pptx" style={{ display: 'none' }} />
        <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-base font-semibold bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
            style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {isImporting ? 'Importing...' : 'Import PPTX'}
        </button>
        <button
            onClick={handleGenerateClick}
            disabled={isGenerating}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-base font-semibold bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
            style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
         <div className="h-full flex flex-col bg-[var(--sidebar-accent)]/50" style={{ borderRadius: 'var(--radius-lg)' }}>
            <div className={`p-2 flex items-center justify-between`}>
              <h2 className={`text-base font-semibold flex items-center gap-2 text-[var(--sidebar-foreground)]`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Lyrics Editor
              </h2>
              <div className="flex items-center gap-1">
                 <button onClick={() => setLyrics('')} title="Clear lyrics" className={`p-1.5 hover:bg-[var(--sidebar-accent)]`} style={{ borderRadius: '9999px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--sidebar-accent-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                 </button>
                 <button onClick={() => setIsLyricsEditorCollapsed(prev => !prev)} className={`p-1.5 hover:bg-[var(--sidebar-accent)]`} style={{ borderRadius: '9999px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 text-[var(--sidebar-accent-foreground)] ${isLyricsEditorCollapsed ? '' : 'transform rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                 </button>
              </div>
            </div>
            
            {!isLyricsEditorCollapsed && (
              <div 
                 className="relative mt-2 px-2 pb-2"
                 onDragOver={handleDragOver}
                 onDragLeave={handleDragLeave}
                 onDrop={handleDrop}
              >
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="Enter hymn lyrics here..."
                  className="w-full p-3 border bg-[var(--input)] text-[var(--foreground)] focus:ring-2 focus:ring-[var(--ring)] focus:outline-none transition-colors duration-300 min-h-[200px] text-base resize-none"
                  style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }}
                  aria-label="Hymn Lyrics Input"
                />
                 {isDragging && (
                    <div className="absolute inset-0 m-2 bg-[var(--primary)]/10 border-2 border-dashed border-[var(--primary)] flex items-center justify-center pointer-events-none" style={{ borderRadius: 'var(--radius-md)' }}>
                        <p className="text-[var(--primary)] font-semibold text-lg">Drop .txt file here</p>
                    </div>
                  )}
              </div>
            )}
            
            <div className="border-t border-[var(--sidebar-border)]/50">
             <StyleEditor 
                options={styleOptions} 
                setOptions={setStyleOptions}
                isCollapsed={isStyleEditorCollapsed}
                onToggleCollapse={() => setIsStyleEditorCollapsed(prev => !prev)}
              />
            </div>
        </div>
      </div>

      <div className="mt-auto flex justify-center p-4">
            <div className="p-1 rounded-full bg-[var(--muted)] flex">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-2 transition-colors ${theme === 'light' ? 'bg-[var(--card)] shadow-sm' : ''}`}
                  style={{ borderRadius: '9999px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
                 <button
                  onClick={() => setTheme('dark')}
                  className={`p-2 transition-colors ${theme === 'dark' ? 'bg-[var(--muted-foreground)]' : ''}`}
                  style={{ borderRadius: '9999px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-300' : 'text-[var(--muted-foreground)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
            </div>
        </div>
    </>
  );

  return (
    <div className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex h-screen">
      
        <div 
          className={`fixed inset-0 z-20 bg-black/30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <aside className={`fixed top-0 left-0 h-full w-64 flex flex-col pt-6 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] z-30
                           md:relative md:w-64 md:translate-x-0
                           transition-transform duration-300 ease-in-out
                           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <SidebarContent />
        </aside>

        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className={`sticky top-0 z-10 p-4 flex items-center justify-between md:justify-end bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]`}>
             <button className="md:hidden text-[var(--muted-foreground)]" onClick={() => setIsSidebarOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
             <h2 className="text-xl font-semibold text-[var(--foreground)]">Live Preview</h2>
          </header>

          <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center">
              {parsedHymn && parsedHymn.slides.length > 0 ? (
                <>
                  <HymnSlide 
                    slide={parsedHymn.slides[safeSlideIndex]}
                    currentSlideIndex={safeSlideIndex}
                    totalSlides={parsedHymn.slides.length}
                    theme={theme}
                    styleOptions={styleOptions}
                  />
                  <div className="mt-6 w-full max-w-5xl">
                    <Navigation 
                      onPrev={handlePrev} 
                      onNext={handleNext}
                      currentIndex={safeSlideIndex}
                      totalSlides={parsedHymn.slides.length}
                    />
                  </div>
                </>
              ) : (
                 <div className="text-center text-[var(--muted-foreground)]">
                    <p>Enter some lyrics to see the preview.</p>
                 </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;