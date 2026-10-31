import { useEffect, useMemo, useState } from 'react';

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// Preview links for files, released when the files change or the form closes.
export function useObjectUrls(files) {
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);
  return urls;
}

// New photos for a create form, with a maximum and an error message when it is exceeded.
export function useImageList(setError) {
  const [files, setFiles] = useState([]);
  const urls = useObjectUrls(files);

  const add = (list, max, tooManyMessage) => {
    const picked = Array.from(list);
    if (files.length + picked.length > max) {
      setError(tooManyMessage);
      return false;
    }
    setError('');
    setFiles((prev) => [...prev, ...picked]);
    return true;
  };

  return {
    files,
    urls,
    add,
    remove: (index) => setFiles((prev) => prev.filter((_, i) => i !== index)),
    reset: () => setFiles([]),
  };
}

// One optional tour video (up to 50MB).
export function useVideoFile(setError) {
  const [file, setFile] = useState(null);
  const list = useMemo(() => (file ? [file] : []), [file]);
  const url = useObjectUrls(list)[0] || null;

  const select = (picked) => {
    if (!picked) return false;
    if (picked.size > MAX_VIDEO_BYTES) {
      setError('Video exceeds the 50MB size limit.');
      return false;
    }
    setError('');
    setFile(picked);
    return true;
  };

  return { file, url, select, remove: () => setFile(null), reset: () => setFile(null) };
}
