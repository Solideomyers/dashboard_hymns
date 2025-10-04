import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Hymn, Slide, SlideType, StyleOptions } from './types';
import HymnSlide from './components/HymnSlide';
import Navigation from './components/Navigation';
import StyleEditor from './components/StyleEditor';
import HymnList from './components/HymnList';
import HymnEditorModal from './components/HymnEditorModal';

declare var PptxGenJS: any;

type Theme = 'light' | 'dark';

const FONT_BASKERVILLE = "Baskerville, 'Goudy Old Style', 'Palatino', 'Book Antiqua', serif";
const FONT_GEORGIA = 'Georgia, serif';

const defaultStyles: StyleOptions = {
  hymnTitle: { fontFace: FONT_BASKERVILLE, fontSize: 60, color: '#FFFFFF', bold: true },
  hymnNumber: { fontFace: FONT_BASKERVILLE, fontSize: 32, color: '#FFFFFF' },
  sectionTitle: { fontFace: FONT_GEORGIA, fontSize: 28, color: '#FFFFFF', underline: true },
  lyrics: { fontFace: FONT_GEORGIA, fontSize: 44, color: '#FFFFFF', align: 'center' },
  slideNumber: { fontFace: FONT_GEORGIA, fontSize: 18, color: '#FFFFFF' },
};

const generateSlidesFromHymn = (hymn: Hymn): Slide[] => {
  const slides: Slide[] = [];

  slides.push({
    type: SlideType.COVER,
    lines: [],
    backgroundImage: hymn.backgrounds.cover,
  });

  slides.push({
    type: SlideType.TITLE,
    title: `HIMNO: ${hymn.number}`,
    lines: [hymn.title.toUpperCase()],
    backgroundImage: hymn.backgrounds.title,
  });

  hymn.stanzas.forEach((stanza, index) => {
    slides.push({
      type: SlideType.LYRICS,
      title: `ESTROFA ${index + 1}`,
      lines: stanza.split('\n').filter(line => line.trim() !== ''),
      backgroundImage: hymn.backgrounds.lyrics,
    });
    if (hymn.chorus) {
      slides.push({
        type: SlideType.LYRICS,
        title: 'CORO',
        lines: hymn.chorus.split('\n').filter(line => line.trim() !== ''),
        backgroundImage: hymn.backgrounds.lyrics,
      });
    }
  });

  return slides;
};

