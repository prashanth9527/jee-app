'use client';

import React from 'react';

interface ContentPreviewProps {
  contentData: {
    type: string;
    title: string;
    content?: string;
    url?: string;
    fileUrl?: string;
    youtubeVideoId?: string;
    iframeUrl?: string;
  };
  title: string;
}

export default function ContentPreview({ contentData, title }: ContentPreviewProps) {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="p-4 border rounded-lg">
        <p className="text-gray-600">Content preview for type: {contentData.type}</p>
        {contentData.content && (
          <div className="mt-2" dangerouslySetInnerHTML={{ __html: contentData.content }} />
        )}
      </div>
    </div>
  );
}
