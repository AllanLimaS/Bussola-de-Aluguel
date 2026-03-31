import React from 'react';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PriceHistoryChart = ({ data = [] }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center gap-3 text-slate-100 font-black text-xl border-l-4 border-indigo-500 pl-4">
        <TrendingUp size={24} className="text-indigo-400" />
        Evolução do Preço
      </div>
      <div className="h-80 w-full bg-slate-800/20 rounded-3xl p-6 border border-slate-800/80 shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
            <XAxis 
              dataKey="data" 
              stroke="#64748b" 
              fontSize={12}
              tickMargin={10}
              tickFormatter={(val) => new Date(val).toLocaleDateString()}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip 
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
              labelFormatter={(val) => new Date(val).toLocaleDateString()}
              itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="aluguel" 
              stroke="#818cf8" 
              strokeWidth={4} 
              dot={{ r: 6, fill: '#818cf8', strokeWidth: 0 }}
              activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PriceHistoryChart;
