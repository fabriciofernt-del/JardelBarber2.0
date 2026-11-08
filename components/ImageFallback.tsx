
import React, { useState, useEffect } from 'react';

interface ImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
}

export const ImageFallback = ({ src, alt, className, fallback = 'https://picsum.photos/400/300?random=1' }: ImageProps) => {
  const [imgSrc, setImgSrc] = useState(src || fallback);
  
  useEffect(() => {
    setImgSrc(src || fallback);
  }, [src, fallback]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className || 'w-full h-64 object-cover rounded-lg'}
      onError={(e) => {
        if (e.currentTarget.src !== fallback) {
          e.currentTarget.src = fallback;
        }
      }}
      loading="lazy"
    />
  );
};
