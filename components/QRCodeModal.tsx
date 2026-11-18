import React, { useState, useEffect } from 'react';
import { X, User, Clock, ShieldCheck } from 'lucide-react';
import { Student } from '../types.ts';

interface StudentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ isOpen, onClose, student }) => {
  const [timestamp, setTimestamp] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(30);

  useEffect(() => {
    let interval: any;
    if (isOpen && student) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setTimestamp(Date.now());
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      setTimeLeft(30);
    };
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const qrData = `${student.id}:${timestamp}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(qrData)}&margin=10&color=4f46e5`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 p-8 text-center relative">
            <button onClick={onClose} className="absolute top-6 right-6 text-white/50 hover:text-white bg-white/10 p-2 rounded-full transition-all"><X size={20} /></button>
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10"><User size={32} className="text-white" /></div>
            <h2 className="text-2xl font-black text-white tracking-tight">QR CARD SISWA</h2>
            <p className="text-indigo-200 text-[9px] font-bold uppercase tracking-widest mt-1">Siswa 12E SMA Unklab</p>
        </div>
        
        <div className="p-8 flex flex-col items-center">
          <div className="text-center mb-6">
            <h3 className="text-lg font-black text-slate-800 leading-tight">{student.name}</h3>
            <div className="flex items-center justify-center gap-2 mt-2">
               <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1 border border-emerald-100">
                 <ShieldCheck size={10} /> Akun Terverifikasi
               </span>
            </div>
          </div>

          <div className="p-5 bg-white border-2 border-slate-50 rounded-[32px] shadow-inner mb-8">
            <img src={qrImageUrl} alt="QR Code" className="w-48 h-48 object-contain" />
          </div>

          <div className="w-full">
            <div className="flex items-center justify-between mb-2 px-1">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> Auto Refresh</span>
               <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{timeLeft}s</span>
            </div>
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-indigo-600 transition-all duration-1000 ease-linear" 
                 style={{ width: `${(timeLeft / 30) * 100}%` }}
               ></div>
            </div>
          </div>

          <p className="mt-6 text-center text-slate-400 text-[10px] font-bold leading-relaxed max-w-[200px]">
            QR berubah tiap 30 detik untuk keamanan. <span className="text-rose-500">Dilarang Screenshot.</span>
          </p>
        </div>
      </div>
    </div>
  );
};