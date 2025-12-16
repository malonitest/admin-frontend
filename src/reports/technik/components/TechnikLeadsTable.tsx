/**
 * Leads Table for Funnel Technik Report
 * No Czech diacritics - ASCII only
 */

import React, { useState } from 'react';
import { IFunnelTechnikLeadItem } from '../../../types/reporting';
import {
  formatCzk,
  formatDate,
  maskVin,
  formatPhone,
  formatCarName,
  getSLAColor
} from '../utils/formatters';
import { getLastNote } from '../utils/calculations';

interface Props {
  leads: IFunnelTechnikLeadItem[];
}

interface NotesModalProps {
  lead: IFunnelTechnikLeadItem;
  onClose: () => void;
}

const NotesModal: React.FC<NotesModalProps> = ({ lead, onClose }) => {
  if (!lead.notes || lead.notes.length === 0) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">
              Poznamky - {lead.customerName} (#{lead.uniqueId})
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          <p className="text-gray-500">Zadne poznamky</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">
            Poznamky - {lead.customerName} (#{lead.uniqueId})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>
        <div className="space-y-4">
          {lead.notes.map((note, index) => (
            <div key={index} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded">
              <p className="text-gray-800 mb-2">{note.text}</p>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{note.author}</span>
                {' • '}
                <span>{formatDate(note.date)}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Zavrit
        </button>
      </div>
    </div>
  );
};

const TechnikLeadsTable: React.FC<Props> = ({ leads }) => {
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [notesModalLead, setNotesModalLead] = useState<IFunnelTechnikLeadItem | null>(null);

  const toggleExpand = (leadId: string) => {
    setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
  };

  const handleUniqueIdClick = (lead: IFunnelTechnikLeadItem) => {
    // Navigate to lead detail page
    window.location.href = `/leads/${lead.leadId}`;
  };

  const handleNotesClick = (lead: IFunnelTechnikLeadItem) => {
    setNotesModalLead(lead);
  };

  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Detailni seznam leadu</h3>
        <p className="text-gray-500">Nejsou k dispozici zadne leady</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Detailni seznam leadu</h3>
          <span className="text-sm text-gray-600">
            Celkem: {leads.length} leadu
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  UniqueID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Zakaznik
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Telefon
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Auto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  VIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Castka
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Datum predani
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dny
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Poznamky
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Akce
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.map((lead, index) => {
                const isExpanded = expandedLeadId === lead.leadId;
                const lastNote = getLastNote(lead.notes);
                const notesCount = lead.notes?.length || 0;

                return (
                  <React.Fragment key={index}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleUniqueIdClick(lead)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{lead.uniqueId}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {lead.customerName || 'Neuvedeno'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatPhone(lead.customerPhone)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {formatCarName(lead.carBrand, lead.carModel)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-600">
                          {maskVin(lead.carVIN)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCzk(lead.requestedAmount)}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(lead.handedToTechnicianDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {lead.currentStatusLabel || lead.currentStatus}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            getSLAColor(lead.daysInTechnicianReview || 0) === 'red'
                              ? 'bg-red-100 text-red-800'
                              : getSLAColor(lead.daysInTechnicianReview || 0) === 'orange'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {lead.daysInTechnicianReview || 0}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleNotesClick(lead)}
                          className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                            notesCount > 0
                              ? 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
                              : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          ?? {notesCount}
                        </button>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => toggleExpand(lead.leadId)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {isExpanded ? '? Skryt' : '? Detail'}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={11} className="px-4 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Zakladni informace
                              </h4>
                              <dl className="space-y-2">
                                <div>
                                  <dt className="text-xs text-gray-500">Lead ID:</dt>
                                  <dd className="text-sm text-gray-900">{lead.leadId}</dd>
                                </div>
                                <div>
                                  <dt className="text-xs text-gray-500">UniqueID:</dt>
                                  <dd className="text-sm text-gray-900">#{lead.uniqueId}</dd>
                                </div>
                                {lead.declinedReasonLabel && (
                                  <div>
                                    <dt className="text-xs text-gray-500">Duvod zamitnuti:</dt>
                                    <dd className="text-sm text-red-600 font-medium">
                                      {lead.declinedReasonLabel}
                                    </dd>
                                  </div>
                                )}
                              </dl>
                            </div>

                            {/* Right Column - Last Note */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                Posledni poznamka
                              </h4>
                              {lastNote ? (
                                <div className="bg-white rounded p-3 border border-gray-200">
                                  <p className="text-sm text-gray-900 mb-2">
                                    {lastNote.text}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span>{lastNote.author}</span>
                                    <span>{formatDate(lastNote.date)}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Zadne poznamky</p>
                              )}

                              {/* Button to open notes modal */}
                              {notesCount > 0 && (
                                <button
                                  onClick={() => handleNotesClick(lead)}
                                  className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                  Zobrazit vsechny poznamky ({notesCount})
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes Modal */}
      {notesModalLead && (
        <NotesModal
          lead={notesModalLead}
          onClose={() => setNotesModalLead(null)}
        />
      )}
    </>
  );
};

export default TechnikLeadsTable;
