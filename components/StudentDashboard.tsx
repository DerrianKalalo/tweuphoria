import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  KeyRound,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import QRCode from 'qrcode';
import {
  AttendanceDatabase,
  Student,
  DEFAULT_STUDENT_PASSWORD,
} from '../types.ts';
import {
  formatDate,
  formatReadableDate,
  getStatusLabel,
  getStudentEmail,
  shiftDate,
} from '../utils.ts';

interface StudentDashboardProps {
  student: Student;
  db: AttendanceDatabase;
  currentDate: string;
  onDateChange: (nextDate: string) => void;
  onOpenLargeQR: () => void;
  currentPassword: string;
  onUpdatePassword: (newPassword: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  db,
  currentDate,
  onDateChange,
  onOpenLargeQR,
  currentPassword,
  onUpdatePassword,
}) => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Password change state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimestamp(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const qrData = `${student.id}:${timestamp}`;
    QRCode.toDataURL(qrData, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [student.id, timestamp]);

  const studentEmail = getStudentEmail(student.name);
  const todayStr = formatDate(new Date());
  const selectedRecord = db[currentDate]?.[student.id];

  // Calculate student's personal totals across all recorded dates
  let totalH = 0;
  let totalI = 0;
  let totalS = 0;
  let totalA = 0;
  const historyRows: Array<{
    date: string;
    status: string;
    timestamp?: string;
    remarks?: string;
  }> = [];

  Object.keys(db)
    .sort((a, b) => b.localeCompare(a))
    .forEach((dateKey) => {
      const rec = db[dateKey]?.[student.id];
      if (rec) {
        if (rec.status === 'H') totalH++;
        if (rec.status === 'I') totalI++;
        if (rec.status === 'S') totalS++;
        if (rec.status === 'A') totalA++;
        historyRows.push({
          date: dateKey,
          status: rec.status,
          timestamp: rec.timestamp,
          remarks: rec.remarks,
        });
      }
    });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);
    if (oldPass !== currentPassword) {
      setPassMsg({ type: 'error', text: 'Password saat ini tidak sesuai.' });
      return;
    }
    if (newPass.length < 5) {
      setPassMsg({ type: 'error', text: 'Password baru minimal 5 karakter.' });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });
      return;
    }
    onUpdatePassword(newPass);
    setOldPass('');
    setNewPass('');
    setConfirmPass('');
    setPassMsg({ type: 'success', text: 'Password pribadi berhasil diperbarui.' });
  };

  const getStatusTextColor = (status?: string) => {
    switch (status) {
      case 'H':
        return 'text-emerald-700';
      case 'I':
        return 'text-indigo-700';
      case 'S':
        return 'text-amber-700';
      case 'A':
        return 'text-rose-700';
      default:
        return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Identity */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-medium text-slate-500">
            12E · SMA Unklab
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            {student.name}
          </h2>
          <p className="text-xs text-slate-500 font-mono-tabular mt-1">{studentEmail}</p>
        </div>
      </div>

      {/* Main 2-column grid: Personal QR Card (left) + Attendance Status & History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Secure Personal QR Card */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">QR Card Saya</h3>
            <button
              type="button"
              onClick={onOpenLargeQR}
              className="px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <QrCode size={15} />
              <span>Perbesar</span>
            </button>
          </div>

          <div className="flex flex-col items-center py-4">
            <div className="p-3 bg-white border border-slate-200 rounded-2xl">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Dinamis ${student.name}`}
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-slate-400">
                  Menyiapkan QR...
                </div>
              )}
            </div>

            <div className="w-full max-w-[240px] mt-5">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>Refresh otomatis</span>
                </span>
                <span className="font-mono-tabular font-semibold text-indigo-600">
                  {timeLeft}s
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: Date Check, Summary Stats, History & Password */}
        <div className="lg:col-span-7 space-y-6">
          {/* Date Selector & Status for Selected Date */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Status Kehadiran</h3>
                <p className="text-xs text-slate-500 mt-0.5">{formatReadableDate(currentDate)}</p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onDateChange(shiftDate(currentDate, -1))}
                  aria-label="Tanggal sebelumnya"
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="relative flex items-center">
                  <Calendar
                    size={14}
                    className="absolute left-3 text-slate-400 pointer-events-none"
                  />
                  <input
                    type="date"
                    value={currentDate}
                    onChange={(e) => e.target.value && onDateChange(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs font-semibold text-slate-800 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-600 font-mono-tabular"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDateChange(shiftDate(currentDate, 1))}
                  aria-label="Tanggal berikutnya"
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
                {currentDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => onDateChange(todayStr)}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Status tercatat</p>
                <p className={`text-2xl font-bold mt-0.5 ${getStatusTextColor(selectedRecord?.status)}`}>
                  {selectedRecord ? getStatusLabel(selectedRecord.status) : 'Belum Absen'}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-500">Waktu Scan</p>
                <p className="text-sm font-semibold text-slate-900 font-mono-tabular mt-0.5">
                  {selectedRecord?.timestamp || '-'}
                </p>
              </div>
            </div>

            {/* Personal Summary Grid */}
            <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Hadir</p>
                <p className="text-xl font-bold text-emerald-700 font-mono-tabular mt-0.5">{totalH}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Izin</p>
                <p className="text-xl font-bold text-indigo-700 font-mono-tabular mt-0.5">{totalI}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sakit</p>
                <p className="text-xl font-bold text-amber-700 font-mono-tabular mt-0.5">{totalS}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Alpa</p>
                <p className="text-xl font-bold text-rose-700 font-mono-tabular mt-0.5">{totalA}</p>
              </div>
            </div>
          </section>

          {/* Personal Attendance History */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Riwayat Absensi Anda</h3>
              <span className="text-xs text-slate-500 font-mono-tabular">
                {historyRows.length} catatan
              </span>
            </div>

            {historyRows.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Belum ada riwayat absensi tercatat. Tunjukkan QR Card Anda ke admin kelas untuk melakukan absensi.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200">
                      <th className="py-3 px-6">Tanggal</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {historyRows.slice(0, 10).map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/70">
                        <td className="py-3 px-6 text-xs font-medium text-slate-800">
                          {formatReadableDate(row.date)}
                        </td>
                        <td className={`py-3 px-6 text-xs font-semibold ${getStatusTextColor(row.status)}`}>
                          {getStatusLabel(row.status)}
                        </td>
                        <td className="py-3 px-6 text-xs text-slate-500 font-mono-tabular text-right">
                          {row.timestamp || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Change Password Section */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <KeyRound size={15} className="text-indigo-600" />
                <span>Ubah Password</span>
              </h3>
              <span className="text-xs text-slate-500">
                {currentPassword === DEFAULT_STUDENT_PASSWORD ? 'Password awal' : 'Password kustom'}
              </span>
            </div>

            {passMsg && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 border ${
                  passMsg.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {passMsg.type === 'error' ? <AlertCircle size={15} /> : <CheckCheck size={15} />}
                <span>{passMsg.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="password"
                required
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                placeholder="Password lama"
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
              />
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Password baru (min 5)"
                className="px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="flex-1 min-w-0 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Simpan
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};
