import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReferrerQRModalProps {
  referralCode: string;
  referrerName: string;
  onClose: () => void;
}

export function ReferrerQRModal({ referralCode, referrerName, onClose }: ReferrerQRModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <QrCode className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Referrer QR Code</h2>
            <p className="text-slate-600">
              Share this QR code with <span className="font-semibold">{referrerName}</span>
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={`${window.location.origin}/signup?ref=${referralCode}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-1">Referral Code</p>
              <p className="text-sm font-mono font-semibold text-slate-900 bg-white px-3 py-2 rounded-lg inline-block">
                {referralCode}
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            When scanned, this QR code will take users to the signup page and automatically assign them as this referrer.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
