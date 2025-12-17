/**
 * Notes Section Component
 * Poznamky z leadu s insights
 * Bez cestiny diakritiky
 */

import type { IFunnelStageData } from '@/types/reporting';
import { getLatestNotes, formatDateTime, identifyBlockersFromNotes } from '../utils/formatters.js';

interface NotesSectionProps {
  stages: IFunnelStageData[];
}

export function NotesSection({ stages }: NotesSectionProps) {
  // Sbíráme notes ze všech stages
  const allNotes = stages.flatMap(stage => {
    const notes = getLatestNotes(stage.notes, 3);
    return notes.map(note => ({ ...note, stage: stage.stage }));
  });

  const blockers = identifyBlockersFromNotes(
    stages.flatMap(s => s.notes || [])
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Poznamky a Insights</h2>

      {/* Sample insights */}
      {blockers.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">?? Automaticky identifikovane blokery:</h3>
          <ul className="list-disc list-inside space-y-1">
            {blockers.map((blocker, index) => (
              <li key={index} className="text-sm text-blue-800">{blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Poznámky podle stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stages
          .filter(stage => stage.notes && stage.notes.length > 0)
          .map((stage, index) => (
            <StageNotesCard key={index} stage={stage} />
          ))}
      </div>

      {allNotes.length === 0 && (
        <p className="text-gray-500 text-center italic">Zadne poznamky nejsou k dispozici</p>
      )}
    </div>
  );
}

interface StageNotesCardProps {
  stage: IFunnelStageData;
}

function StageNotesCard({ stage }: StageNotesCardProps) {
  const latestNotes = getLatestNotes(stage.notes, 3);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-lg text-gray-900 mb-3">{stage.stage}</h3>
      
      <div className="space-y-3">
        {latestNotes.map((note, index) => (
          <div key={index} className="border-l-2 border-gray-300 pl-3 py-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">{note.author}</span>
              <span className="text-xs text-gray-500">{formatDateTime(note.date)}</span>
            </div>
            <p className="text-sm text-gray-700">{note.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
