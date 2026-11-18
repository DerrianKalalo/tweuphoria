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
    <div className="h-64 w-full mt-6 bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-700 mb-6">Ringkasan Statistik Kelas</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
          <Bar dataKey="value" radius={[8, 8, 8, 8]} barSize={40}>
            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};