'use client';
import { useState, useRef } from 'react';
import Icon from './Icon';
import { uploadImage } from '@/lib/storage';

type Folder = 'inspiration' | 'products';

interface Props {
  onUpload: (url: string) => void;
  folder?: Folder;
  label?: string;
}

export default function ImageUpload({ onUpload, folder = 'inspiration', label = 'Drop image or click to upload' }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File must be under 10 MB.'); return; }
    setError('');
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onUpload(url);
    } catch (e: any) {
      setError(e.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{ opacity: uploading ? 0.7 : 1 }}
      >
        <Icon name={uploading ? 'loader' : 'upload'} size={24} />
        <p style={{ marginTop: 10, fontSize: 13 }}>
          {uploading ? 'Uploading…' : label}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>
          JPG, PNG, WEBP · max 10 MB
        </p>
      </div>
      {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
