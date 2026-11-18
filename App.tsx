
import React, { useState, useEffect } from 'react';
import { 
  Users, Calendar, Download, QrCode, Check, ScanLine, 
  MapPin, ShieldCheck, ShieldAlert, UserCheck, 
  Globe, AlertTriangle, Search, ChevronRight, CheckCheck,
  X
} from 'lucide-react';
import { 
  Student, AttendanceDatabase, AttendanceStatus, 
  INITIAL_STUDENTS, UNKLAB_COORDS 
} from './types.ts';
import { formatDate, exportToCSV, calculateDistance } from './utils.ts';
import { StudentQRModal } from './components/QRCodeModal.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { StatsChart } from './components/StatsChart.tsx';

const MAIN_PAGE_URL = "https://absensitweuphoria.ualspublication.web.id/";

const App: React.FC = () => {
  const [students] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students_12e');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [db, setDb] = useState<AttendanceDatabase>(() => {
    const saved = localStorage.getItem('attendance_db_12e');
    return saved ? JSON.parse(saved) : {};
  });

  const [view, setView] = useState<'input' | 'recap'>('input');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [verifyingStudent, setVerifyingStudent] = useState<Student | null>(null);
  const [selectedStudentQR, setSelectedStudentQR] = useState<Student | null>(null);
  const [isSearchQRModalOpen, setIsSearchQRModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('attendance_db_12e', JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    const checkLoc = () => {
      if (!navigator.geolocation) {
        setIsLocationLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const dist = calculateDistance(latitude, longitude, UNKLAB_COORDS.lat, UNKLAB_COORDS.lng);
          setIsLocationValid(dist <= UNKLAB_COORDS.radius);
          setIsLocationLoading(false);
        },
        () => setIsLocationLoading(false),
        { enableHighAccuracy: true }
      );
    };
    checkLoc();
    const interval = setInterval(checkLoc, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setDb(prev => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || {}),
        [studentId]: {
          studentId, 
          status, 
          remarks: prev[currentDate]?.[studentId]?.remarks || '',
          timestamp: timeStr, 
          location: userLocation || undefined
        }
      }
    }));
    setVerifyingStudent(null);
    showAutoSave(status === 'H' ? "Hadir!" : "Tersimpan");
  };

  const showAutoSave = (msg: string) => {
    setSavedMessage(msg); setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleScan = (decodedText: string) => {
    if (!isLocationValid) { 
      setErrorMessage("Anda berada di luar area SMA Unklab!"); 
      setTimeout(() => setErrorMessage(null), 4000);
      return; 
    }
    const parts = decodedText.split(':');
    const studentId = parts[0];
    const qrTimestamp = parts[1] ? parseInt(parts[1]) : 0;
    const now = Date.now();

    if (qrTimestamp > 0 && Math.abs(now - qrTimestamp) > 60000) {
      setErrorMessage("QR Kadaluarsa! Dilarang menggunakan screenshot.");
      setIsScannerOpen(false);
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }

    const student = students.find(s => s.id === studentId);
    if (student) { 
      setIsScannerOpen(false); 
      setVerifyingStudent(student); 
    } else {
      setErrorMessage("Data siswa tidak terdaftar!");
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const getStatusButton = (sId: string, type: AttendanceStatus, label: string, colorClass: string) => {
    const currentStatus = db[currentDate]?.[sId]?.status;
    const isSelected = currentStatus === type;
    return (
      <button onClick={() => handleStatusChange(sId, type)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${isSelected ? `${colorClass} text-white shadow-md transform scale-105` : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
        {label}
      </button>
    );
  };

  const filteredSearch = students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen pb-20 bg-[#f8fafc]">
      {/* Toast Messages */}
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-rose-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-fade-in border-b-4 border-rose-800">
          <AlertTriangle size={20} />
          <span className="font-bold text-sm">{errorMessage}</span>
        </div>
      )}

      {savedMessage && (
        <div className="fixed bottom-10 right-6 z-[60] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-bounce-in">
          <CheckCheck size={20} className="text-emerald-400" />
          <span className="font-bold">{savedMessage}</span>
        </div>
      )}

      {/* Modal Siswa Cari QR Card Mereka Sendiri */}
      {isSearchQRModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl animate-fade-in">
             <div className="p-8 border-b">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black text-slate-900">Ambil QR Card Anda</h3>
                  <button onClick={() => setIsSearchQRModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X size={24} /></button>
                </div>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ketik nama Anda..." 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none font-bold"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
             </div>
             <div className="max-h-[50vh] overflow-y-auto p-4 space-y-2 no-scrollbar">
                {filteredSearch.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => { setSelectedStudentQR(s); setIsSearchQRModalOpen(false); }}
                    className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 rounded-2xl transition-all group"
                  >
                    <span className="font-bold text-slate-700">{s.name}</span>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600" />
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Scan */}
      {verifyingStudent && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-lg animate-fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-indigo-600 p-10 text-center text-white">
               <div className="bg-white/20 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20"><UserCheck size={40} /></div>
               <h3 className="text-2xl font-black">Konfirmasi</h3>
            </div>
            <div className="p-10 text-center">
              <h2 className="text-xl font-bold text-slate-900 mb-8">{verifyingStudent.name}</h2>
              <button onClick={() => handleStatusChange(verifyingStudent.id, 'H')} className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-black text-lg shadow-xl hover:bg-emerald-600 transition-all">HADIR</button>
              <button onClick={() => setVerifyingStudent(null)} className="mt-4 text-slate-400 font-bold hover:text-slate-600">Bukan Siswa Ini</button>
            </div>
          </div>
        </div>
      )}

      <ScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScan={handleScan} />
      <StudentQRModal isOpen={!!selectedStudentQR} onClose={() => setSelectedStudentQR(null)} student={selectedStudentQR} />

      {/* Navigation */}
      <nav className="bg-white border-b sticky top-0 z-40 shadow-sm px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-xl"><ShieldCheck size={24} /></div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">Tweuphoria</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">12E SMA Unklab</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSearchQRModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs hover:bg-indigo-100 transition-all border border-indigo-100"
          >
            <QrCode size={16} /> AMBIL QR SAYA
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Location Status Card */}
        <div className={`mb-8 p-5 rounded-3xl flex items-center justify-between border-2 ${isLocationValid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isLocationValid ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-lg`}>
              {isLocationValid ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            </div>
            <div>
              <h3 className={`font-black text-sm ${isLocationValid ? 'text-emerald-800' : 'text-rose-800'}`}>
                {isLocationLoading ? 'Mengecek Lokasi...' : isLocationValid ? 'AREA SMA UNKLAB (OKE)' : 'LOKASI TIDAK VALID'}
              </h3>
              <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1 uppercase tracking-widest"><MapPin size={12} /> {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Aktifkan GPS'}</p>
            </div>
          </div>
          {!isLocationValid && !isLocationLoading && <div className="text-[10px] bg-rose-600 text-white px-3 py-1.5 rounded-full font-black animate-pulse">SCANNER TERKUNCI</div>}
        </div>

        {/* View Switcher */}
        <div className="flex bg-white p-1 rounded-2xl border mb-8 w-fit shadow-sm">
          <button onClick={() => setView('input')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'input' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>PRESENSI</button>
          <button onClick={() => setView('recap')} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${view === 'recap' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>REKAPAN</button>
        </div>

        {view === 'input' ? (
          <div className="animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex gap-4 w-full md:w-auto">
                <input type="date" value={currentDate} onChange={(e) => setCurrentDate(e.target.value)} className="px-5 py-3 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-slate-700 font-bold bg-white shadow-sm" />
                <button 
                  disabled={!isLocationValid}
                  onClick={() => setIsScannerOpen(true)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-3 px-8 py-3 rounded-2xl font-black text-sm transition-all shadow-xl ${isLocationValid ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  <ScanLine size={20} /> MULAI SCAN
                </button>
              </div>
              <button onClick={() => exportToCSV(students, db, 'daily', currentDate)} className="w-full md:w-auto px-6 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"><Download size={18} /> Ekspor Harian</button>
            </div>

            <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                    <th className="p-5 w-16 text-center">No</th>
                    <th className="p-5">Nama Siswa</th>
                    <th className="p-5 text-center">Status</th>
                    <th className="p-5">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.map((student, index) => {
                    const record = db[currentDate]?.[student.id];
                    return (
                      <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-5 text-center text-slate-300 font-black text-xs">{index + 1}</td>
                        <td className="p-5 font-bold text-slate-700">{student.name}</td>
                        <td className="p-5">
                          <div className="flex justify-center gap-1.5">
                            {getStatusButton(student.id, 'H', 'H', 'bg-emerald-500 border-emerald-600')}
                            {getStatusButton(student.id, 'I', 'I', 'bg-indigo-500 border-indigo-600')}
                            {getStatusButton(student.id, 'S', 'S', 'bg-amber-500 border-amber-600')}
                            {getStatusButton(student.id, 'A', 'A', 'bg-rose-500 border-rose-600')}
                          </div>
                        </td>
                        <td className="p-5 text-xs text-slate-400 font-bold">{record?.timestamp || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900">Rekapan Bulanan</h2>
                <button onClick={() => exportToCSV(students, db, 'monthly', currentDate)} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"><Download size={20} /> Excel</button>
             </div>
             <div className="bg-white rounded-[32px] shadow-xl border overflow-hidden overflow-x-auto mb-8">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900 text-white uppercase text-[10px] font-black">
                    <tr><th className="p-5 w-16 text-center">No</th><th className="p-5">Nama Siswa</th><th className="p-5 text-center">H</th><th className="p-5 text-center">I</th><th className="p-5 text-center">S</th><th className="p-5 text-center">A</th></tr>
                  </thead>
                  <tbody className="divide-y">
                    {students.map((student, idx) => {
                      let h=0, i=0, s=0, a=0;
                      Object.keys(db).forEach(date => { const st = db[date]?.[student.id]?.status; if(st==='H')h++; if(st==='I')i++; if(st==='S')s++; if(st==='A')a++;});
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="p-5 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="p-5 font-bold text-slate-700">{student.name}</td>
                          <td className="p-5 text-center font-black text-emerald-600">{h}</td>
                          <td className="p-5 text-center font-black text-indigo-600">{i}</td>
                          <td className="p-5 text-center font-black text-amber-600">{s}</td>
                          <td className="p-5 text-center font-black text-rose-600">{a}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
             <StatsChart students={students} database={db} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
