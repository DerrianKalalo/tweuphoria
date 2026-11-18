import { AttendanceDatabase, Student } from './types.ts';

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const getStatusLabel = (status: string) => {
  switch (status) {
    case 'H': return 'Hadir';
    case 'I': return 'Izin';
    case 'S': return 'Sakit';
    case 'A': return 'Alpa';
    default: return '-';
  }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
      let h=0, i=0, s=0, a=0;
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