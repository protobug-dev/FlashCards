// Модуль сборки умных уроков (Lesson Builder)

const LessonBuilder = {
    buildSession(activeFilters) {
        const now = new Date();
        const lessonSize = StorageModule.getLessonSize();
        
        // ИСПРАВЛЕНО: Пул фильтруется строго по всем трем параметрам осей, исключая заархивированные слова
        let pool = window.currentCards.filter(c => {
            const matchLvl = activeFilters.level === 'all' || c.levelStr === activeFilters.level;
            const matchPos = activeFilters.partOfSpeech === 'all' || c.partOfSpeech === activeFilters.partOfSpeech;
            const matchTopic = activeFilters.topic === 'all' || c.topic === activeFilters.topic;
            const isNotArchived = c.reviewLvl !== 6;
            return matchLvl && matchPos && matchTopic && isNotArchived;
        });
        
        const getSuccessRate = (card) => {
            if (!card.stats || (card.stats.correct === 0 && card.stats.wrong === 0)) return 1.0;
            return card.stats.correct / (card.stats.correct + card.stats.wrong);
        };

        const isBrandNew = (card) => !card.stats || (card.stats.correct === 0 && card.stats.wrong === 0);
        const isDue = (card) => !card.nextReview || new Date(card.nextReview) <= now;

        // Распределение по группам приоритетов
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

        // Генерация заданий
        let queue = [];
        selectedCards.forEach(card => {
            const lvl = card.reviewLvl || 1;
            
            if (isBrandNew(card)) {
                queue.push({ card, type: 'typed:en-ru', isFirstTry: true, isTestOut: true, testOutStep: 1 });
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
