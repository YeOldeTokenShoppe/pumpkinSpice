import React, { useEffect, useState, forwardRef } from 'react';

const ScrollContent = forwardRef(({ scrollSrc, onLoad, style }, ref) => {
  const [content, setContent] = useState('');
  const [cssContent, setCssContent] = useState('');

  useEffect(() => {
    const loadScrollContent = async () => {
      try {
        // Fetch HTML content
        const htmlResponse = await fetch(scrollSrc);
        const htmlText = await htmlResponse.text();
        
        // Parse HTML to extract body content
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const bodyContent = doc.body.innerHTML;
        
        // Extract CSS file reference and load it
        const cssLink = scrollSrc.replace('.html', '.css');
        const cssResponse = await fetch(cssLink);
        const css = await cssResponse.text();
        
        setContent(bodyContent);
        setCssContent(css);
        
        if (onLoad) onLoad();
      } catch (error) {
        console.error('Error loading scroll content:', error);
        // Fallback to iframe behavior if fetch fails
        setContent(`<p style="color: #d4af37; padding: 20px;">Loading scroll content...</p>`);
      }
    };

    loadScrollContent();
  }, [scrollSrc, onLoad]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssContent }} />
      <div 
        ref={ref}
        style={{
          ...style,
          background: 'transparent',
          color: '#d4af37',
          padding: '20px',
          overflow: 'auto'
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </>
  );
});

ScrollContent.displayName = 'ScrollContent';

export default ScrollContent;