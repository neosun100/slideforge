const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30MB
const MAX_PAGE_COUNT = 20;
const SUPPORTED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg', 'webp'] as const;

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function getFileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 || dot === name.length - 1 ? '' : name.slice(dot + 1).toLowerCase();
}

export function isSupportedFormat(ext: string): boolean {
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(ext);
}

export function isPdfFile(name: string): boolean {
  return getFileExtension(name) === 'pdf';
}

export function isImageFile(name: string): boolean {
  return ['png', 'jpg', 'jpeg', 'webp'].includes(getFileExtension(name));
}

export function validateFileSize(size: number): ValidationResult {
  return size <= MAX_FILE_SIZE
    ? { valid: true }
    : { valid: false, error: `File exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit.` };
}

export function validateFileFormat(name: string): ValidationResult {
  return isSupportedFormat(getFileExtension(name))
    ? { valid: true }
    : { valid: false, error: 'Unsupported format. Please upload PDF, PNG, JPG, or WebP.' };
}

export function validatePageCount(count: number): ValidationResult {
  return count <= MAX_PAGE_COUNT
    ? { valid: true }
    : { valid: false, error: `PDF exceeds ${MAX_PAGE_COUNT} page limit.` };
}

export function validateFile(file: { name: string; size: number }): ValidationResult {
  const sizeCheck = validateFileSize(file.size);
  if (!sizeCheck.valid) return sizeCheck;
  return validateFileFormat(file.name);
}

export function getSupportedFormatsString(): string {
  return SUPPORTED_EXTENSIONS.map(e => e.toUpperCase()).join(', ');
}

export { MAX_FILE_SIZE, MAX_PAGE_COUNT, SUPPORTED_EXTENSIONS };
