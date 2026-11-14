const CACHE_NAME = 'spro-pollution-v1.1.0';

// অ্যাপের নিজস্ব ফাইল এবং ডিজাইন ও ক্যালেন্ডারের প্রয়োজনীয় CDN লিংকগুলো এখানে ক্যাশ করা হচ্ছে
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
  'https://cdn.jsdelivr.net/npm/flatpickr/dist/themes/dark.css',
  'https://cdn.jsdelivr.net/npm/flatpickr'
];

// ১. Install Event: ফাইলগুলো ক্যাশ মেমরিতে সংরক্ষণ করা
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ২. Activate Event: নতুন ভার্সন আসলে পুরোনো ক্যাশ ফাইল ডিলিট করে জায়গা পরিষ্কার করা
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ৩. Fetch Event: ক্যাশ থেকে ফাইল সার্ভ করা এবং অফলাইন বা WhatsApp রিকোয়েস্ট সুরক্ষিত রাখা
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // শুধু GET রিকোয়েস্ট ক্যাশ হবে। WhatsApp বা অন্য কোনো এক্সটার্নাল পোস্ট রিকোয়েস্ট বাইপাস হবে।
  if (e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // ব্যাকগ্রাউন্ডে নেটওয়ার্ক থেকে নতুন আপডেট চেক করে ক্যাশ রিফ্রেশ করবে
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, networkResponse);
            });
          }
        }).catch(() => {});

        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // অফলাইনে নেভিগেশন ফলব্যাক
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
