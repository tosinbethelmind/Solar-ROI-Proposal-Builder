'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';

interface ROIChartProps {
  systemCost: number;
  monthlyGeneratorCost: number;
  monthlySolarCost: number;
  years?: number;
}

export function ROIChart({
  systemCost,
  monthlyGeneratorCost,
  monthlySolarCost,
  years = 10,
}: ROIChartProps) {
  // Generate data for 10 years
  const data = [];
  let crossoverYear: number | null = null;
  let crossoverMonth: number | null = null;

  for (let year = 0; year <= years; year++) {
    const generatorCumulative = year * 12 * monthlyGeneratorCost;
    const solarCumulative = systemCost + (year * 12 * monthlySolarCost);
    
    data.push({
      year,
      label: `Year ${year}`,
      'Generator Cost': generatorCumulative,
      'Solar Total Cost': solarCumulative,
    });
  }

  // Calculate exact crossover in months
  const monthlySavings = monthlyGeneratorCost - monthlySolarCost;
  if (monthlySavings > 0 && systemCost > 0) {
    const months = systemCost / monthlySavings;
    if (months <= years * 12) {
      crossoverMonth = Math.round(months);
      crossoverYear = parseFloat((months / 12).toFixed(1));
    }
  }

  const annualSavings = monthlySavings * 12;
  const fiveYearSavings = annualSavings * 5;

  const formatNaira = (value: number) =>
    `₦${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  const formatYAxis = (value: number) => {
    if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `₦${(value / 1000).toFixed(0)}k`;
    return `₦${value}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chart Section */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold mb-6 text-slate-800 dark:text-slate-100">
          10-Year Cumulative Cost Comparison
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, left: 20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
              <XAxis 
                dataKey="year" 
                tick={{ fontSize: 12 }} 
                tickMargin={10}
                tickFormatter={(val) => `Yr ${val}`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                tickFormatter={formatYAxis}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                formatter={(value) => [formatNaira(Number(value)), '']}
                labelFormatter={(label) => `Year ${label}`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              
              {crossoverYear && crossoverYear <= years && (
                <ReferenceLine 
                  x={Math.round(crossoverYear)} 
                  stroke="#10b981" 
                  strokeDasharray="4 4"
                  label={{
                    position: 'top',
                    value: `Payback at ${crossoverMonth} mos`,
                    fill: '#10b981',
                    fontSize: 12,
                    fontWeight: 'bold'
                  }} 
                />
              )}

              <Line 
                type="monotone" 
                dataKey="Generator Cost" 
                stroke="#F97316" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
              <Line 
                type="monotone" 
                dataKey="Solar Total Cost" 
                stroke="#01696F" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Savings Summary Section */}
      <div className="bg-slate-50 dark:bg-slate-800/50 border rounded-2xl p-6 flex flex-col justify-center gap-6">
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Monthly Savings
          </p>
          <p className="text-3xl font-black text-teal-600 dark:text-teal-400">
            {formatNaira(monthlySavings)}
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            Annual Savings
          </p>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {formatNaira(annualSavings)}
          </p>
        </div>
        <div className="pt-4 border-t dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            5-Year Savings
          </p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatNaira(fiveYearSavings)}
          </p>
        </div>
      </div>
    </div>
  );
}
