import React, { useState, useEffect } from 'react';
import { X, Clock, ShieldCheck } from 'lucide-react';
import QRCode from 'qrcode';
import { Student } from '../types.ts';
import { getStudentEmail } from '../utils.ts';

interface StudentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ isOpen, onClose, student }) => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (!isOpen || !student) return;
    setTimestamp(Date.now());
    setTimeLeft(30);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimestamp(Date.now());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isOpen, student]);

  useEffect(() => {
    if (!isOpen || !student) return;
    const qrData = `${student.id}:${timestamp}`;
    QRCode.toDataURL(qrData, {
      width: 320,
      margin: 2,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [isOpen, student, timestamp]);

  if (!isOpen || !student) return null;

  const studentEmail = getStudentEmail(student.name);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="bg-slate-900 px-6 py-6 text-white relative">
          <button
            onClick={onClose}
            aria-label="Tutup modal QR"
            className="absolute top-5 right-5 text-slate-400 hover:text-white bg-white/10 p-2 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
          <p className="text-xs font-semibold text-indigo-300 tracking-wide">Kartu QR Resmi</p>
          <h2 className="text-xl font-bold tracking-tight mt-1">12E SMA Unklab</h2>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="text-center mb-5 w-full">
            <h3 className="text-lg font-bold text-slate-900 leading-snug">{student.name}</h3>
            <p className="text-xs text-slate-500 mt-1 truncate">{studentEmail}</p>
            <div className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-700">
              <ShieldCheck size={14} />
              <span>Akun Terverifikasi</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-2xl mb-6">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code Absensi ${student.name}`}
                className="w-52 h-52 object-contain"
              />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center bg-slate-50 text-xs text-slate-400 rounded-xl">
                Memuat QR...
              </div>
            )}
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Clock size={13} />
                <span>Refresh otomatis</span>
              </span>
              <span className="text-xs font-semibold text-indigo-600 font-mono-tabular">
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

          <p className="mt-5 text-center text-slate-500 text-xs leading-relaxed">
            QR diperbarui setiap 30 detik. Dilarang mengambil tangkapan layar untuk absensi.
          </p>
        </div>
      </div>
    </div>
  );
};