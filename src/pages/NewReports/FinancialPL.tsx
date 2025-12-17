/**
 * Financial P/L Report Integration Page
 * Fetches data from API and displays CFO P/L Report
 * No Czech diacritics allowed
 */

import React, { useState, useEffect } from 'react';
import axiosClient from '../../api/axiosClient';
import { CfoPLReportPage } from '../../reports/finance-pl';
import type { IFinancialReportData } from '../../reports/finance-pl';

const Financial: React.FC = () => {
  const [data, setData] = useState<IFinancialReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [period, setPeriod] = useState<string>('year');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axiosClient.get('/v1/stats/financial-report', {
        params: { period }
      });
      
      setData(response.data);
    } catch (err) {
      console.error('Error fetching financial report:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  return (
    <div className="financial-report-page">
      {/* Period Selector */}
      <div className="period-selector no-print">
        <label htmlFor="period-select">Obdobi:</label>
        <select 
          id="period-select"
          value={period} 
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            marginLeft: '0.5rem',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        >
          <option value="month">Tento mesic</option>
          <option value="year">Tento rok</option>
          <option value="all">Vse</option>
        </select>
      </div>
      
      {/* CFO P/L Report */}
      <CfoPLReportPage
        data={data}
        loading={loading}
        error={error}
        onRefresh={fetchData}
      />
    </div>
  );
};

export default Financial;
