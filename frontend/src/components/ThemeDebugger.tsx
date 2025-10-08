'use client';

import { useEffect, useState } from 'react';

export default function ThemeDebugger() {
  const [info, setInfo] = useState<any>({});

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const body = document.body;
      const computedBody = window.getComputedStyle(body);
      const computedHtml = window.getComputedStyle(html);

      setInfo({
        htmlClasses: html.className,
        bodyClasses: body.className,
        htmlHasDark: html.classList.contains('dark'),
        bodyHasDark: body.classList.contains('dark'),
        bodyBgColor: computedBody.backgroundColor,
        bodyColor: computedBody.color,
        htmlBgColor: computedHtml.backgroundColor,
        localStorage: localStorage.getItem('theme'),
      });
    };

    checkTheme();
    const interval = setInterval(checkTheme, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg shadow-lg text-xs max-w-md z-[9999] opacity-90">
      <h3 className="font-bold mb-2">🔍 Theme Debugger</h3>
      <div className="space-y-1">
        <div><strong>HTML has dark:</strong> {info.htmlHasDark ? '✅ YES' : '❌ NO'}</div>
        <div><strong>BODY has dark:</strong> {info.bodyHasDark ? '✅ YES' : '❌ NO'}</div>
        <div><strong>LocalStorage:</strong> {info.localStorage}</div>
        <div><strong>Body BG Color:</strong> {info.bodyBgColor}</div>
        <div><strong>Body Text Color:</strong> {info.bodyColor}</div>
        <div className="text-[10px] opacity-75 mt-2">
          <div><strong>HTML classes:</strong> {info.htmlClasses}</div>
          <div><strong>BODY classes:</strong> {info.bodyClasses?.substring(0, 50)}...</div>
        </div>
      </div>
    </div>
  );
}
