import JSZip from 'jszip';

// Resolves relative path segments like '..' and '.' and removes hash/query fragments
function resolveAndCleanPath(opfDir, href) {
  // 1. Remove hash and query fragments
  const cleanHref = href.split('#')[0].split('?')[0];
  
  // 2. Decode URL entities
  const decodedHref = decodeURIComponent(cleanHref);
  
  // 3. Combine directory and href
  const fullPath = opfDir ? (opfDir + decodedHref) : decodedHref;
  
  // 4. Normalize slashes
  const normalizedPath = fullPath.replace(/\\/g, '/');
  
  // 5. Resolve relative path segments ('..' and '.')
  const segments = normalizedPath.split('/');
  const resolvedSegments = [];
  
  for (const segment of segments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      resolvedSegments.pop();
    } else {
      resolvedSegments.push(segment);
    }
  }
  
  return resolvedSegments.join('/');
}

// Parse EPUB file client-side using JSZip and browser DOMParser
export async function parseEpub(fileBlob) {
  try {
    const zip = await JSZip.loadAsync(fileBlob);
    
    // 1. Locate container.xml
    const containerXmlText = await zip.file('META-INF/container.xml').async('text');
    const parser = new DOMParser();
    const containerDoc = parser.parseFromString(containerXmlText, 'text/xml');
    
    const rootfileEl = containerDoc.getElementsByTagName('rootfile')[0];
    if (!rootfileEl) throw new Error('Không tìm thấy rootfile trong container.xml');
    
    const opfPath = rootfileEl.getAttribute('full-path');
    const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1); // e.g. "OEBPS/" or ""

    // Helper to find file in zip case-insensitively and ignoring slash difference
    const findZipFile = (targetPath) => {
      const cleanPath = targetPath.split('#')[0].split('?')[0];
      const resolved = resolveAndCleanPath('', cleanPath);
      const normalized = resolved.toLowerCase();
      
      // Try exact match first
      let f = zip.file(resolved);
      if (f) return f;
      
      // Try case-insensitive and normalized slashes match
      const key = Object.keys(zip.files).find(k => k.toLowerCase().replace(/\\/g, '/').replace(/^\//, '') === normalized);
      if (key) return zip.file(key);
      
      // Try matching by suffix filename
      const baseName = resolved.substring(resolved.lastIndexOf('/') + 1).toLowerCase();
      if (baseName) {
        const key2 = Object.keys(zip.files).find(k => k.toLowerCase().replace(/\\/g, '/').endsWith('/' + baseName));
        if (key2) return zip.file(key2);
      }

      return null;
    };

    // 2. Read and parse OPF file
    const opfText = await zip.file(opfPath).async('text');
    const opfDoc = parser.parseFromString(opfText, 'text/xml');

    // Extract Metadata ignoring namespaces
    const titleEl = opfDoc.getElementsByTagName('dc:title')[0] || opfDoc.getElementsByTagName('title')[0];
    const title = titleEl ? titleEl.textContent.trim() : 'Sách không tên';

    const creatorEl = opfDoc.getElementsByTagName('dc:creator')[0] || opfDoc.getElementsByTagName('creator')[0];
    const author = creatorEl ? creatorEl.textContent.trim() : 'Tác giả khuyết danh';

    // Extract Manifest items (id -> href)
    const manifestItems = {};
    const itemEls = opfDoc.getElementsByTagName('item');
    let coverId = null;

    Array.from(itemEls).forEach(item => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      const properties = item.getAttribute('properties') || '';
      manifestItems[id] = href;

      if (properties.includes('cover-image') || (id && id.toLowerCase().includes('cover'))) {
        coverId = id;
      }
    });

    // Extract Cover image if exists
    let coverUrl = null;
    if (coverId && manifestItems[coverId]) {
      try {
        const resolvedCoverPath = resolveAndCleanPath(opfDir, manifestItems[coverId]);
        const coverFile = findZipFile(resolvedCoverPath);
        if (coverFile) {
          const coverBase64 = await coverFile.async('base64');
          const ext = resolvedCoverPath.split('.').pop().toLowerCase();
          const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
          coverUrl = `data:${mime};base64,${coverBase64}`;
        }
      } catch (e) {
        console.warn('Lỗi load ảnh bìa:', e);
      }
    }

    // Extract Spine order
    const spineEls = opfDoc.getElementsByTagName('itemref');
    const chapters = [];

    for (let i = 0; i < spineEls.length; i++) {
      const idref = spineEls[i].getAttribute('idref');
      const href = manifestItems[idref];
      
      if (href) {
        try {
          const resolvedChapterPath = resolveAndCleanPath(opfDir, href);
          const chapterFile = findZipFile(resolvedChapterPath);
          if (chapterFile) {
            let htmlText = await chapterFile.async('text');
            
            // Basic parsing of chapter content
            const chapterDoc = parser.parseFromString(htmlText, 'text/html');
            
            // Extract chapter title
            const hEl = chapterDoc.querySelector('h1, h2, h3, title');
            const chapterTitle = hEl ? hEl.textContent.trim() : `Chương ${chapters.length + 1}`;
            
            // Inline images inside chapter content by converting to base64
            const chapterDir = resolvedChapterPath.substring(0, resolvedChapterPath.lastIndexOf('/') + 1);
            const imgEls = chapterDoc.querySelectorAll('img');
            for (const img of imgEls) {
              const src = img.getAttribute('src');
              if (src && !src.startsWith('data:') && !src.startsWith('http:') && !src.startsWith('https:')) {
                try {
                  const resolvedImgPath = resolveAndCleanPath(chapterDir, src);
                  const imgFile = findZipFile(resolvedImgPath);
                  if (imgFile) {
                    const imgBase64 = await imgFile.async('base64');
                    const ext = resolvedImgPath.split('.').pop().toLowerCase();
                    const mime = ext === 'png' ? 'image/png' :
                                 ext === 'gif' ? 'image/gif' :
                                 ext === 'svg' ? 'image/svg+xml' : 'image/jpeg';
                    img.setAttribute('src', `data:${mime};base64,${imgBase64}`);
                  }
                } catch (imgErr) {
                  console.warn(`Lỗi load ảnh ${src} trong chương:`, imgErr);
                }
              }
            }

            // Extract body content HTML
            const bodyEl = chapterDoc.querySelector('body');
            let contentHtml = bodyEl ? bodyEl.innerHTML : htmlText;
            
            // Clean up scripts, iframes, styles that might disrupt our layout
            contentHtml = contentHtml
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
              .replace(/onload="[^"]*"/gi, '');

            chapters.push({
              id: idref,
              title: chapterTitle,
              content: contentHtml
            });
          }
        } catch (e) {
          console.error(`Lỗi đọc chương ${idref}:`, e);
        }
      }
    }

    return {
      title,
      author,
      coverUrl: coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80',
      chapters
    };
  } catch (error) {
    console.error('Lỗi parse file EPUB:', error);
    throw error;
  }
}

