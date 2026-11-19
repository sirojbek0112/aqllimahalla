import { useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { API_ORIGIN } from '../services/api';

interface MediaImageProps {
  src?: string | null;
  alt: string;
  className?: string;
}

export function MediaImage({ src, alt, className = 'w-full h-full object-cover' }: MediaImageProps) {
  const [failed, setFailed] = useState(false);

  const resolvedSrc =
    src && API_ORIGIN && src.startsWith('/uploads/') ? `${API_ORIGIN}${src}` : src;

  if (!resolvedSrc || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#E8F7F0] to-[#D4EFE2] text-[#064B3C] p-4 text-center ${className}`}
      >
        <ImageIcon className="w-8 h-8 mb-2 opacity-60" />
        <span className="text-xs font-medium opacity-75 line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
