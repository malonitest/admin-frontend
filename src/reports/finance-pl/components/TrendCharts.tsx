/**
 * Trend Charts Component for CFO P/L Report
 * Uses Recharts for visualizations
 * No Czech diacritics allowed
 */

import React from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { IFinancialReportItem } from '../types';
import { formatCzk } from '../utils/formatters';
import { topN } from '../utils/calculations';

interface TrendChartsProps {
  monthlyData: IFinancialReportItem[];
}

export const TrendCharts: React.FC<TrendChartsProps> = ({ monthlyData }) => {
  if (!Array.isArray(monthlyData) || monthlyData.length === 0) {
    return null;
  }

  // Find best and worst months
  const bestMonth = topN(monthlyData, m => m.netProfit, 1)[0];
  const worstMonth = monthlyData.reduce((min, m) => 
    m.netProfit < min.netProfit ? m : min
  , monthlyData[0]);
  
  // Check for significant drops (MoM < -15%)
  const significantDrops: string[] = [];
  for (let i = 1; i < monthlyData.length; i++) {
    const current = monthlyData[i];
    const previous = monthlyData[i - 1];
    
    if (previous && current) {
      const change = ((current.netProfit - previous.netProfit) / Math.abs(previous.netProfit)) * 100;
      if (change < -15) {
        significantDrops.push(current.monthLabel || current.month);
      }
    }
  }

  return (
    <div className="trend-charts-section">
      <h2 className="section-title">Trendy a grafy</h2>
      
      {/* P/L Trend Line Chart */}
      <div className="chart-container">
        <h3 className="chart-title">P/L Statement - Mesicni vyvoj</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="monthLabel" 
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => formatCzk(value)}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              stroke="#27ae60"
              strokeWidth={2}
              name="Prijmy"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="totalCosts"
              stroke="#e74c3c"
              strokeWidth={2}
              name="Naklady"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="netProfit"
              stroke="#3498db"
              strokeWidth={3}
              name="Cisty zisk"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Commentary */}
        <div className="chart-commentary">
          <p>
            <strong>Nejlepsi mesic:</strong> {bestMonth?.monthLabel || bestMonth?.month} 
            ({formatCzk(bestMonth?.netProfit)})
          </p>
          <p>
            <strong>Nejhorsi mesic:</strong> {worstMonth?.monthLabel || worstMonth?.month} 
            ({formatCzk(worstMonth?.netProfit)})
          </p>
          {significantDrops.length > 0 && (
            <p className="warning">
              <strong>?? Vyrazny pokles:</strong> {significantDrops.join(', ')} 
              (MoM &lt; -15%)
            </p>
          )}
        </div>
      </div>
      
      {/* Profit Margin Trend */}
      <div className="chart-container">
        <h3 className="chart-title">Ziskova marze (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="monthLabel"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              tickFormatter={(value) => `${value.toFixed(0)}%`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="profitMargin"
              stroke="#9b59b6"
              strokeWidth={3}
              name="Marze"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Car Purchases Bar Chart */}
      <div className="chart-container">
        <h3 className="chart-title">Odkup aut - mesicni vyvoj</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="monthLabel"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              yAxisId="left"
              orientation="left"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              label={{ value: 'Castka (Kc)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }}
            />
            <YAxis 
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              label={{ value: 'Pocet aut', angle: 90, position: 'insideRight', style: { fontSize: 11 } }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'Pocet aut') return value;
                return formatCzk(value);
              }}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar
              yAxisId="left"
              dataKey="carPurchases"
              fill="#e67e22"
              name="Castka odkupu"
            />
            <Bar
              yAxisId="right"
              dataKey="carPurchasesCount"
              fill="#3498db"
              name="Pocet aut"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Payment Success Rate */}
      <div className="chart-container">
        <h3 className="chart-title">Uspesnost plateb (%)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis 
              dataKey="monthLabel"
              angle={-45}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 11 }}
            />
            <Tooltip 
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="paymentSuccessRate"
              stroke="#27ae60"
              strokeWidth={3}
              name="Uspesnost"
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrendCharts;
