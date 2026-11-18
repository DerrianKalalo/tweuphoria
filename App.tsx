import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  AlertTriangle,
  CheckCheck,
  LogOut,
} from 'lucide-react';
import {
  Student,
  AttendanceDatabase,
  AttendanceStatus,
  AuthSession,
  StudentPasswordsMap,
  DEFAULT_STUDENT_PASSWORD,
  INITIAL_STUDENTS,
  UNKLAB_COORDS,
} from './types.ts';
import { formatDate, calculateDistance } from './utils.ts';
import { StudentQRModal } from './components/QRCodeModal.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { StudentDashboard } from './components/StudentDashboard.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';

const SESSION_STORAGE_KEY = 'auth_session_12e';
const PASSWORDS_STORAGE_KEY = 'student_passwords_12e';

const App: React.FC = () => {
  const [students] = useState<Student[]>(() => {
    const saved = localStorage.getItem('students_12e');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });

  const [studentPasswords, setStudentPasswords] = useState<StudentPasswordsMap>(() => {
    const saved = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (!saved) return {};
    try {
      return JSON.parse(saved);
    } catch {
      return {};
    }
  });

  const [currentDate, setCurrentDate] = useState<string>(formatDate(new Date()));
  const [db, setDb] = useState<AttendanceDatabase>(() => {
    const saved = localStorage.getItem('attendance_db_12e');
    return saved ? JSON.parse(saved) : {};
  });

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocationValid, setIsLocationValid] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState(true);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [verifyingStudent, setVerifyingStudent] = useState<Student | null>(null);
  const [isLargeQROpen, setIsLargeQROpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('attendance_db_12e', JSON.stringify(db));
  }, [db]);

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  useEffect(() => {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(studentPasswords));
  }, [studentPasswords]);

  useEffect(() => {
    if (session?.role !== 'admin') return;

    const checkLoc = () => {
      if (!navigator.geolocation) {
        setIsLocationLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          const dist = calculateDistance(
            latitude,
            longitude,
            UNKLAB_COORDS.lat,
            UNKLAB_COORDS.lng
          );
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
  }, [session?.role]);

  const showToastError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const showAutoSave = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (session?.role !== 'admin') return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setDb((prev) => ({
      ...prev,
      [currentDate]: {
        ...(prev[currentDate] || {}),
        [studentId]: {
          studentId,
          status,
          remarks: prev[currentDate]?.[studentId]?.remarks || '',
          timestamp: timeStr,
          location: userLocation || undefined,
        },
      },
    }));
    setVerifyingStudent(null);
    showAutoSave(status === 'H' ? 'Hadir tercatat' : 'Status tersimpan');
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (session?.role !== 'admin') return;
    setDb((prev) => {
      const existing = prev[currentDate]?.[studentId];
      if (!existing) {
        return {
          ...prev,
          [currentDate]: {
            ...(prev[currentDate] || {}),
            [studentId]: {
              studentId,
              status: 'I',
              remarks,
              timestamp: new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              }),
            },
          },
        };
      }
      return {
        ...prev,
        [currentDate]: {
          ...(prev[currentDate] || {}),
          [studentId]: {
            ...existing,
            remarks,
          },
        },
      };
    });
  };

  const handleScan = (decodedText: string) => {
    if (session?.role !== 'admin') return;
    if (!isLocationValid) {
      showToastError('Anda berada di luar area SMA Unklab.');
      return;
    }

    const parts = decodedText.split(':');
    const studentId = parts[0];
    const qrTimestamp = parts[1] ? parseInt(parts[1], 10) : 0;
    const now = Date.now();

    if (qrTimestamp > 0 && Math.abs(now - qrTimestamp) > 60000) {
      setIsScannerOpen(false);
      showToastError('QR kedaluwarsa. Dilarang menggunakan screenshot.');
      return;
    }

    const student = students.find((s) => s.id === studentId);
    if (student) {
      setIsScannerOpen(false);
      setVerifyingStudent(student);
    } else {
      showToastError('Data siswa tidak terdaftar di kelas 12E.');
    }
  };

  const handleUpdateStudentPassword = (studentId: string, newPassword: string) => {
    setStudentPasswords((prev) => ({
      ...prev,
      [studentId]: newPassword,
    }));
    showAutoSave('Password berhasil diperbarui');
  };

  const handleResetStudentPassword = (student: Student) => {
    if (session?.role !== 'admin') return;
    setStudentPasswords((prev) => {
      const next = { ...prev };
      delete next[student.id];
      return next;
    });
    showAutoSave(`Password ${student.name} direset`);
  };

  const handleLogout = () => {
    setIsScannerOpen(false);
    setVerifyingStudent(null);
    setIsLargeQROpen(false);
    setSession(null);
  };

  if (!session) {
    return (
      <LoginPage
        students={students}
        studentPasswords={studentPasswords}
        onLoginSuccess={(nextSession) => setSession(nextSession)}
      />
    );
  }

  const loggedInStudent =
    session.role === 'student'
      ? students.find((s) => s.id === session.studentId) || null
      : null;

  // Fallback safety: if student ID no longer exists in roster, force logout
  if (session.role === 'student' && !loggedInStudent) {
    return (
      <LoginPage
        students={students}
        studentPasswords={studentPasswords}
        onLoginSuccess={(nextSession) => setSession(nextSession)}
      />
    );
  }

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      {/* Toast Messages */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[110] bg-rose-600 text-white px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
          <AlertTriangle size={18} />
          <span className="font-semibold text-xs sm:text-sm">{errorMessage}</span>
        </div>
      )}

      {savedMessage && (
        <div className="fixed bottom-6 right-6 z-[60] bg-slate-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 animate-fade-in">
          <CheckCheck size={17} className="text-emerald-400" />
          <span className="font-semibold text-xs sm:text-sm">{savedMessage}</span>
        </div>
      )}

      {/* Admin Only: QR Scanner & Verification Confirmation */}
      {session.role === 'admin' && (
        <>
          <ScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            onScan={handleScan}
          />
          {verifyingStudent && (
            <div className="fixed inset-0 z-[100] bg-slate-900/75 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200">
                <div className="bg-indigo-600 p-8 text-center text-white">
                  <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/20">
                    <UserCheck size={32} />
                  </div>
                  <h3 className="text-xl font-bold">Konfirmasi Kehadiran</h3>
                </div>
                <div className="p-8 text-center">
                  <h2 className="text-lg font-bold text-slate-900 mb-6">
                    {verifyingStudent.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleStatusChange(verifyingStudent.id, 'H')}
                    className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                  >
                    Tandai Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyingStudent(null)}
                    className="mt-3 text-xs text-slate-500 font-semibold hover:text-slate-800 py-2"
                  >
                    Bukan Siswa Ini
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Only: Enlarged Personal QR Modal */}
      {session.role === 'student' && loggedInStudent && (
        <StudentQRModal
          isOpen={isLargeQROpen}
          onClose={() => setIsLargeQROpen(false)}
          student={loggedInStudent}
        />
      )}

      {/* Clean 3-Zone Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Tweuphoria
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 truncate">
          <span>12E SMA Unklab</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-slate-800 truncate">{session.name}</span>
          <span aria-hidden="true">·</span>
          <span>{session.role === 'admin' ? 'Admin' : 'Siswa'}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            <LogOut size={15} />
            <span>Keluar</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {session.role === 'admin' ? (
          <AdminDashboard
            students={students}
            db={db}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            userLocation={userLocation}
            isLocationValid={isLocationValid}
            isLocationLoading={isLocationLoading}
            onOpenScanner={() => setIsScannerOpen(true)}
            onStatusChange={handleStatusChange}
            onRemarksChange={handleRemarksChange}
            studentPasswords={studentPasswords}
            onResetStudentPassword={handleResetStudentPassword}
          />
        ) : (
          loggedInStudent && (
            <StudentDashboard
              student={loggedInStudent}
              db={db}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              onOpenLargeQR={() => setIsLargeQROpen(true)}
              currentPassword={
                studentPasswords[loggedInStudent.id] || DEFAULT_STUDENT_PASSWORD
              }
              onUpdatePassword={(newPass) =>
                handleUpdateStudentPassword(loggedInStudent.id, newPass)
              }
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
