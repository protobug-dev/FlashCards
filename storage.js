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
        const raw = localStorage.getItem(this.CATEGORIES_KEY);
        let savedTopics = ["Знакомство & Люди", "Дом & Семья", "Еда & Покупки", "IT & Технологии", "Работа & Отдых", "Путешествия", "Природа & Отдых"];
        
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    savedTopics = parsed;
                } else if (parsed && Array.isArray(parsed.topics)) {
                    savedTopics = parsed.topics;
                }
            } catch (e) {
                console.error("Ошибка парсинга категорий, откат к дефолту", e);
            }
        }

        return {
            levels: ["A0", "A1", "A2", "B1", "B2", "C1", "C2"],
            partsOfSpeech: ["Существительное", "Глагол", "Прилагательное", "Наречие", "Междометие", "Местоимение"],
            topics: savedTopics
        };
    },

    addCategoryIfNew(newTopic) {
        if (!newTopic) return null;
        let categories = this.getCategories();
        if (!categories.topics.includes(newTopic)) {
            categories.topics.push(newTopic);
            localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(categories.topics));
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

    async loadDefaultData(callback) {
        try {
            const response = await fetch('./FlashCards_backup.json');
            if (!response.ok) return;

            const importedData = await response.json();
            
            if (importedData.cards && Array.isArray(importedData.cards)) {
                let currentTopics = this.getCategories().topics;
                importedData.cards.forEach(card => {
                    const t = card.topic || card.category || "Общее";
                    if (!currentTopics.includes(t)) currentTopics.push(t);
                    
                    if (card.category && !card.topic) {
                        card.topic = card.category;
                        delete card.category;
                    }
                    if (!card.levelStr) {
                        card.levelStr = card.level || "A1";
                        card.level = 1; 
                    }
                    if (!card.reviewLvl) {
                        card.reviewLvl = card.level || 1;
                    }
                });
                
                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(currentTopics));
                this.saveCards(importedData.cards);
                
                if (callback) callback(importedData.cards);
            }
        } catch (error) {
            console.error('Не удалось автоматически загрузить стартовые карточки:', error);
        }
    },

    exportJSON() {
        const dataToExport = { 
            cards: this.getCards(), 
            topics: this.getCategories().topics 
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

    // ИСПРАВЛЕНО: Полная очистка от старых вызовов ui-manager во время импорта
    importJSON(file, callback) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (!importedData.cards || !Array.isArray(importedData.cards)) {
                    alert('Ошибка: Неверный формат файла бэкапа.');
                    return;
                }

                let currentTopics = this.getCategories().topics;
                let currentCards = this.getCards();
                let addedCount = 0;

                importedData.cards.forEach(newCard => {
                    const t = newCard.topic || newCard.category || "Общее";
                    if (!currentTopics.includes(t)) currentTopics.push(t);
                    
                    if (newCard.category && !newCard.topic) {
                        newCard.topic = newCard.category;
                        delete newCard.category;
                    }
                    if (!newCard.levelStr) {
                        newCard.levelStr = newCard.level || "A1";
                    }
                    if (!newCard.reviewLvl) {
                        newCard.reviewLvl = newCard.level || 1;
                    }

                    const isDuplicate = currentCards.some(oldCard => 
                        oldCard.word.trim().toLowerCase() === newCard.word.trim().toLowerCase()
                    );
                    if (!isDuplicate) {
                        currentCards.push(newCard);
                        addedCount++;
                    }
                });

                localStorage.setItem(this.CATEGORIES_KEY, JSON.stringify(currentTopics));
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
