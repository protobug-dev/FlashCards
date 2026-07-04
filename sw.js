// Фоновый скрипт кэширования PWA (Service Worker)
const CACHE_NAME = 'flashcards-v1';
const ASSETS = [
  './index.html',
  './lesson-box.html',
  './card-modal.html',
  './theme.css',
  './layout.css',
  './components.css',
  './modals-lesson.css',
  './storage.js',
  './api.js',
  './lesson-builder.js',
  './lesson-validator.js',
  './lesson-engine.js',
  './ui-core.js',
  './ui-combobox.js',
  './ui-cards-renderer.js',
  './form-handler.js',
  './app.js',
  './FlashCards_backup.json'
];

// Установка воркера и кэширование ресурсов
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активация и очистка старого кэша
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Перехват запросов и выдача файлов из кэша
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
