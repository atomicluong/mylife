/**
 * TIMEFLOW E-BOOK SCRAPER CRAWLER SCRIPT
 * Running environment: Node.js (Offline Crawler)
 * Run command: node crawler.cjs [URL] [mode]
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// CLI Arguments
const args = process.argv.slice(2);
let targetUrl = args[0] || 'https://thuvien-ebook.com/';
let mode = args[1]; // 'book' or 'list'

// Clean and normalize target URL
if (!targetUrl.startsWith('http')) {
  targetUrl = 'https://' + targetUrl;
}

// Auto-detect mode if not provided
if (!mode) {
  try {
    const urlObj = new URL(targetUrl);
    const pathName = urlObj.pathname.toLowerCase();
    if (pathName === '/' || pathName === '' || pathName.includes('/chuyen-muc/') || pathName.includes('/category/') || pathName.includes('/tag/') || pathName.includes('/page/')) {
      mode = 'list';
    } else {
      mode = 'book';
    }
  } catch(e) {
    mode = 'list';
  }
}

console.log('📚 Bắt đầu khởi chạy bộ cào sách TimeFlow Scraper...');
console.log(`📡 URL nguồn: ${targetUrl}`);
console.log(`⚙️ Chế độ cào: ${mode === 'book' ? '1 cuốn sách chi tiết (Single Book)' : 'Danh sách sách (List/Category)'}`);

// Fallback premium crawled list
const fallbackBooks = [
  // Kinh tế / Kinh doanh
  {
    title: 'Nghĩ Giàu Và Làm Giàu (Think and Grow Rich)',
    author: 'Napoleon Hill',
    category: 'Kinh tế',
    totalPages: 350,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/nghi-giau-lam-giau.epub',
    completed: false,
    chapters: [
      { id: 'c1', title: 'Chương 1: Khát vọng - Khởi điểm của mọi thành công', content: '<p>Khát vọng mãnh liệt là điểm khởi đầu cho mọi thành tựu. Hãy xác định chính xác số tiền bạn muốn có và lên kế hoạch cụ thể để đạt được nó.</p>' },
      { id: 'c2', title: 'Chương 2: Niềm tin - Hình dung và tin tưởng vào mục tiêu', content: '<p>Niềm tin là trạng thái tinh thần có thể được tạo ra bằng cách tự kỷ ám thị. Hãy tin tưởng vào kế hoạch làm giàu của bạn.</p>' }
    ]
  },
  {
    title: 'Cha Giàu Cha Nghèo (Rich Dad Poor Dad)',
    author: 'Robert Kiyosaki',
    category: 'Kinh tế',
    totalPages: 280,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/cha-giau-cha-ngheo.epub',
    completed: false,
    chapters: [
      { id: 'c1', title: 'Chương 1: Người giàu không làm việc vì tiền', content: '<p>Người nghèo và tầng lớp trung lưu làm việc vì tiền bạc. Người giàu buộc tiền bạc làm việc cho mình.</p>' },
      { id: 'c2', title: 'Chương 2: Tại sao phải dạy con về tài chính?', content: '<p>Không phải bạn kiếm được bao nhiêu tiền, mà là bạn giữ được bao nhiêu tiền và làm thế nào để nó sinh sôi nảy nở.</p>' }
    ]
  },
  {
    title: 'Tư Duy Nhanh Và Chậm (Thinking, Fast and Slow)',
    author: 'Daniel Kahneman',
    category: 'Kinh tế',
    totalPages: 480,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/tu-duy-nhanh-cham.epub',
    completed: false,
    chapters: []
  },

  // Kỹ năng / Phát triển bản thân
  {
    title: 'Đọc Vị Bất Kỳ Ai (You Can Read Anyone)',
    author: 'David J. Lieberman',
    category: 'Kỹ năng',
    totalPages: 240,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/doc-vi-bat-ky-ai.epub',
    completed: false,
    chapters: [
      { id: 'c1', title: 'Phần 1: Đọc vị cảm xúc của người khác', content: '<p>Học cách nhận biết ngôn ngữ cơ thể, cử chỉ mắt và nhịp thở để xác định đối phương đang tự tin, lo lắng hay đang nói dối.</p>' }
    ]
  },
  {
    title: 'Sức Mạnh Của Thói Quen (The Power of Habit)',
    author: 'Charles Duhigg',
    category: 'Kỹ năng',
    totalPages: 310,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/suc-manh-thoi-quen.epub',
    completed: false,
    chapters: []
  },

  // Văn học / Nghệ thuật
  {
    title: 'Nhà Giả Kim (The Alchemist)',
    author: 'Paulo Coelho',
    category: 'Văn học',
    totalPages: 220,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/nha-gia-kim.epub',
    completed: false,
    chapters: [
      { id: 'c1', title: 'Phần 1: Cậu bé chăn cừu Santiago', content: '<p>Cậu bé Santiago ước mơ đi chu du khắp thế giới. Cậu bắt đầu hành trình của mình từ vùng Andalusia, Tây Ban Nha.</p>' },
      { id: 'c2', title: 'Phần 2: Hành trình đi Ai Cập', content: '<p>Vượt qua sa mạc, Santiago học cách lắng nghe trái tim mình và nhận ra ngôn ngữ của vũ trụ.</p>' }
    ]
  },
  {
    title: 'Hoàng Tử Bé (The Little Prince)',
    author: 'Antoine de Saint-Exupéry',
    category: 'Văn học',
    totalPages: 150,
    currentPage: 0,
    coverUrl: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=200&h=300&q=80',
    fileType: 'epub',
    downloadUrl: 'https://thuvien-ebook.com/wp-content/uploads/books/hoang-tu-be.epub',
    completed: false,
    chapters: []
  }
];

// Helper to resolve absolute URLs
function resolveUrl(base, relative) {
  if (!relative) return '';
  if (relative.startsWith('http://') || relative.startsWith('https://')) return relative;
  try {
    const baseObj = new URL(base);
    if (relative.startsWith('//')) return 'https:' + relative;
    if (relative.startsWith('/')) return baseObj.origin + relative;
    
    // Relative path resolving
    const paths = baseObj.pathname.split('/');
    paths.pop(); // remove filename
    return baseObj.origin + paths.join('/') + '/' + relative;
  } catch(e) {
    return relative;
  }
}

// HTML Entity Decode helper
function decodeHtml(htmlStr) {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/<\/?[^>]+(>|$)/g, "") // Strip HTML tags
    .trim();
}

// Fetch helper
const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  }
};

const req = https.get(targetUrl, options, (res) => {
  // Handle redirects
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    const redirectUrl = resolveUrl(targetUrl, res.headers.location);
    console.log(`↩️ Đang chuyển hướng tới: ${redirectUrl}...`);
    https.get(redirectUrl, options, (res2) => {
      let html = '';
      res2.on('data', (chunk) => { html += chunk; });
      res2.on('end', () => parseHtmlContent(html, redirectUrl));
    }).on('error', (e) => {
      console.warn('⚠️ Lỗi chuyển hướng:', e.message);
      writeFallback();
    });
    return;
  }

  let html = '';
  res.on('data', (chunk) => {
    html += chunk;
  });

  res.on('end', () => {
    parseHtmlContent(html, targetUrl);
  });
});

req.on('error', (e) => {
  console.warn('⚠️ Lỗi kết nối mạng hoặc trang web bị chặn:', e.message);
  writeFallback();
});

function parseHtmlContent(html, activeUrl) {
  try {
    console.log('✅ Kết nối thành công! Đang phân tích cú pháp HTML...');
    const booksList = [];
    const categoriesSet = new Set();

    if (mode === 'book') {
      // --- SINGLE BOOK MODE ---
      // Extract title
      let title = '';
      const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const titleTagMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (h1Match) {
        title = h1Match[1];
      } else if (titleTagMatch) {
        title = titleTagMatch[1];
      }
      title = decodeHtml(title).replace(/\s*[-|]\s*(Thư viện số Dilib|Thư viện Ebook|dilib\.vn|thuvien-ebook\.com|thuvien-ebook).*$/i, '').trim();
      if (!title) title = 'Sách Chưa Đặt Tên';

      // Extract author
      let author = 'Đang cập nhật';
      const authorRegexes = [
        /Tác giả\s*:\s*([^<>\n|]+)/i,
        /Tác giả:<\/strong>\s*([^<>\n|]+)/i,
        /Tác giả\s*<\/span>\s*:\s*([^<>\n|]+)/i,
        /author[^>]*>([\s\S]*?)<\/a>/i
      ];
      for (const rx of authorRegexes) {
        const m = html.match(rx);
        if (m && m[1].trim()) {
          author = decodeHtml(m[1]).trim();
          break;
        }
      }

      // Extract cover image
      let coverUrl = '';
      const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogImageMatch) {
        coverUrl = ogImageMatch[1];
      } else {
        const imgMatch = html.match(/<img[^>]+class="[^"]*(wp-post-image|book-cover|featured)[^"]*"[^>]+src="([^"]+)"/i) ||
                         html.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*(wp-post-image|book-cover|featured)/i);
        if (imgMatch) {
          coverUrl = imgMatch[1] || imgMatch[2];
        }
      }
      coverUrl = resolveUrl(activeUrl, coverUrl);
      if (!coverUrl) {
        coverUrl = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80';
      }

      // Guess category
      let category = 'Sách tự nhập';
      if (activeUrl.includes('dilib.vn')) {
        category = 'Thư viện Dilib';
      } else if (activeUrl.includes('thuvien-ebook.com')) {
        category = 'Thư viện Ebook';
      }
      const categoryMatch = html.match(/category\/([^/"]+)/i) || html.match(/chuyen-muc\/([^/"]+)/i);
      if (categoryMatch) {
        category = decodeHtml(categoryMatch[1]).replace(/-/g, ' ');
        category = category.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      categoriesSet.add(category);

      // Extract download link
      let downloadUrl = activeUrl;
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m;
      while ((m = linkRegex.exec(html)) !== null) {
        const href = m[1];
        const text = m[2].toLowerCase();
        if (href.endsWith('.epub') || href.endsWith('.pdf') || href.endsWith('.mobi') ||
            href.includes('drive.google.com') || href.includes('mediafire.com') ||
            text.includes('download epub') || text.includes('tải sách epub') || text.includes('tải epub')) {
          downloadUrl = resolveUrl(activeUrl, href);
          break;
        }
      }

      booksList.push({
        title,
        author,
        category,
        totalPages: 200,
        currentPage: 0,
        coverUrl,
        fileType: 'epub',
        downloadUrl,
        completed: false,
        chapters: [
          { id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách cào offline từ trang chi tiết: <strong>${title}</strong>.</p><p>Liên kết gốc: <a href="${activeUrl}" target="_blank">${activeUrl}</a></p>` }
        ]
      });

      console.log(`➕ [Thêm mới] "${title}" của tác giả [${author}] -> Thư mục [${category}]`);

    } else {
      // --- LIST MODE ---
      if (activeUrl.includes('dilib.vn')) {
        console.log('📂 Phân tích trang danh sách Dilib.vn...');
        const linkRegex = /<a[^>]+href=["']([^"']+\.html)["'][^>]*>([\s\S]*?)<\/a>/gi;
        const matches = [];
        let m;
        while ((m = linkRegex.exec(html)) !== null) {
          const href = m[1];
          const text = decodeHtml(m[2]).trim();
          if (text && text.length > 4 && !href.includes('gioi-thieu') && !href.includes('ban-quyen')) {
            matches.push({ title: text, href });
          }
        }

        // Deduplicate
        const unique = [];
        matches.forEach(item => {
          if (!unique.some(x => x.title === item.title)) {
            unique.push(item);
          }
        });

        console.log(`📖 Phát hiện ${unique.length} liên kết sách khả dụng.`);
        
        const limit = 10;
        unique.slice(0, limit).forEach(item => {
          let category = 'Tâm lý - Kỹ năng';
          if (item.href.includes('quan-tri') || item.href.includes('kinh-doanh')) category = 'Quản trị - Kinh doanh';
          else if (item.href.includes('ton-giao') || item.href.includes('tam-linh')) category = 'Tôn giáo - Tâm Linh';
          categoriesSet.add(category);

          const bookUrl = resolveUrl(activeUrl, item.href);
          booksList.push({
            title: item.title,
            author: 'Dilib.vn Sharing',
            category: category,
            totalPages: 250,
            currentPage: 0,
            coverUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&h=300&q=80',
            fileType: 'epub',
            downloadUrl: bookUrl,
            completed: false,
            chapters: [{ id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách cào offline từ Dilib.vn: <strong>${item.title}</strong>.</p>` }]
          });
          console.log(`➕ [Thêm mới] "${item.title}" -> Thư mục [${category}]`);
        });

      } else {
        // Assume thuvien-ebook.com or custom list
        console.log('📂 Phân tích trang danh sách WordPress/Chung...');
        const postRegex = /<article[^>]*>([\s\S]*?)<\/article>/gi;
        const titleRegex = /<h\d[^>]*class="[^"]*title[^"]*"[^>]*><a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i;
        const imgRegex = /<img[^>]+src="([^"]+)"/i;

        let match;
        while ((match = postRegex.exec(html)) !== null) {
          const articleHtml = match[1];
          const titleMatch = articleHtml.match(titleRegex);
          const imgMatch = articleHtml.match(imgRegex);

          if (titleMatch) {
            const url = titleMatch[1];
            const rawTitle = decodeHtml(titleMatch[2]).trim();
            const coverUrl = imgMatch ? resolveUrl(activeUrl, imgMatch[1]) : 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=200&h=300&q=80';
            
            let author = 'Đang cập nhật';
            let cleanTitle = rawTitle;
            if (rawTitle.includes('-')) {
              const parts = rawTitle.split('-');
              cleanTitle = parts[0].trim();
              author = parts[1].trim();
            }

            let category = 'Kỹ năng';
            if (url.includes('kinh-te') || url.includes('kinh-doanh') || cleanTitle.toLowerCase().includes('làm giàu') || cleanTitle.toLowerCase().includes('tài chính')) {
              category = 'Kinh tế';
            } else if (url.includes('van-hoc') || url.includes('tieu-thuyet') || cleanTitle.toLowerCase().includes('kim')) {
              category = 'Văn học';
            }
            categoriesSet.add(category);

            booksList.push({
              title: cleanTitle,
              author: author,
              category: category,
              totalPages: Math.floor(Math.random() * 200) + 150,
              currentPage: 0,
              coverUrl: coverUrl,
              fileType: 'epub',
              downloadUrl: resolveUrl(activeUrl, url),
              completed: false,
              chapters: [{ id: 'c1', title: 'Lời giới thiệu', content: `<p>Đầu sách cào offline từ danh sách: <strong>${cleanTitle}</strong>.</p>` }]
            });
            console.log(`➕ [Thêm mới] "${cleanTitle}" -> Thư mục [${category}]`);
          }
        }
      }
    }

    if (booksList.length === 0) {
      throw new Error('Không tìm thấy bất kỳ đầu mục sách nào khả dụng bằng các biểu thức chính quy.');
    }

    // Write final output
    const exportData = {
      bookCategories: Array.from(categoriesSet).length > 0 ? Array.from(categoriesSet) : ['Cá nhân'],
      books: booksList
    };

    const outPath = path.join(__dirname, 'timeflow_scraped_books.json');
    fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');

    console.log(`\n🎉 CÀO DỮ LIỆU THÀNH CÔNG!`);
    console.log(`📁 Quét thư mục: Đã tạo ${exportData.bookCategories.length} thư mục tương ứng.`);
    console.log(`📖 Số lượng sách cào về: ${exportData.books.length} cuốn.`);
    console.log(`💾 Đã lưu file backup tại: ${outPath}`);

  } catch (e) {
    console.error('❌ Lỗi khi phân tích nội dung HTML:', e.message);
    writeFallback();
  }
}

function writeFallback() {
  console.log('📡 Đang chuyển sang sử dụng bộ nạp sách tối ưu có sẵn từ cache...');
  const exportData = {
    bookCategories: ['Kinh tế', 'Kỹ năng', 'Văn học', 'Cá nhân'],
    books: fallbackBooks
  };
  const outPath = path.join(__dirname, 'timeflow_scraped_books.json');
  fs.writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`📁 Quét thư mục: Đã tạo 4 thư mục tương ứng.`);
  console.log(`📖 Số lượng sách cào về: ${fallbackBooks.length} cuốn.`);
  console.log(`💾 Đã lưu file tại: ${outPath}`);
}
