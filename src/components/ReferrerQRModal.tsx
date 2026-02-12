import { useState } from 'react';
import { QrCode, Copy, Check, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ReferrerQRModalProps {
  referralCode: string;
  referrerName: string;
  onClose: () => void;
}

export function ReferrerQRModal({ referralCode, referrerName, onClose }: ReferrerQRModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useState(() => {
    document.addEventListener('keydown', handleKeyDown as any);
    return () => document.removeEventListener('keydown', handleKeyDown as any);
  });

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-8 sm:h-8 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-800 transition-colors shadow-sm z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>

        <div className="text-center space-y-4 sm:space-y-6 p-6 sm:p-8 overflow-y-auto">
          <div className="flex justify-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 sm:mb-2">Referrer Signup</h2>
            <p className="text-sm sm:text-base text-slate-600">
              Share this QR code or link for referrer to claim their account
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 sm:p-6">
            <div className="flex justify-center mb-4">
              <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={referralUrl}
                  size={160}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-500 mb-2">Your Referral Code</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-sm font-mono font-semibold text-slate-900 bg-white px-3 py-2 rounded-lg">
                  {referralCode}
                </p>
                <button
                  onClick={handleCopyCode}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-slate-600 mb-2 text-left">Referral Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-lg px-3 py-2 text-xs font-mono text-slate-700 overflow-x-auto">
                {referralUrl}
              </div>
              <button
                onClick={handleCopyLink}
                className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                title="Copy link"
              >
                {copiedLink ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
