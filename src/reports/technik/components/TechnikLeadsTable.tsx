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

const TechnikLeadsTable: React.FC<Props> = ({ leads }) => {
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  const toggleExpand = (leadId: string) => {
    setExpandedLeadId(expandedLeadId === leadId ? null : leadId);
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
                Akce
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.map((lead, index) => {
              const isExpanded = expandedLeadId === lead.leadId;
              const lastNote = getLastNote(lead.notes);

              return (
                <React.Fragment key={index}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        #{lead.uniqueId}
                      </div>
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
                      <td colSpan={10} className="px-4 py-4 bg-gray-50">
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

                            {/* All Notes */}
                            {lead.notes && lead.notes.length > 1 && (
                              <details className="mt-3">
                                <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800">
                                  Zobrazit vsechny poznamky ({lead.notes.length})
                                </summary>
                                <div className="mt-2 space-y-2">
                                  {lead.notes.map((note, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white rounded p-2 border border-gray-200 text-sm"
                                    >
                                      <p className="text-gray-900 mb-1">{note.text}</p>
                                      <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span>{note.author}</span>
                                        <span>{formatDate(note.date)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </details>
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
  );
};

export default TechnikLeadsTable;
