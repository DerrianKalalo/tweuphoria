import { AttendanceDatabase, Student, STUDENT_EMAIL_DOMAIN } from './types.ts';

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const shiftDate = (dateStr: string, deltaDays: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, (m || 1) - 1, (d || 1) + deltaDays);
  return formatDate(date);
};

export const formatReadableDate = (dateStr: string): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getStudentEmail = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return `@${STUDENT_EMAIL_DOMAIN}`;
  const first = normalizeToken(parts[0]);
  const last = normalizeToken(parts[parts.length - 1]);
  return `${first}.${last}@${STUDENT_EMAIL_DOMAIN}`;
};

export const getStudentEmailAliases = (name: string): string[] => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return [getStudentEmail(name)];
  }
  const first = normalizeToken(parts[0]);
  const last = normalizeToken(parts[parts.length - 1]);
  const aliases = new Set<string>([`${first}.${last}@${STUDENT_EMAIL_DOMAIN}`]);

  // Support multi-word last names such as "Da Costa" -> jafier.dacosta@student.uhs.sch.id
  if (parts.length >= 3) {
    const lastTwo = normalizeToken(parts.slice(-2).join(''));
    aliases.add(`${first}.${lastTwo}@${STUDENT_EMAIL_DOMAIN}`);
  }
  return Array.from(aliases);
};

export const findStudentByEmail = (email: string, students: Student[]): Student | undefined => {
  const normalized = email.trim().toLowerCase();
  if (!normalized.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return undefined;
  return students.find((student) => getStudentEmailAliases(student.name).includes(normalized));
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'H': return 'Hadir';
    case 'I': return 'Izin';
    case 'S': return 'Sakit';
    case 'A': return 'Alpa';
    default: return 'Belum Absen';
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const exportToCSV = (students: Student[], database: AttendanceDatabase, mode: 'daily' | 'monthly', currentDate: string) => {
  let csvContent = "data:text/csv;charset=utf-8,";
  if (mode === 'daily') {
    csvContent += `Rekapan Harian Tweuphoria ${currentDate}\n`;
    csvContent += "No,Nama Siswa,Status,Waktu Scan,Keterangan\n";
    const dailyData = database[currentDate] || {};
    students.forEach((student, index) => {
      const record = dailyData[student.id];
      csvContent += `${index + 1},"${student.name}",${record ? getStatusLabel(record.status) : 'Belum Absen'},${record?.timestamp || '-'},"${record?.remarks || ''}"\n`;
    });
  } else {
    csvContent += "Rekapan Bulanan Tweuphoria\n";
    const dates = Object.keys(database).sort();
    csvContent += "No,Nama Siswa," + dates.join(",") + ",H,I,S,A\n";
    students.forEach((student, index) => {
      let row = `${index + 1},"${student.name}"`;
      let h = 0, i = 0, s = 0, a = 0;
      dates.forEach(date => {
        const status = database[date]?.[student.id]?.status || '-';
        row += `,${status}`;
        if (status === 'H') h++; if (status === 'I') i++; if (status === 'S') s++; if (status === 'A') a++;
      });
      csvContent += `${row},${h},${i},${s},${a}\n`;
    });
  }
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `Tweuphoria_Absensi_${currentDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};