import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const CheckInScanner = ({ onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    let scanner = null;
    try {
      scanner = new Html5QrcodeScanner(
        "qr-reader-container",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        onScanSuccess(decodedText);
      }, (error) => {
        // Quiet scanner errors to avoid cluttering logs
      });
    } catch (err) {
      console.error("QR scanner init failed", err);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScanSuccess]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScanSuccess(manualCode.trim());
      setManualCode('');
    }
  };

  return (
    <div className="flex flex-col items-center bg-white rounded-3xl p-6 border border-gray-100 shadow-sm max-w-md w-full">
      <h3 className="font-bold text-gray-900 text-lg mb-4">Scan Ticket QR</h3>
      
      {/* html5-qrcode camera reader container */}
      <div id="qr-reader-container" className="w-full rounded-2xl overflow-hidden mb-6 bg-slate-50 border border-slate-200"></div>

      <div className="w-full flex items-center gap-3 my-2 text-gray-400 text-xs font-bold uppercase tracking-wider before:content-[''] before:flex-1 before:border-t before:border-gray-100 after:content-[''] after:flex-1 after:border-t after:border-gray-100">
        OR ENTER CODE MANUALLY
      </div>

      <form onSubmit={handleManualSubmit} className="w-full flex gap-2 mt-2">
        <input
          type="text"
          placeholder="eventsphere_booking_id_user_id_event_id"
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-medium"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition"
        >
          Verify
        </button>
      </form>
    </div>
  );
};

export default CheckInScanner;
