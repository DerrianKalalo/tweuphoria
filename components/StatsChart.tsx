import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AttendanceDatabase, Student } from '../types.ts';

interface StatsChartProps {
  students: Student[];
  database: AttendanceDatabase;
}

export const StatsChart: React.FC<StatsChartProps> = ({ students, database }) => {
  let totalH = 0, totalI = 0, totalS = 0, totalA = 0;
  Object.values(database).forEach(daily => {
    Object.values(daily).forEach(record => {
      if (record.status === 'H') totalH++;
      if (record.status === 'I') totalI++;
      if (record.status === 'S') totalS++;
      if (record.status === 'A') totalA++;
    });
  });

  const data = [
    { name: 'Hadir', value: totalH, color: '#22c55e' },
    { name: 'Izin', value: totalI, color: '#3b82f6' },
    { name: 'Sakit', value: totalS, color: '#eab308' },
    { name: 'Alpa', value: totalA, color: '#ef4444' },
  ];

  return (
    <div className="w-full bg-white p-6 rounded-2xl border border-slate-200">
      <h3 className="text-base font-bold text-slate-900 mb-4">Ringkasan Statistik Kelas</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)' }} />
            <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={44}>
              {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};