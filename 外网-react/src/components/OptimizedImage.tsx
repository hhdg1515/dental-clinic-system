import React from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  style?: React.CSSProperties;
  decoding?: 'async' | 'sync' | 'auto';
  fetchPriority?: 'high' | 'low' | 'auto';
}

/**
 * OptimizedImage - 智能图片组件
 *
 * 功能:
 * - 自动使用 WebP 格式(现代浏览器)
 * - 回退到优化后的 JPEG(旧浏览器)
 * - 支持懒加载
 * - 保持原始文件名作为 fallback
 *
 * 使用示例:
 * <OptimizedImage
 *   src="/images/Appointment.jpg"
 *   alt="预约"
 *   loading="lazy"
 * />
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className,
  loading = 'lazy',
  style,
  decoding = 'async',
  fetchPriority
}) => {
  // 提取文件名和路径
  const basePath = src.replace(/\.(jpg|jpeg|png)$/i, '');
  const ext = src.match(/\.(jpg|jpeg|png)$/i)?.[1] || 'jpg';

  return (
    <picture>
      {/* 现代浏览器优先使用 WebP */}
      <source srcSet={`${basePath}.webp`} type="image/webp" />

      {/* 旧浏览器使用优化后的 JPEG/PNG */}
      <source
        srcSet={`${basePath}.${ext}`}
        type={`image/${ext === 'jpg' ? 'jpeg' : ext}`}
      />

      {/* 最终回退 */}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        style={style}
        decoding={decoding}
        fetchPriority={fetchPriority}
      />
    </picture>
  );
};

export default OptimizedImage;
