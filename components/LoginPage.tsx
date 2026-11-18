import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, User, AlertCircle } from 'lucide-react';
import {
  ADMIN_PASSWORD,
  ADMIN_USERNAME,
  AuthSession,
  DEFAULT_STUDENT_PASSWORD,
  Student,
  STUDENT_EMAIL_DOMAIN,
  StudentPasswordsMap,
  UserRole,
} from '../types.ts';
import { findStudentByEmail, getStudentEmail } from '../utils.ts';

interface LoginPageProps {
  students: Student[];
  studentPasswords: StudentPasswordsMap;
  onLoginSuccess: (session: AuthSession) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  students,
  studentPasswords,
  onLoginSuccess,
}) => {
  const [roleTab, setRoleTab] = useState<UserRole>('student');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRoleTab(nextRole);
    setIdentifier('');
    setPassword('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (roleTab === 'admin') {
      const cleanUser = identifier.trim().toLowerCase();
      if (cleanUser !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        setError('Username atau password admin salah.');
        return;
      }
      onLoginSuccess({
        role: 'admin',
        identifier: ADMIN_USERNAME,
        name: 'Admin Kelas 12E',
      });
      return;
    }

    // Student login validation
    const cleanEmail = identifier.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Masukkan email siswa terlebih dahulu.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
      setError(`Gunakan format email (namadepan).(namabelakang)@${STUDENT_EMAIL_DOMAIN}`);
      return;
    }

    const matchedStudent = findStudentByEmail(cleanEmail, students);
    if (!matchedStudent) {
      setError('Email siswa tidak terdaftar di kelas 12E SMA Unklab.');
      return;
    }

    const expectedPassword = studentPasswords[matchedStudent.id] || DEFAULT_STUDENT_PASSWORD;
    if (password !== expectedPassword) {
      setError('Password siswa salah. Periksa kembali password Anda.');
      return;
    }

    onLoginSuccess({
      role: 'student',
      identifier: getStudentEmail(matchedStudent.name),
      name: matchedStudent.name,
      studentId: matchedStudent.id,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
            <ShieldCheck size={18} />
          </div>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Tweuphoria
          </span>
        </div>
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
          12E · SMA Unklab
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm max-w-md w-full">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">Masuk</h1>
            <p className="text-xs text-slate-500 mt-1">
              Absensi Digital Tweuphoria · 12E SMA Unklab
            </p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-6" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={roleTab === 'student'}
              onClick={() => handleRoleSwitch('student')}
              className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleTab === 'student'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Siswa
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={roleTab === 'admin'}
              onClick={() => handleRoleSwitch('admin')}
              className={`py-2.5 px-3 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                roleTab === 'admin'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Admin
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {roleTab === 'student' ? 'Email Siswa' : 'Username'}
              </label>
              <div className="relative">
                {roleTab === 'student' ? (
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                ) : (
                  <User
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                )}
                <input
                  id="login-identifier"
                  type={roleTab === 'student' ? 'email' : 'text'}
                  autoComplete={roleTab === 'student' ? 'email' : 'username'}
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={
                    roleTab === 'student'
                      ? `namadepan.namabelakang@${STUDENT_EMAIL_DOMAIN}`
                      : 'admin'
                  }
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-10 pr-11 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 mt-2"
            >
              Masuk
            </button>
          </form>

          {roleTab === 'student' && (
            <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 font-mono-tabular">
              Password awal: <span className="font-semibold text-slate-700">{DEFAULT_STUDENT_PASSWORD}</span>
            </p>
          )}
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        Tweuphoria 12E · SMA Unklab
      </footer>
    </div>
  );
};
