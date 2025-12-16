/**
 * Main Funnel Technik Report Component
 * No Czech diacritics - ASCII only
 */

import React, { useState, useMemo } from 'react';
import { IFunnelTechnikReportData } from '../../../types/reporting';
import { formatDate, formatDateTime } from '../utils/formatters';
import {
  filterLeads,
  filterLeadsByStatus,
  filterLeadsByDeclinedReason,
  sortLeads,
  computeStatusBreakdown,
  computeDeclinedReasons
} from '../utils/calculations';
import { downloadJson, downloadCsv, downloadSummary, copySummaryToClipboard } from '../utils/exports';

import TechnikKPICards from './TechnikKPICards';
import TechnikStatusBreakdown from './TechnikStatusBreakdown';
import TechnikDeclinedReasons from './TechnikDeclinedReasons';
import TechnikSLAWarnings from './TechnikSLAWarnings';
import TechnikFilters from './TechnikFilters';
import TechnikLeadsTable from './TechnikLeadsTable';

interface Props {
  data: IFunnelTechnikReportData;
}

const TechnikReport: React.FC<Props> = ({ data }) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDeclinedReason, setSelectedDeclinedReason] = useState<string | null>(null);

  // Compute filter options
  const statusOptions = useMemo(() => {
    const breakdown = data.statusBreakdown || computeStatusBreakdown(data.leads);
    return breakdown.map(item => item.status);
  }, [data.statusBreakdown, data.leads]);

  const declinedReasonOptions = useMemo(() => {
    const reasons = data.declinedReasons || computeDeclinedReasons(data.leads);
    return reasons.map(item => item.reason);
  }, [data.declinedReasons, data.leads]);

  // Apply filters and sorting
  const filteredLeads = useMemo(() => {
    let filtered = [...data.leads];

    // Apply search filter
    if (searchQuery) {
      filtered = filterLeads(filtered, searchQuery);
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filterLeadsByStatus(filtered, selectedStatus);
    }

    // Apply declined reason filter
    if (selectedDeclinedReason) {
      filtered = filterLeadsByDeclinedReason(filtered, selectedDeclinedReason);
    }

    // Sort
    return sortLeads(filtered);
  }, [data.leads, searchQuery, selectedStatus, selectedDeclinedReason]);

  // Export handlers
  const handleExportJson = () => {
    downloadJson(data);
  };

  const handleExportCsv = () => {
    downloadCsv(data);
  };

  const handleExportSummary = () => {
    downloadSummary(data);
  };

  const handleCopySummary = async () => {
    try {
      await copySummaryToClipboard(data);
      alert('Souhrn zkopirovan do schranky!');
    } catch (error) {
      alert('Chyba pri kopirovani do schranky');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Report kontroly technika
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Obdobi: {formatDate(data.dateFrom)} - {formatDate(data.dateTo)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Datum generovani: {formatDateTime(new Date())}
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              title="Kopirovat souhrn"
            >
              ?? Kopirovat
            </button>
            <button
              onClick={handleExportSummary}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors"
              title="Stahnout souhrn (TXT)"
            >
              ?? TXT
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors"
              title="Stahnout CSV"
            >
              ?? CSV
            </button>
            <button
              onClick={handleExportJson}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm font-medium transition-colors"
              title="Stahnout JSON"
            >
              ?? JSON
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <div className="text-xs text-gray-500">Celkem predano</div>
            <div className="text-lg font-bold text-gray-900">
              {data.stats.totalHandedToTechnician}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Schvaleno</div>
            <div className="text-lg font-bold text-green-600">
              {data.stats.approved}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Zamitnuto</div>
            <div className="text-lg font-bold text-red-600">
              {data.stats.rejected}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">V kontrole</div>
            <div className="text-lg font-bold text-orange-600">
              {data.stats.inProgress}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <TechnikKPICards stats={data.stats} />

      {/* SLA Warnings */}
      <TechnikSLAWarnings leads={data.leads} thresholds={[3, 7]} />

      {/* Status Breakdown */}
      <TechnikStatusBreakdown
        statusBreakdown={data.statusBreakdown}
        leads={data.leads}
      />

      {/* Declined Reasons */}
      <TechnikDeclinedReasons
        declinedReasons={data.declinedReasons}
        leads={data.leads}
      />

      {/* Filters */}
      <TechnikFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedDeclinedReason={selectedDeclinedReason}
        onDeclinedReasonChange={setSelectedDeclinedReason}
        statusOptions={statusOptions}
        declinedReasonOptions={declinedReasonOptions}
      />

      {/* Filtered Results Info */}
      {(searchQuery || selectedStatus || selectedDeclinedReason) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800">
              Zobrazeno <strong>{filteredLeads.length}</strong> z{' '}
              <strong>{data.leads.length}</strong> leadu
            </div>
            {filteredLeads.length === 0 && (
              <div className="text-sm text-blue-600">
                Zadne leady neodpovidaji filtrum
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leads Table */}
      <TechnikLeadsTable leads={filteredLeads} />
    </div>
  );
};

export default TechnikReport;
