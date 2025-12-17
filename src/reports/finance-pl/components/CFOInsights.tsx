/**
 * CFO Insights Generator Component
 * Automatically generates insights and recommendations
 * No Czech diacritics allowed
 */

import React from 'react';
import { IFinancialReportData, ICFOInsight } from '../types';
import { topN, calcMoM } from '../utils/calculations';
import { formatCzk, formatPercent } from '../utils/formatters';

interface CFOInsightsProps {
  data: IFinancialReportData;
}

export const CFOInsights: React.FC<CFOInsightsProps> = ({ data }) => {
  const insights = generateInsights(data);
  
  if (insights.length === 0) {
    return null;
  }
  
  // Group by category
  const revenueInsights = insights.filter(i => i.category === 'revenue');
  const costsInsights = insights.filter(i => i.category === 'costs');
  const profitInsights = insights.filter(i => i.category === 'profit');
  const operationsInsights = insights.filter(i => i.category === 'operations');
  const recommendations = insights.filter(i => i.category === 'recommendations');
  
  return (
    <div className="cfo-insights-section page-break">
      <h2 className="section-title">CFO Insights &amp; Recommendations</h2>
      
      {revenueInsights.length > 0 && (
        <div className="insights-group">
          <h3>Prijmy</h3>
          <ul className="insights-list">
            {revenueInsights.map((insight, index) => (
              <li key={index} className={`insight-item ${insight.priority}`}>
                <span className="insight-icon">
                  {insight.priority === 'high' ? '??' : insight.priority === 'medium' ? '??' : '??'}
                </span>
                <span className="insight-text">{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {costsInsights.length > 0 && (
        <div className="insights-group">
          <h3>Naklady</h3>
          <ul className="insights-list">
            {costsInsights.map((insight, index) => (
              <li key={index} className={`insight-item ${insight.priority}`}>
                <span className="insight-icon">
                  {insight.priority === 'high' ? '??' : insight.priority === 'medium' ? '??' : '??'}
                </span>
                <span className="insight-text">{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {profitInsights.length > 0 && (
        <div className="insights-group">
          <h3>Ziskovost</h3>
          <ul className="insights-list">
            {profitInsights.map((insight, index) => (
              <li key={index} className={`insight-item ${insight.priority}`}>
                <span className="insight-icon">
                  {insight.priority === 'high' ? '??' : insight.priority === 'medium' ? '??' : '??'}
                </span>
                <span className="insight-text">{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {operationsInsights.length > 0 && (
        <div className="insights-group">
          <h3>Operace</h3>
          <ul className="insights-list">
            {operationsInsights.map((insight, index) => (
              <li key={index} className={`insight-item ${insight.priority}`}>
                <span className="insight-icon">
                  {insight.priority === 'high' ? '??' : insight.priority === 'medium' ? '??' : '??'}
                </span>
                <span className="insight-text">{insight.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {recommendations.length > 0 && (
        <div className="insights-group recommendations">
          <h3>Doporuceni na dalsi mesic - Top 3 priority</h3>
          <ol className="recommendations-list">
            {recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className={`recommendation-item ${rec.priority}`}>
                <strong>Priorita {index + 1}:</strong> {rec.message}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

/**
 * Generate insights from financial data
 */
const generateInsights = (data: IFinancialReportData): ICFOInsight[] => {
  const insights: ICFOInsight[] = [];
  const { stats, monthlyData, revenueByType, costsByType } = data;
  
  if (!stats || !Array.isArray(monthlyData)) {
    return insights;
  }
  
  // Top revenue drivers
  if (Array.isArray(revenueByType) && revenueByType.length > 0) {
    const topRevenue = topN(revenueByType, r => r.amount, 1)[0];
    if (topRevenue) {
      insights.push({
        category: 'revenue',
        priority: 'medium',
        message: `Hlavni zdroj prijmu: ${topRevenue.type} (${formatCzk(topRevenue.amount)}, ${formatPercent(topRevenue.percentage)})`
      });
    }
  }
  
  // Top cost drivers
  if (Array.isArray(costsByType) && costsByType.length > 0) {
    const topCost = topN(costsByType, c => c.amount, 1)[0];
    if (topCost) {
      insights.push({
        category: 'costs',
        priority: 'medium',
        message: `Hlavni nakladova polozka: ${topCost.type} (${formatCzk(topCost.amount)}, ${formatPercent(topCost.percentage)})`
      });
    }
  }
  
  // Negative profit months
  const negativeMonths = monthlyData.filter(m => m.netProfit < 0);
  if (negativeMonths.length > 0) {
    const worstMonth = negativeMonths.reduce((min, m) => 
      m.netProfit < min.netProfit ? m : min
    );
    
    const reason = worstMonth.carPurchases > worstMonth.totalRevenue * 1.5
      ? 'vysoke naklady na odkup aut'
      : worstMonth.totalRevenue < stats.averageMonthlyRevenue * 0.7
      ? 'nizke prijmy'
      : 'kombinace nizkych prijmu a vysokych nakladu';
    
    insights.push({
      category: 'profit',
      priority: 'high',
      message: `Negativni zisk v ${negativeMonths.length} mesicich. Nejhorsi: ${worstMonth.monthLabel} (${formatCzk(worstMonth.netProfit)}) - duvod: ${reason}`
    });
  }
  
  // Payment success rate declining
  if (monthlyData.length >= 2) {
    const recent = monthlyData.slice(-2);
    if (recent.length === 2) {
      const change = calcMoM(recent[1].paymentSuccessRate, recent[0].paymentSuccessRate);
      if (change.pct !== null && change.pct < -5) {
        insights.push({
          category: 'operations',
          priority: 'high',
          message: `Uspesnost plateb klesla o ${Math.abs(change.pct).toFixed(1)}%. Doporuceni: zintenzivnit upominky a zvazit automatizaci inkasa`
        });
        
        insights.push({
          category: 'recommendations',
          priority: 'high',
          message: 'Implementovat automatizovane upominky a zlepšit proces inkasa'
        });
      }
    }
  }
  
  // Car purchases growing significantly
  if (monthlyData.length >= 3) {
    const recent3 = monthlyData.slice(-3);
    const avgCarPurchases = recent3.reduce((sum, m) => sum + m.carPurchases, 0) / 3;
    const avgRevenue = recent3.reduce((sum, m) => sum + m.totalRevenue, 0) / 3;
    
    if (avgCarPurchases > avgRevenue * 1.3) {
      insights.push({
        category: 'costs',
        priority: 'high',
        message: `Naklady na odkup aut rostou rychleji nez prijmy (pomer ${(avgCarPurchases / avgRevenue).toFixed(2)}:1). Doporuceni: kontrola ROI a cashflow`
      });
      
      insights.push({
        category: 'recommendations',
        priority: 'high',
        message: 'Provest ROI analyzu odkupu aut a optimalizovat cashflow'
      });
    }
  }
  
  // Positive profit margin
  if (stats.profitMargin > 20) {
    insights.push({
      category: 'profit',
      priority: 'low',
      message: `Silna ziskova marze ${formatPercent(stats.profitMargin)} - vynikajici vysledek`
    });
  } else if (stats.profitMargin > 0) {
    insights.push({
      category: 'profit',
      priority: 'medium',
      message: `Ziskova marze ${formatPercent(stats.profitMargin)} - prostor pro zlepseni`
    });
    
    insights.push({
      category: 'recommendations',
      priority: 'medium',
      message: 'Analyzovat moznosti snizeni nakladu nebo zvyseni cen'
    });
  }
  
  // Active leases health
  if (stats.activeLeases < 50) {
    insights.push({
      category: 'operations',
      priority: 'high',
      message: `Nizky pocet aktivnich leasingu (${stats.activeLeases}). Nutna expanze nebo lepsi konverze`
    });
    
    insights.push({
      category: 'recommendations',
      priority: 'high',
      message: 'Zintenzivnit marketing a zlepsit konverzni pomer leadu'
    });
  }
  
  return insights;
};

export default CFOInsights;
