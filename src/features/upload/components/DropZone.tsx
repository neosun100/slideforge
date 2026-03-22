import { useCallback, useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { validateFile, isPdfFile, isImageFile, getSupportedFormatsString } from '../services/fileValidator';
import { createLogger } from '@/shared/utils/logger';

const log = createLogger('upload');

interface Props {
  onFile: (file: File) => void;
  onError: (msg: string) => void;
}

export function DropZone({ onFile, onError }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    const result = validateFile(file);
    if (!result.valid) {
      log.warn('File rejected', { name: file.name, error: result.error });
      onError(result.error);
      return;
    }
    log.info('File accepted', { name: file.name, size: file.size, isPdf: isPdfFile(file.name), isImage: isImageFile(file.name) });
    onFile(file);
  }, [onFile, onError]);

  const onDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div
      className={`w-full max-w-lg mx-auto p-10 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
        dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)] bg-white/[0.02]'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      aria-label="Upload file"
    >
      <div className="text-4xl mb-3">📄</div>
      <h3 className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>
        Drop a file here or click to browse
      </h3>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Supports {getSupportedFormatsString()} — Max 30MB, 20 pages
      </p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.png,.jpg,.jpeg,.webp"
        onChange={onChange}
      />
    </div>
  );
}
