'use client';

interface BlogContentProps {
  content: string;
}

export default function BlogContent({ content }: BlogContentProps) {
  return (
    <div 
      className="blog-content"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        lineHeight: '1.7',
        fontSize: '16px',
      }}
    />
  );
}
