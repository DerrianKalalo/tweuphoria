import React, { useEffect, useRef } from 'react';
import { X, Camera } from 'lucide-react';
import { Html5QrcodeScanner } from "html5-qrcode";

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ isOpen, onClose, onScan }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error);
        }

        const scanner = new Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
          },
          false
        );

        scannerRef.current = scanner;

        scanner.render(
          (decodedText) => {
            onScanRef.current(decodedText);
          },
          () => {
            // ignore frame parse errors
          }
        );
      }, 100);

      return () => clearTimeout(timer);
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-[fadeIn_0.2s_ease-out]">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10 bg-white rounded-full p-1"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center justify-center gap-2">
            <Camera className="text-blue-600" />
            Scan QR Siswa
          </h2>
          <p className="text-gray-500 text-sm mt-1">Arahkan kamera ke QR Code siswa untuk absensi otomatis.</p>
        </div>
        
        <div className="overflow-hidden rounded-xl bg-black border-2 border-gray-100 relative min-h-[300px]">
          <div id="reader" className="w-full h-full"></div>
        </div>

        <div className="mt-4 text-center text-xs text-gray-400">
          Pastikan ruangan cukup terang dan QR code terlihat jelas.
        </div>
      </div>
    </div>
  );
};