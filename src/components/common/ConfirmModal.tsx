import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D2D2A]/60 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#E6E4DF] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`p-3 rounded-2xl shrink-0 ${
                isDestructive ? 'bg-[#C97B5A]/15 text-[#C97B5A]' : 'bg-[#A7C4BC]/20 text-[#3E4A3D]'
              }`}
            >
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-serif italic text-[#3E4A3D]">{title}</h3>
              <p className="mt-1 text-xs sm:text-sm text-[#8A8882] leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[#8A8882] hover:text-[#2D2D2A] p-1.5 rounded-full hover:bg-[#F3F1ED] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-[#8A8882] bg-white hover:bg-[#F3F1ED] border border-[#E6E4DF] rounded-full transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 text-xs sm:text-sm font-semibold text-white rounded-full shadow-xs transition-colors ${
                isDestructive
                  ? 'bg-[#C97B5A] hover:bg-[#B36B4D]'
                  : 'bg-[#3E4A3D] hover:bg-[#2D362C]'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
