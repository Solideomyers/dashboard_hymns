import React, { useState, useEffect } from 'react';
import { Hymn } from '../types';

interface HymnEditorModalProps {
  hymnToEdit: Hymn | null;
  onSave: (hymn: Hymn) => void;
  onClose: () => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

const ImageInput: React.FC<{ label: string; currentImage: string; onImageChange: (base64: string) => void; }> = ({ label, currentImage, onImageChange }) => {
    const inputId = `image-input-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileChange = async (file: File | undefined) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await fileToBase64(file);
                onImageChange(base64);
            } catch (error) {
                console.error("Error converting file to base64", error);
                alert("Could not load image file.");
            }
        } else if (file) {
            alert("Please use an image file (e.g., PNG, JPG).");
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFileChange(e.target.files?.[0]);
    };

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation(); // Necessary to allow drop
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        handleFileChange(e.dataTransfer.files?.[0]);
    };
    
    return (
        <div>
            <label htmlFor={inputId} className="block text-sm font-medium mb-2 text-[var(--foreground)]">{label}</label>
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`relative p-3 border-2 border-dashed transition-colors duration-200 ${isDraggingOver ? 'border-[var(--primary)] bg-[var(--primary)]/10' : 'border-[var(--border)]'}`}
                style={{ borderRadius: 'var(--radius-lg)' }}
            >
                {isDraggingOver && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm" style={{ borderRadius: 'var(--radius-lg)' }}>
                        <p className="font-semibold text-[var(--primary)]">Drop image here</p>
                    </div>
                )}
                <div className="flex items-center gap-4">
                    <img src={currentImage || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'} alt={`${label} preview`} className="w-16 h-9 object-cover bg-[var(--muted)]" style={{ borderRadius: 'var(--radius-sm)' }} />
                    <input id={inputId} type="file" accept="image/*" onChange={handleInputChange} className="text-sm text-[var(--muted-foreground)] file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-[var(--primary-foreground)] hover:file:opacity-90" style={{ borderRadius: 'var(--radius-md)'}} />
                </div>
            </div>
        </div>
    );
};

const HymnEditorModal: React.FC<HymnEditorModalProps> = ({ hymnToEdit, onSave, onClose }) => {
  const [hymn, setHymn] = useState<Omit<Hymn, 'id'>>({
    title: '', number: '', stanzas: [''], chorus: '',
    backgrounds: { cover: '', title: '', lyrics: '' }
  });

  useEffect(() => {
    if (hymnToEdit) {
      setHymn(hymnToEdit);
    }
  }, [hymnToEdit]);

  const handleStanzaChange = (index: number, value: string) => {
    const newStanzas = [...hymn.stanzas];
    newStanzas[index] = value;
    setHymn(prev => ({ ...prev, stanzas: newStanzas }));
  };

  const addStanza = () => setHymn(prev => ({ ...prev, stanzas: [...prev.stanzas, ''] }));
  
  const removeStanza = (index: number) => {
    if (hymn.stanzas.length > 1) {
      setHymn(prev => ({ ...prev, stanzas: prev.stanzas.filter((_, i) => i !== index) }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hymn.title || !hymn.number || hymn.stanzas.every(s => s.trim() === '')) {
        alert("Please fill in the title, number, and at least one stanza.");
        return;
    }
    const finalHymn: Hymn = {
        id: hymnToEdit?.id || `hymn-${Date.now()}`,
        ...hymn
    };
    onSave(finalHymn);
  };

  const inputClass = "w-full p-2 border bg-[var(--input)] text-[var(--foreground)] text-base transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[var(--card)] w-full max-w-4xl max-h-[90vh] flex flex-col" 
        style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)' }}
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--card-foreground)]">{hymnToEdit ? 'Edit Hymn' : 'Add New Hymn'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--accent)]" style={{ borderRadius: '9999px' }}>
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[var(--muted-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </header>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Hymn Title</label>
                    <input type="text" value={hymn.title} onChange={e => setHymn(p => ({...p, title: e.target.value}))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Hymn Number</label>
                    <input type="text" value={hymn.number} onChange={e => setHymn(p => ({...p, number: e.target.value}))} className={inputClass} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} required />
                </div>
            </div>

            <fieldset className="border p-4 space-y-2" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <legend className="px-2 text-sm font-semibold">Background Images</legend>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ImageInput label="Cover Image" currentImage={hymn.backgrounds.cover} onImageChange={b64 => setHymn(p => ({...p, backgrounds: {...p.backgrounds, cover: b64}}))} />
                <ImageInput label="Title Image" currentImage={hymn.backgrounds.title} onImageChange={b64 => setHymn(p => ({...p, backgrounds: {...p.backgrounds, title: b64}}))} />
                <ImageInput label="Lyrics Image" currentImage={hymn.backgrounds.lyrics} onImageChange={b64 => setHymn(p => ({...p, backgrounds: {...p.backgrounds, lyrics: b64}}))} />
              </div>
            </fieldset>

            <div>
              <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Chorus</label>
              <textarea value={hymn.chorus} onChange={e => setHymn(p => ({...p, chorus: e.target.value}))} className={`${inputClass} min-h-[100px] resize-y`} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
            </div>

            <div>
              <h3 className="text-base font-semibold mb-2 text-[var(--foreground)]">Stanzas</h3>
              <div className="space-y-4">
                {hymn.stanzas.map((stanza, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <textarea value={stanza} onChange={e => handleStanzaChange(index, e.target.value)} className={`${inputClass} min-h-[120px] resize-y`} style={{ borderRadius: 'var(--radius-md)', borderColor: 'var(--input)' }} />
                    <button type="button" onClick={() => removeStanza(index)} disabled={hymn.stanzas.length <= 1} className="p-2 mt-2 text-[var(--muted-foreground)] hover:text-[var(--destructive)] disabled:opacity-50">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addStanza} className="text-sm font-semibold text-[var(--primary)] hover:opacity-80">+ Add Stanza</button>
              </div>
            </div>
        </form>

        <footer className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-[var(--border)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90" style={{ borderRadius: 'var(--radius-md)' }}>Cancel</button>
            <button type="submit" onClick={handleSave} className="px-4 py-2 border border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 font-semibold" style={{ borderRadius: 'var(--radius-md)' }}>Save Hymn</button>
        </footer>
      </div>
    </div>
  );
};

export default HymnEditorModal;