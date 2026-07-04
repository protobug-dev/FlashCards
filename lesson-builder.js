// Модуль сборки умных уроков (Lesson Builder)

const LessonBuilder = {
    buildSession(selectedCategory) {
        const now = new Date();
        const lessonSize = StorageModule.getLessonSize();
        
        // Фильтруем общую базу по выбранной категории И исключаем выученные карточки (Level 6)
        let pool = window.currentCards.filter(c => 
            (selectedCategory === 'all' || c.category === selectedCategory) && c.level !== 6
        );
        
        // Расчет коэффициента успешности (Success Rate)
        const getSuccessRate = (card) => {
            if (!card.stats || (card.stats.correct === 0 && card.stats.wrong === 0)) return 1.0;
            return card.stats.correct / (card.stats.correct + card.stats.wrong);
        };

        const isBrandNew = (card) => !card.stats || (card.stats.correct === 0 && card.stats.wrong === 0);
        const isDue = (card) => card.nextReview ? new Date(card.nextReview) <= now : true;

        // Распределение по группам приоритетов (Исключаем Level 6 во избежание багов)
        let problematicCards = pool.filter(c => !isBrandNew(c) && getSuccessRate(c) < 0.90);
        let dueOldCards = pool.filter(c => !isBrandNew(c) && isDue(c) && !problematicCards.includes(c));
        let newCards = pool.filter(c => isBrandNew(c));

        const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
        shuffle(problematicCards);
        shuffle(dueOldCards);
        shuffle(newCards);

        let selectedCards = [];
        selectedCards = selectedCards.concat(problematicCards).slice(0, lessonSize);
        
        if (selectedCards.length < lessonSize) {
            selectedCards = selectedCards.concat(dueOldCards).slice(0, lessonSize);
        }
        if (selectedCards.length < lessonSize) {
            selectedCards = selectedCards.concat(newCards).slice(0, lessonSize);
        }
        if (selectedCards.length < lessonSize) {
            const remaining = pool.filter(c => !selectedCards.includes(c));
            selectedCards = selectedCards.concat(shuffle(remaining)).slice(0, lessonSize);
        }

        // Генерация заданий в очередь
        let queue = [];
        selectedCards.forEach(card => {
            const lvl = card.level || 1;
            
            if (isBrandNew(card)) {
                // ИСПРАВЛЕНО: Для новых слов сразу даем хардкорный ввод (Экзамен на вылет)
                // Ставим специальный флаг начала экспресс-проверки
                queue.push({ 
                    card, 
                    type: 'typed:en-ru', 
                    isFirstTry: true, 
                    isTestOut: true, 
                    testOutStep: 1 
                });
            } else if (lvl === 1 || lvl === 2 || lvl === 3) {
                const dir = Math.random() > 0.5 ? 'en-ru' : 'ru-en';
                queue.push({ card, type: `choice:${dir}`, isFirstTry: true });
            } else {
                const dir = Math.random() > 0.5 ? 'en-ru' : 'ru-en';
                queue.push({ card, type: `typed:${dir}`, isFirstTry: true });
            }
        });

        return queue;
    }
};
