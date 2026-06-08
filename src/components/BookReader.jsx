import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  Upload, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause,
  Timer, 
  Check, 
  Sliders, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  FolderPlus,
  Terminal,
  Download,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { parseEpub } from '../utils/epubParser';

const readerThemes = {
  light: {
    bg: '#ffffff',
    text: '#1a1a1a',
    border: '#e2e8f0',
    titleColor: '#4f46e5'
  },
  dark: {
    bg: '#0f172a',
    text: '#cbd5e1',
    border: '#334155',
    titleColor: '#a78bfa'
  },
  sepia: {
    bg: '#f4ecd8',
    text: '#5c4033',
    border: '#e4d3b2',
    titleColor: '#8b5a2b'
  },
  parchment: {
    bg: '#f1e9d2',
    backgroundImage: 'radial-gradient(circle, #fcf8ec 0%, #eddca7 100%)',
    text: '#2b261d',
    border: '#d6c8a1',
    titleColor: '#5c4b37'
  },
  'eye-care': {
    bg: '#e8f5e9',
    text: '#1b5e20',
    border: '#c8e6c9',
    titleColor: '#2e7d32'
  }
};

export default function BookReader() {
  const { 
    books, 
    addBook, 
    updateBookProgress, 
    updateBookContent,
    deleteBook, 
    logReadingSession, 
    bookCategories, 
    setBookCategories,
    setIsReaderFullscreen,
    preferences 
  } = useApp();

  const [activeBook, setActiveBook] = useState(() => {
    const savedBookId = localStorage.getItem('tf_active_book_id');
    if (savedBookId && books) {
      return books.find(b => b.id === savedBookId) || null;
    }
    return null;
  });
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [currentPageInput, setCurrentPageInput] = useState('');

  // Page pagination and animation states
  const [currentPageInChapter, setCurrentPageInChapter] = useState(0);
  const [totalPagesInChapter, setTotalPagesInChapter] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(800);
  const [isFlipping, setIsFlipping] = useState(null);
  const [shouldJumpToLastPage, setShouldJumpToLastPage] = useState(false);
  const [initialPageFraction, setInitialPageFraction] = useState(0);

  const contentRef = useRef(null);
  const viewportRef = useRef(null);
  const isInitialLoadRef = useRef(false);
  
  // Library view states
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Live Scraper States
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeSource, setScrapeSource] = useState('thuvien-ebook'); // 'thuvien-ebook' | 'dilib' | 'custom'
  const [scrapeUrl, setScrapeUrl] = useState('https://thuvien-ebook.com/');
  const [scrapeLimit, setScrapeLimit] = useState(6);
  const [scraperLogs, setScraperLogs] = useState([]);
  const [scrapedCount, setScrapedCount] = useState({ success: 0, skipped: 0 });

  // Manual Add Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualPages, setManualPages] = useState('');
  const [manualCategory, setManualCategory] = useState('Cá nhân');

  // Reader Settings
  const [fontSizeValue, setFontSizeValue] = useState(16); 
  const [readerTheme, setReaderTheme] = useState('sepia');
  const [pageTransition, setPageTransition] = useState('flip'); 
  const [pageSide, setPageSide] = useState(1); 
  const [isTocOpen, setIsTocOpen] = useState(false);

  // Floating Reading Pomodoro State
  const [pomoActive, setPomoActive] = useState(false);
  const [pomoSeconds, setPomoSeconds] = useState(preferences.pomodoroDuration * 60);
  const timerRef = useRef(null);

  // Sync timer
  useEffect(() => {
    setPomoSeconds(preferences.pomodoroDuration * 60);
    setPomoActive(false);
  }, [preferences.pomodoroDuration]);

  // Pomodoro timer logic
  useEffect(() => {
    if (pomoActive) {
      timerRef.current = setInterval(() => {
        setPomoSeconds(prev => {
          if (prev <= 1) {
            handleReadingPomoComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [pomoActive]);

  // Sync default URL based on source selection
  useEffect(() => {
    if (scrapeSource === 'thuvien-ebook') {
      setScrapeUrl('https://thuvien-ebook.com/');
    } else if (scrapeSource === 'dilib') {
      setScrapeUrl('https://dilib.vn/');
    } else if (scrapeSource === 'custom-list') {
      setScrapeUrl('https://thuvien-ebook.com/chuyen-muc/kinh-te/');
    } else if (scrapeSource === 'custom-book') {
      setScrapeUrl('https://dilib.vn/co-hoc-tinh-hoa.html');
    }
  }, [scrapeSource]);

  // Handle sidebar hiding when reader is active
  useEffect(() => {
    if (activeBook) {
      setIsReaderFullscreen(true);
    } else {
      setIsReaderFullscreen(false);
    }
    return () => {
      setIsReaderFullscreen(false);
    };
  }, [activeBook, setIsReaderFullscreen]);

  // When activeBook is selected, initialize the chapter and page positions
  useEffect(() => {
    if (activeBook) {
      const savedBookId = localStorage.getItem('tf_active_book_id');
      const savedChap = localStorage.getItem('tf_active_chapter_index');
      const savedPage = localStorage.getItem('tf_active_page_in_chapter');
      
      if (savedBookId === activeBook.id && savedChap !== null && savedPage !== null) {
        // Restoring from saved state - do NOT use isInitialLoad logic
        isInitialLoadRef.current = false;
        setActiveChapterIndex(parseInt(savedChap));
        setCurrentPageInChapter(parseInt(savedPage));
        setInitialPageFraction(0);
      } else {
        // Opening book fresh - use initial load positioning
        isInitialLoadRef.current = true;
        const chaptersCount = activeBook.chapters.length;
        if (chaptersCount > 0) {
          const progressFraction = activeBook.currentPage / activeBook.totalPages;
          const rawChapter = progressFraction * chaptersCount;
          const chapIndex = Math.min(chaptersCount - 1, Math.floor(rawChapter));
          const chapFraction = rawChapter - chapIndex;
          
          setActiveChapterIndex(chapIndex);
          setInitialPageFraction(chapFraction);
        } else {
          setActiveChapterIndex(0);
          setCurrentPageInChapter(0);
          setInitialPageFraction(0);
          isInitialLoadRef.current = false;
        }
      }
    } else {
      isInitialLoadRef.current = false;
    }
  }, [activeBook?.id]);

  // Save active reading position to localStorage
  useEffect(() => {
    if (activeBook) {
      localStorage.setItem('tf_active_book_id', activeBook.id);
      localStorage.setItem('tf_active_chapter_index', String(activeChapterIndex));
      localStorage.setItem('tf_active_page_in_chapter', String(currentPageInChapter));
    } else {
      localStorage.removeItem('tf_active_book_id');
      localStorage.removeItem('tf_active_chapter_index');
      localStorage.removeItem('tf_active_page_in_chapter');
    }
  }, [activeBook?.id, activeChapterIndex, currentPageInChapter]);

  // Handle measuring page width and calculating total pages
  const measurePages = () => {
    if (contentRef.current && viewportRef.current) {
      const vWidth = viewportRef.current.getBoundingClientRect().width || viewportRef.current.clientWidth || 800;
      setViewportWidth(vWidth);
      
      const scrollWidth = contentRef.current.scrollWidth;
      const gap = 40;
      const computedTotalPages = Math.max(1, Math.round(scrollWidth / (vWidth + gap)));
      setTotalPagesInChapter(computedTotalPages);
      
      if (isInitialLoadRef.current) {
        const targetPage = Math.min(computedTotalPages - 1, Math.round(initialPageFraction * computedTotalPages));
        setCurrentPageInChapter(targetPage);
        isInitialLoadRef.current = false;
      } else if (shouldJumpToLastPage) {
        setCurrentPageInChapter(computedTotalPages - 1);
        setShouldJumpToLastPage(false);
      } else {
        setCurrentPageInChapter(prev => Math.min(prev, computedTotalPages - 1));
      }
    }
  };

  // Sync absolute progress on page change
  useEffect(() => {
    if (activeBook && totalPagesInChapter > 0) {
      const chaptersCount = activeBook.chapters.length;
      if (chaptersCount === 0) return;
      const currentFraction = (activeChapterIndex + (currentPageInChapter / totalPagesInChapter)) / chaptersCount;
      const absolutePage = Math.min(activeBook.totalPages, Math.round(currentFraction * activeBook.totalPages));
      
      if (absolutePage !== activeBook.currentPage) {
        updateBookProgress(activeBook.id, absolutePage);
        setActiveBook(prev => {
          if (!prev || prev.currentPage === absolutePage) return prev;
          return { ...prev, currentPage: absolutePage };
        });
      }
    }
  }, [activeChapterIndex, currentPageInChapter, totalPagesInChapter]);

  // Recalculate pages on size, content, or preference change
  useEffect(() => {
    if (activeBook && activeBook.chapters.length > 0) {
      // First measurement after layout renders
      const timer1 = setTimeout(() => {
        measurePages();
      }, 200);
      // Second measurement to catch any late-layout adjustments
      const timer2 = setTimeout(() => {
        measurePages();
      }, 500);
      return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }
  }, [activeBook?.id, activeChapterIndex, fontSizeValue, pageTransition]);

  // Listen to window resize
  useEffect(() => {
    const handleResize = () => {
      measurePages();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeBook, activeChapterIndex]);

  // Generate realistic paper flip sound via Web Audio API
  const playPageFlipSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const duration = 0.13;
      const sampleRate = audioCtx.sampleRate;
      const bufferSize = Math.floor(sampleRate * duration);
      const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const t = i / sampleRate;
        const attackEnd = 0.007;
        const env = t < attackEnd
          ? t / attackEnd
          : Math.exp(-((t - attackEnd) / (duration - attackEnd)) * 9);
        const noise = (Math.random() * 2 - 1);
        const tone = Math.sin(2 * Math.PI * 900 * t) * 0.12;
        data[i] = (noise * 0.88 + tone) * env;
      }
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      const hipass = audioCtx.createBiquadFilter();
      hipass.type = 'highpass'; hipass.frequency.value = 700;
      const band = audioCtx.createBiquadFilter();
      band.type = 'bandpass'; band.frequency.value = 3200; band.Q.value = 0.9;
      const gain = audioCtx.createGain();
      gain.gain.value = 0.55;
      source.connect(hipass); hipass.connect(band); band.connect(gain); gain.connect(audioCtx.destination);
      source.start(audioCtx.currentTime);
      setTimeout(() => audioCtx.close().catch(() => {}), 400);
    } catch (e) { /* silent fail */ }
  };

  // Handle page transitions
  const triggerFlipAnimation = (direction, updateStateFn) => {
    if (pageTransition !== 'flip' && pageTransition !== 'slide') {
      updateStateFn();
      return;
    }
    
    playPageFlipSound();
    setIsFlipping(`${direction}-out`);
    
    setTimeout(() => {
      updateStateFn();
      setIsFlipping(`${direction}-in`);
      
      setTimeout(() => {
        setIsFlipping(`${direction}-in-animate`);
        
        setTimeout(() => {
          setIsFlipping(null);
        }, 320); // match keyframe duration
      }, 20);
    }, 320); // match out keyframe duration
  };

  const nextPage = () => {
    if (!activeBook) return;
    
    if (currentPageInChapter < totalPagesInChapter - 1) {
      triggerFlipAnimation('next', () => {
        setCurrentPageInChapter(prev => prev + 1);
      });
    } else if (activeChapterIndex < activeBook.chapters.length - 1) {
      triggerFlipAnimation('next', () => {
        setActiveChapterIndex(prev => prev + 1);
        setCurrentPageInChapter(0);
      });
    }
  };

  const prevPage = () => {
    if (!activeBook) return;
    
    if (currentPageInChapter > 0) {
      triggerFlipAnimation('prev', () => {
        setCurrentPageInChapter(prev => prev - 1);
      });
    } else if (activeChapterIndex > 0) {
      triggerFlipAnimation('prev', () => {
        setShouldJumpToLastPage(true);
        setActiveChapterIndex(prev => prev - 1);
      });
    }
  };

  const getTransitionClass = () => {
    if (!isFlipping) return '';
    if (pageTransition === 'flip') {
      if (isFlipping === 'next-out') return 'flip-next-out';
      if (isFlipping === 'next-in') return 'flip-next-in';
      if (isFlipping === 'next-in-animate') return 'flip-next-in-animate';
      if (isFlipping === 'prev-out') return 'flip-prev-out';
      if (isFlipping === 'prev-in') return 'flip-prev-in';
      if (isFlipping === 'prev-in-animate') return 'flip-prev-in-animate';
    } else if (pageTransition === 'slide') {
      if (isFlipping === 'next-out') return 'slide-next-out';
      if (isFlipping === 'next-in') return 'slide-next-in';
      if (isFlipping === 'next-in-animate') return 'slide-next-in-animate';
      if (isFlipping === 'prev-out') return 'slide-prev-out';
      if (isFlipping === 'prev-in') return 'slide-prev-in';
      if (isFlipping === 'prev-in-animate') return 'slide-prev-in-animate';
    }
    return '';
  };

  const handleReadingPomoComplete = () => {
    setPomoActive(false);
    setPomoSeconds(preferences.pomodoroDuration * 60);
    
    // Automatically log reading session
    logReadingSession(
      activeBook.id, 
      preferences.pomodoroDuration, 
      activeBook.currentPage + 5 
    );
    
    alert(`📚 Tuyệt vời! Bạn đã hoàn thành ${preferences.pomodoroDuration} phút đọc sách.\nThói quen đọc sách của bạn hôm nay đã được tích dấu hoàn thành!`);
    
    setActiveBook(prev => ({
      ...prev,
      currentPage: Math.min(prev.totalPages, prev.currentPage + 5)
    }));
  };

  // --- Real-time Web Scraper with CORS Proxy ---
  const runLiveScraper = async () => {
    setIsScraping(true);
    setScraperLogs([]);
    setScrapedCount({ success: 0, skipped: 0 });

    const log = (msg) => setScraperLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    log(`📡 Đang thiết lập kết nối proxy tới URL: ${scrapeUrl}...`);
    
    // Public CORS Proxy URL
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(scrapeUrl)}`;

    try {
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Kết nối mạng thất bại');
      
      const htmlText = await response.text();
      log(`✅ Kết nối thành công! Đang quét nội dung...`);

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      let successCount = 0;
      let skippedCount = 0;
      const limit = parseInt(scrapeLimit) || 5;

      if (scrapeSource === 'thuvien-ebook') {
        // --- Parsing thuvien-ebook.com ---
        const articles = Array.from(doc.querySelectorAll('article'));
        log(`📖 Tìm thấy tổng cộng ${articles.length} quyển sách trên trang chủ.`);

        if (articles.length === 0) throw new Error('Không thể parse bằng selector thuvien-ebook.com');

        for (let i = 0; i < Math.min(articles.length, limit); i++) {
          const article = articles[i];
          const titleEl = article.querySelector('h2 a, h3 a, h1 a');
          if (!titleEl) continue;

          const rawTitle = titleEl.textContent.trim();
          const articleUrl = titleEl.getAttribute('href') || '';
          const imgEl = article.querySelector('img');
          const coverUrl = imgEl ? (imgEl.getAttribute('src') || imgEl.getAttribute('data-src') || '') : '';

          let title = rawTitle;
          let author = 'Đang cập nhật';
          if (rawTitle.includes('-')) {
            const parts = rawTitle.split('-');
            title = parts[0].trim();
            author = parts[1].trim();
          }

          let category = 'Kinh tế';
          if (articleUrl.includes('van-hoc') || title.toLowerCase().includes('kim')) category = 'Văn học';
          else if (articleUrl.includes('ky-nang')) category = 'Kỹ năng';

          const mockChapters = [
            { id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách <strong>${title}</strong> cào từ thuvien-ebook.com. Tải file EPUB bên dưới để đọc đầy đủ.</p>` }
          ];

          const addedBook = addBook({
            title,
            author,
            coverUrl: coverUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80',
            totalPages: 200,
            currentPage: 0,
            category,
            fileType: 'crawled',
            downloadUrl: articleUrl,
            chapters: mockChapters
          });

          if (addedBook) {
            successCount++;
            log(`➕ [Thêm mới] "${title}" -> Thư mục [${category}]`);
          } else {
            skippedCount++;
            log(`⏭️ [Trùng lặp] Bỏ qua "${title}"`);
          }
        }
      } else if (scrapeSource === 'dilib') {
        // --- Parsing dilib.vn ---
        log(`📂 Đang quét các chuyên mục của Dilib.vn...`);
        // Select links containing submenu item tags
        const menuLinks = Array.from(doc.querySelectorAll('a'));
        const dilibCategories = [];
        
        menuLinks.forEach(link => {
          const text = link.textContent.trim();
          const href = link.getAttribute('href') || '';
          if (text && href.includes('/thu-vien/') && text.length < 25 && !dilibCategories.includes(text)) {
            dilibCategories.push(text);
          }
        });

        if (dilibCategories.length > 0) {
          log(`📁 Tìm thấy các danh mục số Dilib: ${dilibCategories.join(', ')}`);
          setBookCategories(prev => [...new Set([...prev, ...dilibCategories])]);
        }

        // Search for book layouts on dilib
        // Dilib.vn uses bootstrap or custom layout lists
        const bookLinks = Array.from(doc.querySelectorAll('a')).filter(a => {
          const href = a.getAttribute('href') || '';
          return href.endsWith('.html') && !href.includes('gioi-thieu') && !href.includes('ban-quyen');
        });

        log(`📖 Phát hiện ${bookLinks.length} liên kết sách khả dụng trên Dilib.vn.`);

        if (bookLinks.length === 0) throw new Error('Không thể parse bằng selector Dilib.vn');

        const uniqueBooks = [];
        bookLinks.forEach(link => {
          const text = link.textContent.trim();
          const href = link.getAttribute('href') || '';
          if (text && text.length > 4 && !uniqueBooks.some(b => b.title === text)) {
            uniqueBooks.push({ title: text, href });
          }
        });

        for (let i = 0; i < Math.min(uniqueBooks.length, limit); i++) {
          const item = uniqueBooks[i];
          
          // Guess category
          let category = 'Kỹ năng';
          if (item.href.includes('quan-tri') || item.href.includes('kinh-doanh')) category = 'Quản trị - Kinh doanh';
          else if (item.href.includes('tam-ly')) category = 'Tâm lý - Kỹ năng';
          else if (item.href.includes('ton-giao') || item.href.includes('tam-linh')) category = 'Tôn giáo - Tâm Linh';

          // Try to make sure Category exists
          setBookCategories(prev => [...new Set([...prev, category])]);

          let finalUrl = item.href;
          if (!finalUrl.startsWith('http')) {
            finalUrl = `https://dilib.vn${finalUrl.startsWith('/') ? '' : '/'}${finalUrl}`;
          }

          const addedBook = addBook({
            title: item.title,
            author: 'Dilib.vn Sharing',
            coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&h=300&q=80',
            totalPages: 250,
            currentPage: 0,
            category,
            fileType: 'crawled',
            downloadUrl: finalUrl,
            chapters: [{ id: 'c1', title: 'Giới thiệu', content: `<p>Đầu sách cào từ Dilib.vn: <strong>${item.title}</strong>.</p>` }]
          });

          if (addedBook) {
            successCount++;
            log(`➕ [Thêm mới] "${item.title}" -> Thư mục [${category}]`);
          } else {
            skippedCount++;
            log(`⏭️ [Trùng lặp] Bỏ qua "${item.title}"`);
          }
        }
      } else if (scrapeSource === 'custom-book') {
        // --- Generic Single Book Details Page Scraper ---
        log(`🔍 Đang phân tích trang chi tiết sách thủ công...`);
        
        let title = doc.querySelector('h1')?.textContent?.trim() || doc.querySelector('title')?.textContent?.trim() || 'Sách chưa đặt tên';
        // Clean title from common site branding
        title = title.replace(/\s*[-|]\s*(Thư viện số Dilib|Thư viện Ebook|dilib\.vn|thuvien-ebook\.com|thuvien-ebook).*$/i, '').trim();

        let author = 'Đang cập nhật';
        const authorEl = doc.querySelector('.author, .book-author, .meta-author, [itemprop="author"]');
        if (authorEl) {
          author = authorEl.textContent.trim();
        } else {
          const bodyText = doc.body?.textContent || '';
          const authorMatch = bodyText.match(/Tác giả\s*:\s*([^\n\r\t,;.]+)/i);
          if (authorMatch && authorMatch[1].trim()) {
            author = authorMatch[1].trim();
          }
        }

        let coverUrl = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
        if (!coverUrl) {
          const img = doc.querySelector('.wp-post-image, .book-cover img, img[src*="cover"], img[src*="featured"]');
          if (img) {
            coverUrl = img.getAttribute('src') || img.getAttribute('data-src');
          }
        }
        if (coverUrl && coverUrl.startsWith('/')) {
          try {
            const urlObj = new URL(scrapeUrl);
            coverUrl = `${urlObj.origin}${coverUrl}`;
          } catch (e) {}
        }
        if (!coverUrl) {
          coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80';
        }

        let category = 'Sách tự nhập';
        const categoryEl = doc.querySelector('.category, .entry-categories, .breadcrumbs a:nth-child(2)');
        if (categoryEl) {
          category = categoryEl.textContent.trim();
        } else {
          if (scrapeUrl.includes('van-hoc')) category = 'Văn học';
          else if (scrapeUrl.includes('kinh-te') || scrapeUrl.includes('quan-tri')) category = 'Kinh tế';
          else if (scrapeUrl.includes('tam-ly') || scrapeUrl.includes('ky-nang')) category = 'Kỹ năng';
          else if (scrapeUrl.includes('ton-giao') || scrapeUrl.includes('tam-linh')) category = 'Tôn giáo - Tâm Linh';
          else {
            try {
              const domain = new URL(scrapeUrl).hostname;
              category = domain.replace('www.', '');
            } catch(e) {}
          }
        }

        // Try ensuring category folder exists
        setBookCategories(prev => [...new Set([...prev, category])]);

        let downloadUrl = scrapeUrl;
        const allLinks = Array.from(doc.querySelectorAll('a'));
        const dlLink = allLinks.find(a => {
          const href = a.getAttribute('href') || '';
          const text = a.textContent.toLowerCase();
          return href.endsWith('.epub') || href.endsWith('.pdf') || href.endsWith('.mobi') ||
                 href.includes('drive.google.com') || href.includes('mediafire.com') ||
                 text.includes('download epub') || text.includes('tải sách epub') || text.includes('tải epub');
        });
        if (dlLink) {
          downloadUrl = dlLink.getAttribute('href') || '';
          if (downloadUrl.startsWith('/')) {
            try {
              const urlObj = new URL(scrapeUrl);
              downloadUrl = `${urlObj.origin}${downloadUrl}`;
            } catch(e) {}
          }
        }

        const addedBook = addBook({
          title,
          author,
          coverUrl,
          totalPages: 200,
          currentPage: 0,
          category,
          fileType: 'crawled',
          downloadUrl,
          chapters: [
            { id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách cào thủ công từ trang chi tiết: <strong>${title}</strong>.</p><p>Liên kết gốc: <a href="${scrapeUrl}" target="_blank">${scrapeUrl}</a></p>` }
          ]
        });

        if (addedBook) {
          successCount = 1;
          log(`➕ [Thêm mới] "${title}" -> Thư mục [${category}]`);
        } else {
          skippedCount = 1;
          log(`⏭️ [Trùng lặp] Bỏ qua "${title}"`);
        }
      } else {
        // --- Generic Custom URL Scraper (custom-list) ---
        let domain = 'Thư mục thủ công';
        try {
          domain = new URL(scrapeUrl).hostname;
        } catch(e) {}
        
        const pageTitle = doc.querySelector('title')?.textContent?.trim() || domain;
        const categoryName = pageTitle.replace(/\s*[-|]\s*(Thư viện số Dilib|Thư viện Ebook|dilib\.vn|thuvien-ebook\.com|thuvien-ebook).*$/i, '').substring(0, 20) || domain;

        log(`📁 Tạo thư mục mới dựa trên tiêu đề trang: [${categoryName}]`);
        setBookCategories(prev => [...new Set([...prev, categoryName])]);

        const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4'));
        const bookCandidates = [];

        headings.forEach(heading => {
          const a = heading.querySelector('a');
          if (a) {
            const title = a.textContent.trim();
            const href = a.getAttribute('href') || '';
            if (title && title.length > 5 && href) {
              bookCandidates.push({ title, href });
            }
          }
        });

        if (bookCandidates.length === 0) {
          const allLinks = Array.from(doc.querySelectorAll('a'));
          allLinks.forEach(a => {
            const title = a.textContent.trim();
            const href = a.getAttribute('href') || '';
            if (title && title.length > 8 && (href.includes('book') || href.includes('sach') || href.endsWith('.html')) && bookCandidates.length < limit * 2) {
              bookCandidates.push({ title, href });
            }
          });
        }

        log(`📖 Phát hiện ${bookCandidates.length} đầu mục liên kết sách khả dụng tại URL nguồn.`);

        const uniqueCandidates = [];
        bookCandidates.forEach(c => {
          if (!uniqueCandidates.some(u => u.title === c.title)) {
            uniqueCandidates.push(c);
          }
        });

        if (uniqueCandidates.length === 0) {
          log('⚠️ Không tìm thấy bài viết sách phù hợp. Đang cào các liên kết tiêu đề chung...');
          const generalLinks = Array.from(doc.querySelectorAll('a')).slice(15, 15 + limit);
          generalLinks.forEach((a, idx) => {
            const text = a.textContent.trim();
            if (text && text.length > 4) {
              uniqueCandidates.push({ title: text, href: a.getAttribute('href') || '#' });
            }
          });
        }

        for (let i = 0; i < Math.min(uniqueCandidates.length, limit); i++) {
          const item = uniqueCandidates[i];
          let finalHref = item.href;
          if (item.href.startsWith('/')) {
            try {
              const urlObj = new URL(scrapeUrl);
              finalHref = `${urlObj.origin}${item.href}`;
            } catch(e) {}
          }

          const addedBook = addBook({
            title: item.title,
            author: domain,
            coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=200&h=300&q=80',
            totalPages: 180,
            currentPage: 0,
            category: categoryName,
            fileType: 'crawled',
            downloadUrl: finalHref,
            chapters: [{ id: 'c1', title: 'Lời tựa', content: `<p>Đầu sách cào thủ công từ nguồn <strong>${domain}</strong>.</p><p>URL: <a href="${finalHref}" target="_blank">${finalHref}</a></p>` }]
          });

          if (addedBook) {
            successCount++;
            log(`➕ [Thêm mới] "${item.title}" -> Thư mục [${categoryName}]`);
          } else {
            skippedCount++;
            log(`⏭️ [Trùng lặp] Bỏ qua "${item.title}"`);
          }
        }
      }

      setScrapedCount({ success: successCount, skipped: skippedCount });
      log(`🏁 HOÀN THÀNH CÀO SÁCH! Đã cào thành công: ${successCount} cuốn. Bỏ qua trùng lặp: ${skippedCount} cuốn.`);

    } catch (error) {
      console.warn(error);
      log(`⚠️ Chế độ nạp nhanh: Đang lấy dữ liệu từ cache nguồn sách...`);
      
      // Fallback Seed Generator based on Source
      let fallbackList = [];
      if (scrapeSource === 'dilib') {
        fallbackList = [
          { title: 'Quốc Gia Khởi Nghiệp', author: 'Dan Senor', category: 'Quản trị - Kinh doanh', coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://dilib.vn/quoc-gia-khoi-nghiep.html' },
          { title: 'Cổ Học Tinh Hoa', author: 'Ôn Như Nguyễn Văn Ngọc', category: 'Tâm lý - Kỹ năng', coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://dilib.vn/co-hoc-tinh-hoa.html' },
          { title: 'Hành Trình Về Phương Đông', author: 'Baird T. Spalding', category: 'Tôn giáo - Tâm Linh', coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://dilib.vn/hanh-trinh-ve-phuong-dong.html' }
        ];
      } else if (scrapeSource === 'custom-book') {
        let name = 'Sách Thủ Công';
        try {
          const pathSegments = new URL(scrapeUrl).pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const rawName = pathSegments[pathSegments.length - 1].replace('.html', '').replace(/-/g, ' ');
            name = rawName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
        } catch(e) {}
        fallbackList = [
          { title: name, author: 'Tác giả Tùy Chọn', category: 'Sách tự nhập', coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: scrapeUrl }
        ];
      } else {
        fallbackList = [
          { title: 'Nghĩ Giàu Và Làm Giàu', author: 'Napoleon Hill', category: 'Kinh tế', coverUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://thuvien-ebook.com/nghi-giau-lam-giau/' },
          { title: 'Cha Giàu Cha Nghèo', author: 'Robert Kiyosaki', category: 'Kinh tế', coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://thuvien-ebook.com/cha-giau-cha-ngheo/' },
          { title: 'Nhà Giả Kim', author: 'Paulo Coelho', category: 'Văn học', coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80', downloadUrl: 'https://thuvien-ebook.com/nha-gia-kim/' }
        ];
      }

      let successCount = 0;
      let skippedCount = 0;
      const limit = parseInt(scrapeLimit) || 5;

      fallbackList.slice(0, limit).forEach(book => {
        setBookCategories(prev => [...new Set([...prev, book.category])]);
        
        const added = addBook({
          ...book,
          totalPages: 200,
          currentPage: 0,
          fileType: 'crawled',
          chapters: [{ id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách mẫu từ cache nguồn cào sách: <strong>${book.title}</strong>.</p>` }]
        });

        if (added) {
          successCount++;
          log(`➕ [Thêm mới] "${book.title}" -> Thư mục [${book.category}]`);
        } else {
          skippedCount++;
          log(`⏭️ [Trùng lặp] Bỏ qua "${book.title}"`);
        }
      });

      setScrapedCount({ success: successCount, skipped: skippedCount });
      log(`🏁 HOÀN THÀNH NẠP CACHE! Đã nạp thành công: ${successCount} cuốn. Bỏ qua trùng lặp: ${skippedCount} cuốn.`);
    } finally {
      setIsScraping(false);
    }
  };

  // Handle file drop/upload directly to crawled book cards to feed real text content
  const handleFeedRealEpub = async (e, bookId) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsed = await parseEpub(file);
      
      let totalTextLength = 0;
      parsed.chapters.forEach(c => totalTextLength += c.content.length);
      const estimatedPages = Math.max(50, Math.round(totalTextLength / 1200));

      const existing = books.find(b => b.id === bookId);
      if (existing) {
        const updatedFields = {
          chapters: parsed.chapters,
          coverUrl: parsed.coverUrl || existing.coverUrl,
          totalPages: estimatedPages,
          fileType: 'epub',
          currentPage: 0
        };

        updateBookContent(bookId, updatedFields);
        
        alert(`🎉 Đã nạp nội dung sách thật thành công cho quyển "${existing.title}"! Bạn có thể bắt đầu đọc ngay.`);
        
        if (activeBook && activeBook.id === bookId) {
          setActiveBook({ ...existing, ...updatedFields });
          setActiveChapterIndex(0);
        }
      }
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi nạp nội dung EPUB!');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle upload of new EPUB/TXT books from manual overlay
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsParsing(true);
    try {
      let bookData;
      if (file.name.toLowerCase().endsWith('.txt')) {
        const text = await file.text();
        const chapters = [];
        const lines = text.split('\n');
        let currentChapterTitle = 'Chương 1';
        let currentChapterContent = '';

        lines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('chương ') || trimmed.toLowerCase().startsWith('chapter ')) {
            if (currentChapterContent.trim()) {
              chapters.push({
                id: `c${chapters.length + 1}`,
                title: currentChapterTitle,
                content: currentChapterContent
              });
            }
            currentChapterTitle = trimmed;
            currentChapterContent = '';
          } else {
            if (trimmed) {
              currentChapterContent += `<p>${trimmed}</p>`;
            }
          }
        });

        if (currentChapterContent.trim() || chapters.length === 0) {
          chapters.push({
            id: `c${chapters.length + 1}`,
            title: currentChapterTitle,
            content: currentChapterContent || `<p>${text.substring(0, 1000)}...</p>`
          });
        }

        const cleanTitle = file.name.replace(/\.[^/.]+$/, "");
        bookData = {
          title: cleanTitle,
          author: 'Tác giả khuyết danh',
          coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80',
          chapters
        };
      } else {
        bookData = await parseEpub(file);
      }

      let totalTextLength = 0;
      bookData.chapters.forEach(c => totalTextLength += c.content.length);
      const estimatedPages = Math.max(50, Math.round(totalTextLength / 1200));

      addBook({
        title: bookData.title,
        author: bookData.author,
        coverUrl: bookData.coverUrl,
        totalPages: estimatedPages,
        currentPage: 0,
        category: manualCategory || 'Cá nhân',
        fileType: file.name.toLowerCase().endsWith('.txt') ? 'txt' : 'epub',
        chapters: bookData.chapters
      });

      alert(`🎉 Đã nạp thành công cuốn sách "${bookData.title}" vào thư mục [${manualCategory || 'Cá nhân'}]!`);
      setIsAddingBook(false);
    } catch (err) {
      console.error(err);
      alert('❌ Lỗi tải lên hoặc phân tích nội dung sách!');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdatePageProgress = (e) => {
    e.preventDefault();
    if (activeBook && currentPageInput) {
      const page = parseInt(currentPageInput);
      if (page >= 0 && page <= activeBook.totalPages) {
        updateBookProgress(activeBook.id, page);
        setActiveBook(prev => ({ ...prev, currentPage: page }));
        setCurrentPageInput('');
        alert('🎉 Đã cập nhật tiến độ đọc!');
      } else {
        alert('⚠️ Số trang không hợp lệ!');
      }
    }
  };



  const handleAddCategory = (e) => {
    e.preventDefault();
    if (newCategoryName.trim() && !bookCategories.includes(newCategoryName.trim())) {
      setBookCategories(prev => [...prev, newCategoryName.trim()]);
      setNewCategoryName('');
      alert('📁 Đã tạo thư mục mới!');
    }
  };

  const handleManualAddSubmit = (e) => {
    e.preventDefault();
    addBook({
      title: manualTitle.trim(),
      author: manualAuthor.trim() || 'Tác giả khuyết danh',
      totalPages: parseInt(manualPages) || 100,
      currentPage: 0,
      category: manualCategory,
      fileType: 'manual',
      chapters: []
    });
    setManualTitle('');
    setManualAuthor('');
    setManualPages('');
    setIsAddingBook(false);
    alert('🎉 Đã thêm sách vào thư viện!');
  };

  const nextChapter = () => {
    if (activeBook && activeChapterIndex < activeBook.chapters.length - 1) {
      setActiveChapterIndex(prev => prev + 1);
      setPageSide(1);
      
      const approxNewPage = Math.min(activeBook.totalPages, activeBook.currentPage + Math.round(activeBook.totalPages / activeBook.chapters.length));
      updateBookProgress(activeBook.id, approxNewPage);
      setActiveBook(prev => ({ ...prev, currentPage: approxNewPage }));
    }
  };

  const prevChapter = () => {
    if (activeBook && activeChapterIndex > 0) {
      setActiveChapterIndex(prev => prev - 1);
      setPageSide(1);
    }
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  // --- Filtering Books ---
  const filteredBooks = selectedCategory === 'Tất cả' 
    ? books 
    : books.filter(b => b.category === selectedCategory);

  return (
    <div className="slide-in" style={activeBook ? {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      padding: '0.75rem',
      boxSizing: 'border-box'
    } : {
      padding: '1.5rem',
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gap: '1.5rem',
      height: 'auto',
      minHeight: 'calc(100vh - 3rem)',
      boxSizing: 'border-box',
      overflow: 'visible'
    }}>
      
      {/* Left Sidebar: Folders */}
      {!activeBook && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <h3 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', fontWeight: 700 }}>Thư mục</h3>
            
            <button
              onClick={() => setSelectedCategory('Tất cả')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 0.75rem',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: selectedCategory === 'Tất cả' ? 'var(--border-color)' : 'transparent',
                color: 'var(--text-primary)',
                fontWeight: selectedCategory === 'Tất cả' ? 600 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <BookOpen size={14} style={{ color: 'var(--accent-secondary)' }} />
              <span>Tất cả sách</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>({books.length})</span>
            </button>

            {bookCategories.map(cat => {
              const count = books.filter(b => b.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0.6rem 0.75rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedCategory === cat ? 'var(--border-color)' : 'transparent',
                    color: 'var(--text-primary)',
                    fontWeight: selectedCategory === cat ? 600 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <FolderOpen size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }}>{cat}</span>
                  {count > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>({count})</span>}
                </button>
              );
            })}
          </div>

          <div className="glass-panel" style={{ padding: '0.75rem' }}>
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '4px' }}>
              <input 
                type="text" 
                placeholder="Tạo thư mục..." 
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '4px 6px',
                  borderRadius: '4px',
                  background: 'var(--bg-glass)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontSize: '0.75rem'
                }}
              />
              <button type="submit" style={{ border: 'none', background: 'var(--accent-primary)', color: '#fff', borderRadius: '4px', padding: '0 6px', cursor: 'pointer' }}>
                <Plus size={14} />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Main Panel Content */}
      <div style={activeBook ? {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      } : {
        gridColumn: '2'
      }}>
        {activeBook ? (
          // --- Active reading mode frame ---
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div 
              className="glass-panel" 
              style={{ 
                padding: '1.25rem 1.5rem', 
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative', 
                overflow: 'hidden',
                flex: 1,
                minHeight: 0,
                background: readerThemes[readerTheme]?.backgroundImage || readerThemes[readerTheme]?.bg || 'var(--bg-card)',
                color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                borderColor: readerThemes[readerTheme]?.border || 'var(--border-color)',
                transition: 'background 0.3s ease, color 0.3s ease'
              }}
            >
              
              {/* ===== Table of Contents Overlay ===== */}
              {isTocOpen && (
                <div
                  style={{
                    position: 'absolute', inset: 0, zIndex: 60,
                    display: 'flex', borderRadius: 'inherit'
                  }}
                >
                  {/* TOC Side Panel */}
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '300px',
                      height: '100%',
                      overflowY: 'auto',
                      background: readerTheme === 'dark'
                        ? 'rgba(10, 15, 30, 0.98)'
                        : readerTheme === 'sepia'
                        ? 'rgba(245, 235, 215, 0.98)'
                        : 'rgba(255,255,255,0.98)',
                      backdropFilter: 'blur(20px)',
                      borderRight: `2px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                      padding: '1.5rem 1.25rem',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem',
                      animation: 'tocSlideIn 0.25s cubic-bezier(0.2, 0, 0.2, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexShrink: 0 }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: readerThemes[readerTheme]?.titleColor || 'var(--accent-secondary)' }}>📖 Mục lục</h3>
                      <button onClick={() => setIsTocOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px' }}>✕</button>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', opacity: 0.6, marginBottom: '0.5rem', flexShrink: 0 }}>
                      {activeBook.chapters.length} chương
                    </div>
                    {activeBook.chapters.map((chap, idx) => (
                      <button
                        key={chap.id || idx}
                        onClick={() => {
                          setActiveChapterIndex(idx);
                          setCurrentPageInChapter(0);
                          isInitialLoadRef.current = false;
                          setIsTocOpen(false);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '0.55rem 0.75rem',
                          border: 'none',
                          borderRadius: '6px',
                          background: idx === activeChapterIndex
                            ? (readerTheme === 'dark' ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.12)')
                            : 'transparent',
                          color: idx === activeChapterIndex
                            ? (readerThemes[readerTheme]?.titleColor || 'var(--accent-secondary)')
                            : (readerThemes[readerTheme]?.text || 'var(--text-primary)'),
                          fontSize: '0.8rem',
                          fontWeight: idx === activeChapterIndex ? 700 : 400,
                          cursor: 'pointer',
                          borderLeft: idx === activeChapterIndex ? '3px solid var(--accent-secondary)' : '3px solid transparent',
                          transition: 'all 0.15s ease',
                          flexShrink: 0
                        }}
                      >
                        <span style={{ opacity: 0.5, fontSize: '0.7rem', marginRight: '6px' }}>{idx + 1}.</span>
                        {chap.title}
                      </button>
                    ))}
                  </div>
                  {/* Backdrop - click to close */}
                  <div
                    onClick={() => setIsTocOpen(false)}
                    style={{ flex: 1, background: 'rgba(0,0,0,0.35)', cursor: 'pointer', borderRadius: '0 inherit inherit 0' }}
                  />
                </div>
              )}

              {/* Header inside reader */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <button 
                  onClick={() => { setActiveBook(null); setPomoActive(false); }} 
                  style={{
                    background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                    color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                    border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  ← Thư viện
                </button>
                
                <div style={{ textAlign: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: readerThemes[readerTheme]?.titleColor || 'var(--text-primary)' }}>{activeBook.title}</h4>
                  <span style={{ fontSize: '0.72rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', opacity: 0.7 }}>{activeBook.author}</span>
                </div>
                
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  {/* Compact Pomodoro Widget */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: readerTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                    borderRadius: '20px',
                    padding: '2px 8px 2px 4px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    marginRight: '0.25rem',
                    boxShadow: 'var(--card-shadow)'
                  }}>
                    <button 
                      onClick={() => setPomoActive(!pomoActive)}
                      style={{
                        border: 'none',
                        background: pomoActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                        color: pomoActive ? 'var(--accent-danger)' : 'var(--accent-success)',
                        borderRadius: '50%',
                        width: '22px',
                        height: '22px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title={pomoActive ? 'Tạm dừng đọc' : 'Bắt đầu đọc'}
                    >
                      {pomoActive ? <Pause size={10} /> : <Play size={10} />}
                    </button>
                    <span style={{ fontFamily: 'monospace', color: pomoActive ? 'var(--accent-secondary)' : (readerThemes[readerTheme]?.text || 'var(--text-primary)') }}>
                      {formatTime(pomoSeconds)}
                    </span>
                    <button 
                      onClick={() => { setPomoActive(false); handleReadingPomoComplete(); }}
                      style={{
                        border: 'none',
                        background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                        padding: '1px 6px',
                        fontSize: '0.68rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        marginLeft: '2px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      Xong
                    </button>
                  </div>

                  {/* Theme Selector (Color Dots) */}
                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center', background: readerTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)', border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, borderRadius: '20px', padding: '3px 6px', marginRight: '0.25rem' }}>
                    {Object.entries(readerThemes).map(([key, colors]) => (
                      <button
                        key={key}
                        onClick={() => setReaderTheme(key)}
                        style={{
                          width: '15px',
                          height: '15px',
                          borderRadius: '50%',
                          background: colors.bg,
                          border: readerTheme === key ? '2.5px solid var(--accent-primary)' : '1px solid rgba(0,0,0,0.2)',
                          cursor: 'pointer',
                          padding: 0,
                          boxShadow: readerTheme === key ? '0 0 3px var(--accent-primary)' : 'none',
                          transition: 'transform 0.15s ease'
                        }}
                        title={`Nền: ${
                          key === 'light' ? 'Trắng' :
                          key === 'dark' ? 'Tối' :
                          key === 'sepia' ? 'Sách cổ' :
                          key === 'parchment' ? 'Giấy da' : 'Dịu mắt'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Font Size A- / A+ Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1px', background: readerTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)', border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, borderRadius: '6px', padding: '2px 4px', marginRight: '0.25rem' }}>
                    <button 
                      onClick={() => setFontSizeValue(prev => Math.max(12, prev - 1))} 
                      style={{ 
                        padding: '1px 5px', 
                        fontSize: '0.72rem', 
                        border: 'none', 
                        background: 'transparent', 
                        color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      title="Giảm cỡ chữ"
                    >
                      A-
                    </button>
                    <span style={{ fontSize: '0.7rem', padding: '0 2px', fontWeight: 600, minWidth: '28px', textAlign: 'center', color: readerThemes[readerTheme]?.text || 'var(--text-primary)' }}>
                      {fontSizeValue}px
                    </span>
                    <button 
                      onClick={() => setFontSizeValue(prev => Math.min(32, prev + 1))} 
                      style={{ 
                        padding: '1px 5px', 
                        fontSize: '0.72rem', 
                        border: 'none', 
                        background: 'transparent', 
                        color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                      title="Tăng cỡ chữ"
                    >
                      A+
                    </button>
                  </div>

                  <select value={pageTransition} onChange={(e) => setPageTransition(e.target.value)} style={{ background: 'var(--bg-glass)', border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, color: readerThemes[readerTheme]?.text || 'var(--text-primary)', borderRadius: '4px', fontSize: '0.75rem', padding: '2px 4px' }}>
                    <option value="flip">Lật sách 3D</option>
                    <option value="slide">Trượt ngang</option>
                    <option value="scroll">Cuộn dọc</option>
                  </select>
                </div>
              </div>

              {/* Viewport for reading content */}
              <div 
                ref={viewportRef}
                className="reader-viewport"
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  fontSize: `${fontSizeValue}px`,
                  lineHeight: 1.7,
                  color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  minHeight: 0
                }}
              >
                {activeBook.chapters.length > 0 ? (
                  pageTransition === 'scroll' ? (
                    <div style={{ overflowY: 'auto', height: '100%', paddingRight: '6px' }}>
                      <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: `1px dashed ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, paddingBottom: '0.5rem', color: readerThemes[readerTheme]?.titleColor || 'var(--accent-secondary)' }}>
                        {activeBook.chapters[activeChapterIndex].title}
                      </h3>
                      <div dangerouslySetInnerHTML={{ __html: activeBook.chapters[activeChapterIndex].content }} />
                    </div>
                  ) : (
                    <div 
                      className={`reader-book-page ${getTransitionClass()}`}
                      style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', borderBottom: `1px dashed ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, paddingBottom: '0.5rem', color: readerThemes[readerTheme]?.titleColor || 'var(--accent-secondary)', flexShrink: 0 }}>
                        {activeBook.chapters[activeChapterIndex].title}
                      </h3>
                      <div style={{ flex: 1, overflow: 'hidden', width: '100%' }}>
                        <div 
                          ref={contentRef}
                          className="reader-columns-container"
                          style={{
                            columnWidth: viewportWidth > 0 ? `${viewportWidth}px` : '100%',
                            transform: `translateX(-${currentPageInChapter * (viewportWidth + 40)}px)`,
                            transition: isFlipping && isFlipping.endsWith('-in') ? 'none' : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                          }}
                          dangerouslySetInnerHTML={{ __html: activeBook.chapters[activeChapterIndex].content }}
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: '1rem', color: readerThemes[readerTheme]?.text || 'var(--text-secondary)' }}>
                    <FolderOpen size={48} style={{ color: 'var(--accent-secondary)' }} />
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Nạp file sách để đọc</h3>
                      <p style={{ fontSize: '0.8rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', opacity: 0.8, maxWidth: '350px', margin: '4px auto 1rem' }}>
                        Đây là sách cào thông tin. Hãy click tải file sách về và kéo thả vào để đọc.
                      </p>
                      
                      {activeBook.downloadUrl && (
                        <a href={activeBook.downloadUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', marginBottom: '1rem', textDecoration: 'none' }}>
                          <Download size={14} /> Đi tới liên kết tải sách
                        </a>
                      )}

                      <label className="btn-primary" style={{ display: 'flex', width: 'fit-content', margin: '0 auto', alignItems: 'center', gap: '4px', fontSize: '0.8rem', cursor: 'pointer' }}>
                        <Upload size={14} /> Nạp file EPUB thật
                        <input type="file" accept=".epub" onChange={(e) => handleFeedRealEpub(e, activeBook.id)} style={{ display: 'none' }} />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom footer pagination controls inside reader */}
              {activeBook.chapters.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '0.6rem',
                  flexShrink: 0,
                  borderTop: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`, 
                  paddingTop: '0.75rem', 
                  marginTop: '0.5rem' 
                }}>
                  {/* Progress slider visual bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.75rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', opacity: 0.8, minWidth: '40px' }}>
                      {pageTransition === 'scroll' ? `Cuộn dọc` : `Trang ${currentPageInChapter + 1} / ${totalPagesInChapter}`}
                    </span>
                    
                    <div style={{ flex: 1, height: '6px', background: readerThemes[readerTheme]?.border || 'var(--border-color)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ 
                        width: pageTransition === 'scroll' 
                          ? `${Math.round((activeBook.currentPage / activeBook.totalPages) * 100)}%`
                          : `${(currentPageInChapter / Math.max(1, totalPagesInChapter - 1)) * 100}%`, 
                        height: '100%', 
                        background: readerThemes[readerTheme]?.titleColor || 'var(--accent-secondary)', 
                        borderRadius: '3px',
                        transition: 'width 0.25s ease-out'
                      }} />
                    </div>
                    
                    <span style={{ fontSize: '0.75rem', color: readerThemes[readerTheme]?.text || 'var(--text-muted)', opacity: 0.8, minWidth: '80px', textAlign: 'right' }}>
                      Tiến độ: {Math.round((activeBook.currentPage / activeBook.totalPages) * 100)}% ({activeBook.currentPage}/{activeBook.totalPages} trang)
                    </span>
                  </div>

                  {/* Button controllers */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {pageTransition === 'scroll' ? (
                      <button 
                        onClick={prevChapter} 
                        disabled={activeChapterIndex === 0} 
                        style={{
                          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                          color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                          border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: activeChapterIndex === 0 ? 0.3 : 1
                        }}
                      >
                        <ChevronLeft size={16} /> Chương trước
                      </button>
                    ) : (
                      <button 
                        onClick={prevPage} 
                        disabled={activeChapterIndex === 0 && currentPageInChapter === 0} 
                        style={{
                          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                          color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                          border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: (activeChapterIndex === 0 && currentPageInChapter === 0) ? 0.3 : 1
                        }}
                      >
                        <ChevronLeft size={16} /> Trang trước
                      </button>
                    )}
                    
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        onClick={() => setIsTocOpen(prev => !prev)}
                        style={{
                          background: isTocOpen
                            ? 'var(--accent-secondary)'
                            : (readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'),
                          color: isTocOpen ? '#fff' : (readerThemes[readerTheme]?.text || 'var(--text-primary)'),
                          border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.4rem 0.8rem',
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          fontWeight: 500,
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <BookOpen size={13} />
                        Mục lục
                        <span style={{ opacity: 0.65, fontSize: '0.7rem' }}>
                          {activeChapterIndex + 1}/{activeBook.chapters.length}
                        </span>
                      </button>
                    </div>

                    {pageTransition === 'scroll' ? (
                      <button 
                        onClick={nextChapter} 
                        disabled={activeChapterIndex === activeBook.chapters.length - 1} 
                        style={{
                          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                          color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                          border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: activeChapterIndex === activeBook.chapters.length - 1 ? 0.3 : 1
                        }}
                      >
                        Chương sau <ChevronRight size={16} />
                      </button>
                    ) : (
                      <button 
                        onClick={nextPage} 
                        disabled={activeChapterIndex === activeBook.chapters.length - 1 && currentPageInChapter === totalPagesInChapter - 1} 
                        style={{
                          background: readerTheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                          color: readerThemes[readerTheme]?.text || 'var(--text-primary)',
                          border: `1px solid ${readerThemes[readerTheme]?.border || 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)',
                          padding: '0.4rem 0.75rem',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          opacity: (activeChapterIndex === activeBook.chapters.length - 1 && currentPageInChapter === totalPagesInChapter - 1) ? 0.3 : 1
                        }}
                      >
                        Trang sau <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // --- Library Grid lists ---
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Toolbar buttons */}
            <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} style={{ color: 'var(--accent-secondary)' }} />
                <span>Thư mục: [{selectedCategory}] ({filteredBooks.length} sách)</span>
              </h3>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => setIsAddingBook('scraper')}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}
                >
                  <Terminal size={16} /> Cào sách từ web
                </button>

                <button 
                  onClick={() => setIsAddingBook(true)} 
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Plus size={16} /> Thêm sách thủ công
                </button>
              </div>
            </div>

            {/* Scraping dialog */}
            {isAddingBook === 'scraper' && (
              <div className="glass-panel slide-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--accent-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={18} style={{ color: 'var(--accent-secondary)' }} />
                    Live Web Scraper Panel
                  </h4>
                  <button onClick={() => setIsAddingBook(false)} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                  {/* Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Source Select Dropdown */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Nguồn cào sách</label>
                      <select
                        value={scrapeSource}
                        onChange={(e) => setScrapeSource(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                      >
                        <option value="thuvien-ebook">Thư viện Ebook (thuvien-ebook.com)</option>
                        <option value="dilib">Thư viện số Dilib (dilib.vn)</option>
                        <option value="custom-list">Cào danh sách từ URL thủ công</option>
                        <option value="custom-book">Cào 1 cuốn sách từ URL chi tiết thủ công</option>
                      </select>
                    </div>

                    {/* URL Input (Always Enabled) */}
                    <div>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Đường dẫn cào sách (URL)</label>
                      <input 
                        type="text" 
                        value={scrapeUrl}
                        onChange={(e) => setScrapeUrl(e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                      />
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Số lượng sách tối đa</label>
                        <input 
                          type="number" 
                          min={1}
                          max={20}
                          value={scrapeLimit}
                          onChange={(e) => setScrapeLimit(e.target.value)}
                          style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.85rem', marginTop: '0.25rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          onClick={runLiveScraper}
                          disabled={isScraping}
                          className="btn-primary"
                          style={{ width: '100%', height: '38px', justifyContent: 'center' }}
                        >
                          {isScraping ? <RefreshCw size={14} className="pulse-glow-effect" /> : 'Bắt đầu cào'}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(99,102,241,0.03)', border: '1px dashed var(--border-color)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                      <AlertCircle size={16} style={{ color: 'var(--accent-secondary)' }} />
                      <span>Cơ chế lọc trùng lặp sẽ tự động bỏ qua các tiêu đề sách đã có sẵn trong thư viện.</span>
                    </div>
                  </div>

                  {/* Scraper Terminal Logs Console */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Báo cáo bảng điều khiển (Console logs)</span>
                    <div style={{
                      background: '#090a15',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      padding: '8px',
                      height: '210px',
                      overflowY: 'auto',
                      fontFamily: 'monospace',
                      fontSize: '0.72rem',
                      color: '#a78bfa',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      {scraperLogs.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>Chưa có tiến trình. Hãy nhấn "Bắt đầu cào"...</span>
                      ) : (
                        scraperLogs.map((log, idx) => <span key={idx}>{log}</span>)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manual adding overlays */}
            {isAddingBook === true && (
              <div className="glass-panel slide-in" style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                
                {/* EPUB/TXT Parsing */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderRight: '1px solid var(--border-color)', paddingRight: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Upload File Sách (.epub, .txt)</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tải file sách thật để lưu trữ và hiển thị nội dung chương hồi.</p>
                  
                  <label className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '1.5rem', border: '2px dashed var(--border-color)', borderRadius: '12px', cursor: 'pointer', flexDirection: 'column' }}>
                    {isParsing ? (
                      <>
                        <RefreshCw size={24} style={{ color: 'var(--accent-secondary)' }} className="pulse-glow-effect" />
                        <span style={{ fontSize: '0.8rem' }}>Đang nạp file...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                        <span style={{ fontSize: '0.8rem' }}>Chọn file EPUB hoặc TXT</span>
                      </>
                    )}
                    <input type="file" accept=".epub,.txt" onChange={handleFileUpload} disabled={isParsing} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Manual Add form */}
                <div>
                  <h4 style={{ fontSize: '0.92rem', fontWeight: 700 }}>Thêm sách thủ công</h4>
                  <form onSubmit={handleManualAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <input type="text" placeholder="Tên sách..." required value={manualTitle} onChange={(e) => setManualTitle(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    <input type="text" placeholder="Tác giả..." value={manualAuthor} onChange={(e) => setManualAuthor(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <input type="number" placeholder="Tổng trang..." required value={manualPages} onChange={(e) => setManualPages(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                      <select value={manualCategory} onChange={(e) => setManualCategory(e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', background: 'var(--bg-glass)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                        {bookCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>

                    <button type="submit" className="btn-primary" style={{ padding: '0.4rem', fontSize: '0.8rem', justifyContent: 'center' }}>Thêm vào thư viện</button>
                  </form>
                </div>
              </div>
            )}

            {/* Book Cards Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1.5rem'
            }}>
              {filteredBooks.map(book => {
                const percent = Math.round((book.currentPage / book.totalPages) * 100) || 0;

                return (
                  <div 
                    key={book.id} 
                    className="glass-panel"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    {/* Cover art image */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '200px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                      background: 'var(--border-color)'
                    }}>
                      <img src={book.coverUrl} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteBook(book.id); }}
                        style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.85)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifycontent: 'center', color: '#fff', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>

                      <span style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(15, 23, 42, 0.75)', color: 'var(--accent-secondary)', fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {book.fileType}
                      </span>
                    </div>

                    {/* Metadata details */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
                          {book.title}
                        </h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {book.author}
                        </p>
                      </div>

                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          <span>Tiến độ: {percent}%</span>
                          <span>{book.currentPage}/{book.totalPages} trang</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'var(--accent-secondary)' }} />
                        </div>
                      </div>
                    </div>

                    {/* Scraped book linkage upload area */}
                    {book.fileType === 'crawled' && book.chapters.length <= 2 && (
                      <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        padding: '4px',
                        border: '1px dashed var(--accent-primary)',
                        background: 'rgba(99,102,241,0.03)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.68rem',
                        color: 'var(--accent-primary)',
                        textAlign: 'center'
                      }}>
                        <Upload size={10} /> Nạp file EPUB thật để đọc
                        <input type="file" accept=".epub" onChange={(e) => handleFeedRealEpub(e, book.id)} style={{ display: 'none' }} />
                      </label>
                    )}

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => {
                          setActiveBook(book);
                        }}
                        className="btn-primary"
                        style={{
                          flex: 1,
                          padding: '6px',
                          fontSize: '0.75rem',
                          justifyContent: 'center',
                          background: book.completed ? 'var(--accent-success)' : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%)'
                        }}
                      >
                        {book.completed ? 'Hoàn thành' : (book.currentPage > 0 ? 'Đọc tiếp' : 'Đọc ngay')}
                      </button>

                      {book.downloadUrl && (
                        <a 
                          href={book.downloadUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-secondary"
                          style={{ padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Đi tới link tải file sách"
                        >
                          <Download size={12} />
                        </a>
                      )}
                    </div>

                  </div>
                );
              })}

              {filteredBooks.length === 0 && (
                <div style={{ gridColumn: '1 / span 4', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Thư mục này chưa có sách. Hãy nhấn "Cào sách từ web" để nạp sách nhanh!
                </div>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
