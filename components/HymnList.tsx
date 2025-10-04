import React from 'react';
import { Hymn } from '../types';

interface HymnListProps {
  hymns: Hymn[];
  selectedHymnId: string | null;
  onSelectHymn: (id: string) => void;
  onAddHymn: () => void;
  onEditHymn: (hymn: Hymn) => void;
  onDeleteHymn: (id: string) => void;
}

const HymnList: React.FC<HymnListProps> = ({ hymns, selectedHymnId, onSelectHymn, onAddHymn, onEditHymn, onDeleteHymn }) => {
  return (
    <div className="h-full flex flex-col bg-[var(--sidebar-accent)]/50 p-2" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-[var(--sidebar-foreground)]">Hymn Library</h2>
        <button onClick={onAddHymn} title="Add new hymn" className="p-1.5 hover:bg-[var(--sidebar-accent)]" style={{ borderRadius: '9999px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--sidebar-accent-foreground)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {hymns.length === 0 && (
          <p className="text-sm text-center py-4 text-[var(--muted-foreground)]">Your library is empty. Add a hymn to get started.</p>
        )}
        {hymns.map(hymn => (
          <div
            key={hymn.id}
            onClick={() => onSelectHymn(hymn.id)}
            className={`group flex items-center justify-between p-2 cursor-pointer transition-colors ${
              selectedHymnId === hymn.id ? 'bg-[var(--sidebar-primary)] text-[var(--sidebar-primary-foreground)]' : 'hover:bg-[var(--sidebar-accent)]'
            }`}
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <div className="truncate">
              <p className="font-semibold text-sm">{hymn.title}</p>
              <p className={`text-xs ${selectedHymnId === hymn.id ? 'text-[var(--sidebar-primary-foreground)]/80' : 'text-[var(--muted-foreground)]'}`}>
                #{hymn.number}
              </p>
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button 
                  onClick={(e) => { e.stopPropagation(); onEditHymn(hymn); }} 
                  className={`p-1.5 hover:bg-black/10`}
                  style={{ borderRadius: '9999px' }}
                  title="Edit hymn"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" />
                 </svg>
               </button>
               <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteHymn(hymn.id); }} 
                  className={`p-1.5 hover:bg-black/10`}
                  style={{ borderRadius: '9999px' }}
                  title="Delete hymn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HymnList;
