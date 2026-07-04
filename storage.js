// Модуль работы с хранилищем и бэкапами (Storage & Backup Module)

const StorageModule = {
    CARDS_KEY: 'smart_cards',
    CATEGORIES_KEY: 'smart_categories',
    LESSON_SIZE_KEY: 'smart_lesson_size',
    ACTIVITY_KEY: 'smart_daily_activity',

    getCards() {
        return JSON.parse(localStorage.getItem(this.CARDS_KEY)) || [];
    },

    saveCards(cards) {
        localStorage.setItem(this.CARDS_KEY, JSON.stringify(cards));
    },

    getCategories() {
        return JSON.parse(localStorage.getItem(this.CATEGORIES_KEY)) || ['Общее', 'Глаголы', 'Существительные'];
    },

    addCategoryIfNew(newCat) {
        if (!newCat) return null;
        let categories = this.getCategories();
        if (!categories.includes(newCat)) {
            categories.push(newCat);
            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories));
            return true;
        }
        return false;
    },

    getLessonSize() {
        return parseInt(localStorage.getItem(this.LESSON_SIZE_KEY)) || 10;
    },

    saveLessonSize(size) {
        localStorage.setItem(this.LESSON_SIZE_KEY, size);
    },

    getDailyActivity() {
        const todayStr = new Date().toLocaleDateString();
        const savedData = JSON.parse(localStorage.getItem(this.ACTIVITY_KEY));
        if (savedData && savedData.date === todayStr) {
            return savedData.completedCount || 0;
        }
        return 0;
    },

    incrementDailyActivity() {
        const todayStr = new Date().toLocaleDateString();
        const currentCount = this.getDailyActivity();
        const updatedData = { date: todayStr, completedCount: currentCount + 1 };
        localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(updatedData));
        return updatedData.completedCount;
    },

    // НОВЫЙ МЕТОД: Бесшовная загрузка стартового JSON-файла прямо с сервера (GitHub Pages)
    async loadDefaultData(callback) {
        try {
            // Делаем асинхронный запрос к файлу, лежащему рядом с index.html
            const response = await fetch('./flashcards_backup.json');
            
            // Если файла на сервере нет, просто тихо выходим
            if (!response.ok) return;

            const importedData = await response.json();
            
            if (importedData.categories && Array.isArray(importedData.categories)) {
                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(importedData.categories));
            }
            if (importedData.cards && Array.isArray(importedData.cards)) {
                this.saveCards(importedData.cards);
                
                // Передаем новые данные в колбэк, чтобы обновить глобальную переменную в app.js
                if (callback) callback(importedData.cards);
            }
        } catch (error) {
            console.error('Не удалось автоматически загрузить стартовые карточки:', error);
        }
    },

    exportJSON() {
        const dataToExport = { cards: this.getCards(), categories: this.getCategories() };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const blobUrl = URL.createObjectURL(blob);
        
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", blobUrl);
        downloadAnchor.setAttribute("download", "flashcards_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(blobUrl);
    },

    importJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!importedData.cards || !Array.isArray(importedData.cards)) {
                    alert('Ошибка: Неверный формат файла бэкапа.');
                    return;
                }

                let currentCategories = this.getCategories();
                if (importedData.categories && Array.isArray(importedData.categories)) {
                    importedData.categories.forEach(cat => {
                        if (!currentCategories.includes(cat)) currentCategories.push(cat);
                    });
                    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(currentCategories));
                }

                let currentCards = this.getCards();
                let addedCount = 0;

                importedData.cards.forEach(newCard => {
                    const isDuplicate = currentCards.some(oldCard => 
                        oldCard.word.trim().toLowerCase() === newCard.word.trim().toLowerCase()
                    );
                    if (!isDuplicate) {
                        currentCards.push(newCard);
                        addedCount++;
                    }
                });

                this.saveCards(currentCards);
                alert(`Импорт успешно завершен! Добавлено новых карточек: ${addedCount}`);
                if (callback) callback(currentCards);
            } catch (error) {
                alert('Не удалось прочитать файл.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
};
