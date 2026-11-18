import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  MapPin,
  RotateCcw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  AttendanceDatabase,
  AttendanceStatus,
  Student,
  StudentPasswordsMap,
} from '../types.ts';
import {
  exportToCSV,
  formatDate,
  formatReadableDate,
  getStudentEmail,
  shiftDate,
} from '../utils.ts';
import { StatsChart } from './StatsChart.tsx';

interface AdminDashboardProps {
  students: Student[];
  db: AttendanceDatabase;
  currentDate: string;
  onDateChange: (nextDate: string) => void;
  userLocation: { lat: number; lng: number } | null;
  isLocationValid: boolean;
  isLocationLoading: boolean;
  onOpenScanner: () => void;
  onStatusChange: (studentId: string, status: AttendanceStatus) => void;
  onRemarksChange: (studentId: string, remarks: string) => void;
  studentPasswords: StudentPasswordsMap;
  onResetStudentPassword: (student: Student) => void;
}

type AdminTab = 'input' | 'recap' | 'accounts';
type StatusFilter = 'ALL' | AttendanceStatus | 'NONE';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  students,
  db,
  currentDate,
  onDateChange,
  userLocation,
  isLocationValid,
  isLocationLoading,
  onOpenScanner,
  onStatusChange,
  onRemarksChange,
  studentPasswords,
  onResetStudentPassword,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('input');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const todayStr = formatDate(new Date());
  const dailyMap = db[currentDate] || {};

  // Daily summary metrics
  let dailyH = 0;
  let dailyI = 0;
  let dailyS = 0;
  let dailyA = 0;
  let dailyUnmarked = 0;

  students.forEach((s) => {
    const st = dailyMap[s.id]?.status;
    if (st === 'H') dailyH++;
    else if (st === 'I') dailyI++;
    else if (st === 'S') dailyS++;
    else if (st === 'A') dailyA++;
    else dailyUnmarked++;
  });

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getStudentEmail(student.name).toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    const st = dailyMap[student.id]?.status;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'NONE') return !st;
    return st === statusFilter;
  });

  const getStatusButton = (
    sId: string,
    type: AttendanceStatus,
    label: string,
    activeClass: string
  ) => {
    const currentStatus = dailyMap[sId]?.status;
    const isSelected = currentStatus === type;
    return (
      <button
        type="button"
        onClick={() => onStatusChange(sId, type)}
        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border ${
          isSelected
            ? `${activeClass} text-white`
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Geofence Status Strip */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isLocationValid
            ? 'bg-emerald-50/70 border-emerald-200'
            : 'bg-rose-50/70 border-rose-200'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl text-white ${
              isLocationValid ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {isLocationValid ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
          </div>
          <div>
            <h3
              className={`text-sm font-bold ${
                isLocationValid ? 'text-emerald-900' : 'text-rose-900'
              }`}
            >
              {isLocationLoading
                ? 'Memeriksa lokasi perangkat...'
                : isLocationValid
                ? 'Berada di Area SMA Unklab — Scanner Aktif'
                : 'Di Luar Area SMA Unklab — Scanner Terkunci'}
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 font-mono-tabular">
              <MapPin size={12} />
              <span>
                {userLocation
                  ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                  : 'Izin GPS diperlukan untuk scan QR'}
              </span>
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!isLocationValid}
          onClick={onOpenScanner}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-colors whitespace-nowrap shrink-0 ${
            isLocationValid
              ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          <ScanLine size={16} />
          <span>Mulai Scan QR</span>
        </button>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'input'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Presensi Harian
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('recap')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'recap'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rekapan Bulanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accounts')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'accounts'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Akun Siswa
          </button>
        </div>

        {activeTab === 'input' && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onDateChange(shiftDate(currentDate, -1))}
              aria-label="Hari sebelumnya"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="relative flex items-center">
              <Calendar
                size={15}
                className="absolute left-3 text-slate-400 pointer-events-none"
              />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600 font-mono-tabular"
              />
            </div>
            <button
              type="button"
              onClick={() => onDateChange(shiftDate(currentDate, 1))}
              aria-label="Hari berikutnya"
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDateChange(todayStr)}
              disabled={currentDate === todayStr}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap ${
                currentDate === todayStr
                  ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
                  : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
              }`}
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => exportToCSV(students, db, 'daily', currentDate)}
              className="px-4 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Download size={15} />
              <span>Ekspor CSV</span>
            </button>
          </div>
        )}
      </div>

      {activeTab === 'input' && (
        <div className="space-y-5">
          {/* Date Heading & Compact Summary Row */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {formatReadableDate(currentDate)}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {students.length} siswa terdaftar di kelas 12E
              </p>
            </div>

            <div className="grid grid-cols-5 gap-4 sm:gap-6 text-center">
              <div>
                <p className="text-xs text-slate-500">Hadir</p>
                <p className="text-lg font-bold text-emerald-700 font-mono-tabular">{dailyH}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Izin</p>
                <p className="text-lg font-bold text-indigo-700 font-mono-tabular">{dailyI}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sakit</p>
                <p className="text-lg font-bold text-amber-700 font-mono-tabular">{dailyS}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Alpa</p>
                <p className="text-lg font-bold text-rose-700 font-mono-tabular">{dailyA}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Belum</p>
                <p className="text-lg font-bold text-slate-500 font-mono-tabular">
                  {dailyUnmarked}
                </p>
              </div>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau email siswa..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
              {(
                [
                  ['ALL', 'Semua'],
                  ['H', 'Hadir'],
                  ['I', 'Izin'],
                  ['S', 'Sakit'],
                  ['A', 'Alpa'],
                  ['NONE', 'Belum Absen'],
                ] as Array<[StatusFilter, string]>
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    statusFilter === key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-14 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4 text-center">Status Kehadiran</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student, index) => {
                      const record = dailyMap[student.id];
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono-tabular text-xs">
                            {index + 1}
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-sm font-semibold text-slate-900">{student.name}</p>
                            <p className="text-xs text-slate-400 font-mono-tabular">
                              {getStudentEmail(student.name)}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center gap-1.5">
                              {getStatusButton(
                                student.id,
                                'H',
                                'H',
                                'bg-emerald-600 border-emerald-600'
                              )}
                              {getStatusButton(
                                student.id,
                                'I',
                                'I',
                                'bg-indigo-600 border-indigo-600'
                              )}
                              {getStatusButton(
                                student.id,
                                'S',
                                'S',
                                'bg-amber-600 border-amber-600'
                              )}
                              {getStatusButton(
                                student.id,
                                'A',
                                'A',
                                'bg-rose-600 border-rose-600'
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={record?.remarks || ''}
                              onChange={(e) => onRemarksChange(student.id, e.target.value)}
                              placeholder="Catatan..."
                              className="w-full min-w-[140px] px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500 text-slate-700"
                            />
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-500 font-mono-tabular text-right whitespace-nowrap">
                            {record?.timestamp || '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'recap' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Rekapan Kehadiran Kelas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Akumulasi seluruh tanggal absensi tersimpan ({Object.keys(db).length} hari)
              </p>
            </div>
            <button
              type="button"
              onClick={() => exportToCSV(students, db, 'monthly', currentDate)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap w-fit"
            >
              <Download size={16} />
              <span>Ekspor Rekapan CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900 text-white text-xs font-semibold">
                  <tr>
                    <th className="py-3.5 px-4 w-14 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4 text-center">H</th>
                    <th className="py-3.5 px-4 text-center">I</th>
                    <th className="py-3.5 px-4 text-center">S</th>
                    <th className="py-3.5 px-4 text-center">A</th>
                    <th className="py-3.5 px-4 text-right">Kehadiran</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    let h = 0,
                      i = 0,
                      s = 0,
                      a = 0;
                    Object.keys(db).forEach((date) => {
                      const st = db[date]?.[student.id]?.status;
                      if (st === 'H') h++;
                      if (st === 'I') i++;
                      if (st === 'S') s++;
                      if (st === 'A') a++;
                    });
                    const total = h + i + s + a;
                    const pct = total > 0 ? Math.round((h / total) * 100) : 0;
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono-tabular text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800">{student.name}</td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-700 font-mono-tabular">
                          {h}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-indigo-700 font-mono-tabular">
                          {i}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-amber-700 font-mono-tabular">
                          {s}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-700 font-mono-tabular">
                          {a}
                        </td>
                        <td className="py-3 px-4 text-right font-mono-tabular text-xs font-semibold text-slate-700">
                          {total > 0 ? `${pct}%` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <StatsChart students={students} database={db} />
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Daftar Akun Login Siswa 12E</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Format email resmi: (nama depan).(namabelakang)@student.uhs.sch.id
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                    <th className="py-3.5 px-4 w-14 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Email Login</th>
                    <th className="py-3.5 px-4">Status Password</th>
                    <th className="py-3.5 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((student, idx) => {
                    const hasCustomPassword = Boolean(studentPasswords[student.id]);
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-center text-slate-400 font-mono-tabular text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{student.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-mono-tabular">
                          {getStudentEmail(student.name)}
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span
                            className={
                              hasCustomPassword
                                ? 'text-emerald-700 font-semibold'
                                : 'text-slate-500'
                            }
                          >
                            {hasCustomPassword ? 'Password pribadi aktif' : 'Password awal (default)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            disabled={!hasCustomPassword}
                            onClick={() => onResetStudentPassword(student)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                              hasCustomPassword
                                ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                : 'bg-slate-50 text-slate-400 border-slate-100 cursor-not-allowed'
                            }`}
                          >
                            <RotateCcw size={13} />
                            <span>Reset Password</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
