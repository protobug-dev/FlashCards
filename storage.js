// Модуль работы с хранилищем и бэкапами (Storage & Backup Module)

const StorageModule = {
    CARDS_KEY: 'smart_cards',
    CATEGORIES_KEY: 'smart_categories',

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

    // ЭКСПОРТ: Генерация JSON файла для скачивания
    exportJSON() {
        const dataToExport = {
            cards: this.getCards(),
            categories: this.getCategories()
        };

        // Переводим объект в красивую JSON строку
        const jsonString = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
        
        // Создаем виртуальную ссылку на скачивание и программно кликаем по ней
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", "flashcards_backup.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    },

    // ИМПОРТ: Чтение и безопасное слияние данных из внешнего файла
    importJSON(file, callback) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                
                // Валидация: проверяем, содержит ли файл нужные нам массивы
                if (!importedData.cards || !Array.isArray(importedData.cards)) {
                    alert('Ошибка: Неверный формат файла бэкапа.');
                    return;
                }

                // 1. Слияние категорий (убираем дубликаты)
                let currentCategories = this.getCategories();
                if (importedData.categories && Array.isArray(importedData.categories)) {
                    importedData.categories.forEach(cat => {
                        if (!currentCategories.includes(cat)) currentCategories.push(cat);
                    });
                    localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(currentCategories));
                }

                // 2. Слияние карточек (умное исключение одинаковых слов)
                let currentCards = this.getCards();
                let addedCount = 0;

                importedData.cards.forEach(newCard => {
                    // Ищем, есть ли уже такое английское слово в текущей базе
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
                
                // Запускаем перерисовку интерфейса в главном файле
                if (callback) callback(currentCards);

            } catch (error) {
                alert('Не удалось прочитать файл. Убедитесь, что это правильный JSON файл бэкапа.');
                console.error(error);
            }
        };

        reader.readAsText(file);
    }
};
