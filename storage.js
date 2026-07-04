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

    // Чтение и сохранение размера урока из настроек шестеренки
    getLessonSize() {
        return parseInt(localStorage.getItem(this.LESSON_SIZE_KEY)) || 10;
    },

    saveLessonSize(size) {
        localStorage.setItem(this.LESSON_SIZE_KEY, size);
    },

    // Чтение и обновление количества пройденных за сегодня уроков
    getDailyActivity() {
        const todayStr = new Date().toLocaleDateString(); // "DD.MM.YYYY"
        const savedData = JSON.parse(localStorage.getItem(this.ACTIVITY_KEY));

        // Если запись существует и даты совпадают, возвращаем актуальное кол-во уроков
        if (savedData && savedData.date === todayStr) {
            return savedData.completedCount || 0;
        }

        // Если наступил новый день или записей нет — возвращаем 0
        return 0;
    },

    incrementDailyActivity() {
        const todayStr = new Date().toLocaleDateString();
        const currentCount = this.getDailyActivity();
        
        const updatedData = {
            date: todayStr,
            completedCount: currentCount + 1
        };

        localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(updatedData));
        return updatedData.completedCount;
    },

    // ЭКСПОРТ: Генерация Blob/JSON файла для безопасного скачивания без лимитов памяти
    exportJSON() {
        const dataToExport = {
            cards: this.getCards(),
            categories: this.getCategories()
        };

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

    // ИМПОРТ: Чтение и безопасное слияние данных из внешнего файла
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
                alert('Не удалось прочитать файл. Убедитесь, что это правильный JSON файл бэкапа.');
                console.error(error);
            }
        };

        reader.readAsText(file);
    }
};
