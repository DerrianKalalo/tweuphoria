export type AttendanceStatus = 'H' | 'I' | 'S' | 'A';

export type UserRole = 'admin' | 'student';

export interface AuthSession {
  role: UserRole;
  identifier: string; // 'admin' or student email
  name: string;
  studentId?: string;
}

export type StudentPasswordsMap = Record<string, string>;

export const STUDENT_EMAIL_DOMAIN = 'student.uhs.sch.id';
export const DEFAULT_STUDENT_PASSWORD = 'uhs12e!';
export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'uhsadmin!';

export interface Student {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks: string;
  timestamp?: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface DailyAttendance {
  [studentId: string]: AttendanceRecord;
}

export interface AttendanceDatabase {
  [date: string]: DailyAttendance;
}

export const UNKLAB_COORDS = {
  lat: 1.4172,
  lng: 124.9835,
  radius: 150 // meters
};

// Daftar Siswa 12E
export const INITIAL_STUDENTS: Student[] = [
  { id: '1', name: 'Abraham Markus Gantare' },
  { id: '2', name: 'Agafya Alicia Enoch' },
  { id: '3', name: 'Callista Mikeyla Makarumpas' },
  { id: '4', name: 'Cornelius Ivan Yuwana' },
  { id: '5', name: 'Darrel Phillipe Nerrazuri' },
  { id: '6', name: 'Dendy Jonnassend Sidartha' },
  { id: '7', name: 'Derrian William Izecson Kalalo' },
  { id: '8', name: 'Dominique Estera Lalenoh' },
  { id: '9', name: 'Dylan Josh Vilandri Matheos' },
  { id: '10', name: 'Fabiano Injilio Andreas Seroh' },
  { id: '11', name: 'Febrian Imanuel Adrian Dumais' },
  { id: '12', name: 'Florenchia Margio' },
  { id: '13', name: 'Friendly Christian Jovel Manaping' },
  { id: '14', name: 'Gerard Matthew Keles' },
  { id: '15', name: 'Jafier Tawas Da Costa' },
  { id: '16', name: 'Joshua Andrew Mandagi' },
  { id: '17', name: 'Junichi Rolland Cristian Sangari' },
  { id: '18', name: 'Kenji Jonathan Singal' },
  { id: '19', name: 'Kimmy Jordan Tanod' },
  { id: '20', name: 'Livi Britney Tesalonika Ticoalu' },
  { id: '21', name: 'Marchellino Timoty Cerellio Abusalam' },
  { id: '22', name: 'Mark Given Ombuh' },
  { id: '23', name: 'Nadine Wulan Rottie' },
  { id: '24', name: 'Priscila Stecia Rebecca Doodoh' },
  { id: '25', name: 'Raditya Deven Prince Somba' },
  { id: '26', name: 'Zafnath Paaneah Yunus' },
  { id: '27', name: 'Anggreila Watulingas' },
];