const createPptx = async (hymn: Hymn, slides: Slide[], styles: StyleOptions) => {
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  pptx.defineSlideMaster({ title: 'COVER_MASTER', background: { data: hymn.backgrounds.cover } });
  pptx.defineSlideMaster({ title: 'TITLE_MASTER', background: { data: hymn.backgrounds.title } });
  pptx.defineSlideMaster({ title: 'LYRICS_MASTER', background: { data: hymn.backgrounds.lyrics } });

  slides.forEach((slideData, index) => {
    let masterName = '';
    switch (slideData.type) {
      case SlideType.COVER: masterName = 'COVER_MASTER'; break;
      case SlideType.TITLE: masterName = 'TITLE_MASTER'; break;
      case SlideType.LYRICS: masterName = 'LYRICS_MASTER'; break;
    }
    
    const slide = pptx.addSlide({ masterName });

    if (slideData.type !== SlideType.COVER) {
       slide.addText(`${index}/${slides.length - 1}`, { 
         x: '88%', y: '4%', w: '10%', h: '8%', 
         fontFace: styles.slideNumber.fontFace, 
         fontSize: styles.slideNumber.fontSize, 
         color: styles.slideNumber.color.replace('#', ''), 
         align: 'right' 
       });
    }

    const isTitleSlide = slideData.type === SlideType.TITLE;
    
    if (slideData.title) {
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

    if (slideData.lines.length > 0) {
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

  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [selectedHymnId, setSelectedHymnId] = useState<string | null>(null);
  const [editingHymn, setEditingHymn] = useState<Hymn | null | 'new'>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [styleOptions, setStyleOptions] = useState<StyleOptions>(defaultStyles);
  const [isStyleEditorCollapsed, setIsStyleEditorCollapsed] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const savedHymns = localStorage.getItem('hymn-library');
      if (savedHymns) {
        const parsedHymns = JSON.parse(savedHymns);
        setHymns(parsedHymns);
        if (parsedHymns.length > 0) {
          setSelectedHymnId(parsedHymns[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load hymns from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('hymn-library', JSON.stringify(hymns));
    } catch (error) {
      console.error("Failed to save hymns to localStorage", error);
    }
  }, [hymns]);
  
  const selectedHymn = useMemo(() => hymns.find(h => h.id === selectedHymnId), [hymns, selectedHymnId]);
  const slides = useMemo(() => selectedHymn ? generateSlidesFromHymn(selectedHymn) : [], [selectedHymn]);

  useEffect(() => {
    localStorage.setItem('hymn-app-theme', theme);
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);
  
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [selectedHymnId]);
  
  const safeSlideIndex = Math.min(currentSlideIndex, slides.length > 0 ? slides.length - 1 : 0);

  const handleGenerateClick = async () => {
    if(!selectedHymn) {
        alert("Please select a hymn to generate a presentation.");
        return;
    }
    setIsGenerating(true);
    try {
        await createPptx(selectedHymn, slides, styleOptions);
    } catch (error) {
        console.error("Failed to generate PPTX:", error);
        alert("An error occurred while generating the presentation. Please check the console for details.");
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleSaveHymn = (hymnToSave: Hymn) => {
    const existingIndex = hymns.findIndex(h => h.id === hymnToSave.id);
    if (existingIndex > -1) {
      const updatedHymns = [...hymns];
      updatedHymns[existingIndex] = hymnToSave;
      setHymns(updatedHymns);
    } else {
      setHymns(prev => [...prev, hymnToSave]);
      setSelectedHymnId(hymnToSave.id);
    }
    setEditingHymn(null);
  };

  const handleDeleteHymn = (hymnId: string) => {
    if (window.confirm("Are you sure you want to delete this hymn?")) {
      setHymns(prev => prev.filter(h => h.id !== hymnId));
      if (selectedHymnId === hymnId) {
        setSelectedHymnId(hymns.length > 1 ? hymns[0].id : null);
      }
    }
  };

  const handlePrev = () => setCurrentSlideIndex(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentSlideIndex(prev => Math.min(slides.length - 1, prev + 1));

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-8 px-4">
          <svg className="w-8 h-8 text-[var(--primary)]" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
        <h1 className="text-xl font-bold text-[var(--sidebar-foreground)]">Hymn Generator</h1>
      </div>

      <div className="px-4 mb-4">
        <button
            onClick={handleGenerateClick}
            disabled={isGenerating || !selectedHymn}
            className="w-full px-4 py-3 flex items-center justify-center gap-2 text-base font-semibold bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {isGenerating ? 'Generating...' : 'Generate PPTX'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-2">
         <HymnList 
            hymns={hymns}
            selectedHymnId={selectedHymnId}
            onSelectHymn={setSelectedHymnId}
            onAddHymn={() => setEditingHymn('new')}
            onEditHymn={(hymn) => setEditingHymn(hymn)}
            onDeleteHymn={handleDeleteHymn}
         />
         <div className="h-full flex flex-col bg-[var(--sidebar-accent)]/50" style={{ borderRadius: 'var(--radius-lg)' }}>
            <StyleEditor 
                options={styleOptions} 
                setOptions={setStyleOptions}
                isCollapsed={isStyleEditorCollapsed}
                onToggleCollapse={() => setIsStyleEditorCollapsed(prev => !prev)}
            />
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
                  <svg xmlns="http://www.w.org/2000/svg" className={`h-5 w-5 ${theme === 'dark' ? 'text-yellow-300' : 'text-[var(--muted-foreground)]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
            </div>
        </div>
    </>
  );

  return (
    <div className="min-h-screen font-sans bg-[var(--background)] text-[var(--foreground)]">
      {editingHymn && (
        <HymnEditorModal
            hymnToEdit={editingHymn === 'new' ? null : editingHymn}
            onSave={handleSaveHymn}
            onClose={() => setEditingHymn(null)}
        />
      )}
      <div className="flex h-screen">
        <div 
          className={`fixed inset-0 z-20 bg-black/30 md:hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setIsSidebarOpen(false)}
        ></div>

        <aside className={`fixed top-0 left-0 h-full w-80 flex flex-col pt-6 bg-[var(--sidebar)] text-[var(--sidebar-foreground)] border-r border-[var(--sidebar-border)] z-30
                           md:relative md:w-80 md:translate-x-0
                           transition-transform duration-300 ease-in-out
                           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <SidebarContent />
        </aside>

        <main className="flex-1 flex flex-col overflow-y-auto">
          <header className={`sticky top-0 z-10 p-4 flex items-center justify-between md:justify-end bg-[var(--background)]/80 backdrop-blur-sm border-b border-[var(--border)]`}>
             <button className="md:hidden text-[var(--muted-foreground)]" onClick={() => setIsSidebarOpen(true)}>
                <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
             </button>
             <h2 className="text-xl font-semibold text-[var(--foreground)]">Live Preview</h2>
          </header>

          <div className="flex-1 p-4 md:p-6 flex items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center">
              {selectedHymn && slides.length > 0 ? (
                <>
                  <HymnSlide 
                    slide={slides[safeSlideIndex]}
                    currentSlideIndex={safeSlideIndex}
                    totalSlides={slides.length}
                    theme={theme}
                    styleOptions={styleOptions}
                  />
                  <div className="mt-6 w-full max-w-5xl">
                    <Navigation 
                      onPrev={handlePrev} 
                      onNext={handleNext}
                      currentIndex={safeSlideIndex}
                      totalSlides={slides.length}
                    />
                  </div>
                </>
              ) : (
                 <div className="text-center text-[var(--muted-foreground)]">
                    <h3 className="text-xl font-semibold mb-2">No Hymn Selected</h3>
                    <p>Add a hymn to your library to get started.</p>
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