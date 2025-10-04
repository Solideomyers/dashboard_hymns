import React, { useState } from 'react';
import { StyleOptions } from '../types';

interface StyleEditorProps {
    options: StyleOptions;
    setOptions: React.Dispatch<React.SetStateAction<StyleOptions>>;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const FONT_OPTIONS = [
  "Baskerville, 'Goudy Old Style', 'Palatino', 'Book Antiqua', serif",
  'Georgia, serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Verdana, sans-serif',
  "'Times New Roman', Times, serif",
  "'Courier New', Courier, monospace"
];

const AccordionItem: React.FC<{
    title: string;
    id: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    children: React.ReactNode;
}> = ({ title, id, isOpen, onToggle, children }) => {
    const fieldsetClass = `border p-3 transition-all duration-300`;
    const legendClass = `px-2 text-xs font-semibold uppercase text-[var(--muted-foreground)] cursor-pointer w-full`;
    
    return (
        <fieldset className={fieldsetClass} style={{ borderColor: 'var(--sidebar-border)', borderRadius: 'var(--radius-lg)' }}>
            <legend className={legendClass} onClick={() => onToggle(id)}>
                <div className="flex justify-between items-center">
                    <span>{title}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>
            </legend>
            {isOpen && <div className="pt-4 space-y-4">{children}</div>}
        </fieldset>
    );
};


const StyleEditor: React.FC<StyleEditorProps> = ({ options, setOptions, isCollapsed, onToggleCollapse }) => {
    const labelClass = `block text-sm font-medium mb-1 text-[var(--sidebar-foreground)]`;
    const inputClass = `w-full p-2 border bg-[var(--input)] text-[var(--sidebar-foreground)] text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--sidebar-ring)]`;
    const gridClass = 'grid grid-cols-1 gap-4';
    const [openAccordion, setOpenAccordion] = useState<string | null>('mainTitle');

    const handleAccordionToggle = (id: string) => {
        setOpenAccordion(prev => (prev === id ? null : id));
    };
    
    const handleChange = (section: keyof StyleOptions, field: string, value: any) => {
        setOptions(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };
    
    return (
        <div className="h-full flex flex-col">
            <div className={`px-2 flex items-center justify-between`}>
              <h2 className={`text-base font-semibold flex items-center gap-2 text-[var(--sidebar-foreground)]`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Customize Styles
              </h2>
              <button onClick={onToggleCollapse} className={`p-1.5 hover:bg-[var(--sidebar-accent)]`} style={{ borderRadius: '9999px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 text-[var(--sidebar-accent-foreground)] ${isCollapsed ? '' : 'transform rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
              </button>
            </div>
            
            {!isCollapsed && (
                <div className="space-y-4 pt-4 overflow-y-auto">
                    <AccordionItem title="Main Title & Number" id="mainTitle" isOpen={openAccordion === 'mainTitle'} onToggle={handleAccordionToggle}>
                        <div className={gridClass}>
                            <div>
                                <label className={labelClass}>Font</label>
                                <select value={options.hymnTitle.fontFace} onChange={(e) => handleChange('hymnTitle', 'fontFace', e.target.value)} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }}>
                                    {FONT_OPTIONS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0].replace(/'/g, "")}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Size (px)</label>
                                <input type="number" value={options.hymnTitle.fontSize} onChange={(e) => handleChange('hymnTitle', 'fontSize', parseInt(e.target.value))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                            </div>
                            <div>
                                 <label className={labelClass}>Color</label>
                                 <input type="color" value={options.hymnTitle.color} onChange={(e) => handleChange('hymnTitle', 'color', e.target.value)} className={`${inputClass} h-10 p-1`} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                            </div>
                            <div className="flex items-center justify-start pt-1">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={options.hymnTitle.bold} onChange={(e) => handleChange('hymnTitle', 'bold', e.target.checked)} className="h-4 w-4 accent-[var(--sidebar-primary)]" style={{ borderRadius: 'var(--radius-sm)'}} />
                                    <span className={labelClass + ' mb-0'}>Bold</span>
                                </label>
                            </div>
                             <div>
                                <label className={labelClass}>Hymn Number Size (px)</label>
                                <input type="number" value={options.hymnNumber.fontSize} onChange={(e) => handleChange('hymnNumber', 'fontSize', parseInt(e.target.value))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                            </div>
                        </div>
                    </AccordionItem>

                    <AccordionItem title="Lyrics & Sections" id="lyrics" isOpen={openAccordion === 'lyrics'} onToggle={handleAccordionToggle}>
                        <div className="space-y-4">
                            <h4 className={labelClass + ' font-semibold'}>Lyrics</h4>
                            <div className={gridClass}>
                              <div>
                                 <label className={labelClass}>Font</label>
                                 <select value={options.lyrics.fontFace} onChange={(e) => handleChange('lyrics', 'fontFace', e.target.value)} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }}>
                                     {FONT_OPTIONS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0].replace(/'/g, "")}</option>)}
                                 </select>
                              </div>
                              <div>
                                 <label className={labelClass}>Size (px)</label>
                                 <input type="number" value={options.lyrics.fontSize} onChange={(e) => handleChange('lyrics', 'fontSize', parseInt(e.target.value))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                              </div>
                              <div>
                                   <label className={labelClass}>Color</label>
                                   <input type="color" value={options.lyrics.color} onChange={(e) => handleChange('lyrics', 'color', e.target.value)} className={`${inputClass} h-10 p-1`} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                              </div>
                              <div>
                                 <label className={labelClass}>Alignment</label>
                                  <div className="flex bg-[var(--input)] p-1" style={{ borderRadius: 'var(--radius-md)' }}>
                                      {(['left', 'center', 'right'] as const).map(align => (
                                      <button key={align} onClick={() => handleChange('lyrics', 'align', align)} className={`w-full px-2 py-1 text-sm capitalize transition-colors ${options.lyrics.align === align ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)] shadow-sm' : 'hover:bg-[var(--sidebar-accent)]'}`} style={{ borderRadius: 'var(--radius-sm)' }}>
                                        {align}
                                      </button>
                                      ))}
                                  </div>
                              </div>
                            </div>
                        </div>
                        <hr className="border-[var(--sidebar-border)] my-4" />
                        <div className="space-y-4">
                            <h4 className={labelClass + ' font-semibold'}>Section Title</h4>
                            <div className={gridClass}>
                              <div>
                                  <label className={labelClass}>Font</label>
                                  <select value={options.sectionTitle.fontFace} onChange={(e) => handleChange('sectionTitle', 'fontFace', e.target.value)} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }}>
                                      {FONT_OPTIONS.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0].replace(/'/g, "")}</option>)}
                                  </select>
                              </div>
                              <div>
                                 <label className={labelClass}>Size (px)</label>
                                 <input type="number" value={options.sectionTitle.fontSize} onChange={(e) => handleChange('sectionTitle', 'fontSize', parseInt(e.target.value))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                              </div>
                               <div>
                                 <label className={labelClass}>Color</label>
                                 <input type="color" value={options.sectionTitle.color} onChange={(e) => handleChange('sectionTitle', 'color', e.target.value)} className={`${inputClass} h-10 p-1`} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                              </div>
                               <div className="flex items-center justify-start pt-1">
                                  <label className="flex items-center gap-2 cursor-pointer">
                                      <input type="checkbox" checked={options.sectionTitle.underline} onChange={(e) => handleChange('sectionTitle', 'underline', e.target.checked)} className="h-4 w-4 accent-[var(--sidebar-primary)]" style={{ borderRadius: 'var(--radius-sm)' }} />
                                      <span className={labelClass + ' mb-0'}>Underline</span>
                                  </label>
                              </div>
                            </div>
                        </div>
                    </AccordionItem>
                    
                    <AccordionItem title="Other Elements" id="other" isOpen={openAccordion === 'other'} onToggle={handleAccordionToggle}>
                        <div className={gridClass}>
                           <div>
                                <label className={labelClass}>Slide Number Size (px)</label>
                                <input type="number" value={options.slideNumber.fontSize} onChange={(e) => handleChange('slideNumber', 'fontSize', parseInt(e.target.value))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                            </div>
                        </div>
                    </AccordionItem>

                </div>
            )}
        </div>
    );
};

export default StyleEditor;
