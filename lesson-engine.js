// Модуль управления игровым циклом урока (Lesson Engine)

const LessonModule = {
    queue: [],
    currentIndex: 0,
    score: 0,
    uniqueCardsCount: 0,

    EXERCISE_LABELS: {
        'study': '📖 Новое слово! Запомните его',
        'choice:en-ru': '🔘 Выберите правильный перевод',
        'choice:ru-en': '🔘 Выберите английское слово',
        'typed:en-ru': '✍️ Введите перевод на русский',
        'typed:ru-en': '✍️ Введите слово на английском'
    },

    start(selectedCategory) {
        this.queue = [];
        this.currentIndex = 0;
        this.score = 0;

        // Гарантируем сброс кастомных окон и стилей экстрим-режима при старте
        document.getElementById('testBox').classList.remove('hard-mode');
        document.getElementById('testOutConfirm').style.display = 'none';
        document.getElementById('lessonInteractiveZone').style.display = 'block';

        const checkBtn = document.getElementById('checkAnswerBtn');
        checkBtn.innerText = 'Проверить';
        checkBtn.style.display = 'inline-block';

        // Восстанавливаем кнопку прерывания (на случай если прошлый урок был завершен нормально)
        const cancelBtn = document.querySelector('#testBox button.secondary');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';

        this.queue = LessonBuilder.buildSession(selectedCategory);
        
        const uniqueWords = new Set(this.queue.map(task => task.card.word.trim().toLowerCase()));
        this.uniqueCardsCount = uniqueWords.size;

        document.getElementById('testBox').style.display = 'block';
        this.showQuestion();
    },

    showQuestion() {
        document.getElementById('feedback').innerText = '';
        const testInput = document.getElementById('testInput');
        const audioBtn = document.getElementById('testAudioBtn');
        const progressBar = document.getElementById('progressBar');
        const choicesGrid = document.getElementById('choicesGrid');
        const checkBtn = document.getElementById('checkAnswerBtn');
        const exerciseLabel = document.getElementById('testExerciseLabel');

        testInput.value = '';
        choicesGrid.innerHTML = '';

        if (this.currentIndex >= this.queue.length) {
            this.finishLesson();
            return;
        }

        // УМНЫЙ ПОДСЧЕТ ИСТИННОГО ПРОГРЕССА СЛОВ
        let completedWords = new Set();
        for (let i = 0; i < this.currentIndex; i++) {
            completedWords.add(this.queue[i].card.word.trim().toLowerCase());
        }
        
        const currentWord = this.queue[this.currentIndex].card.word.trim().toLowerCase();
        
        let currentWordDisplayIndex = completedWords.has(currentWord) 
            ? completedWords.size 
            : completedWords.size + 1;
            
        if (currentWordDisplayIndex > this.uniqueCardsCount) {
            currentWordDisplayIndex = this.uniqueCardsCount;
        }

        const progressPercent = this.uniqueCardsCount > 0 
            ? ((currentWordDisplayIndex - 1) / this.uniqueCardsCount) * 100 
            : 0;
        progressBar.style.width = `${progressPercent}%`;

        document.getElementById('testProgress').innerText = `Слово ${currentWordDisplayIndex} из ${this.uniqueCardsCount}`;

        const task = this.queue[this.currentIndex];
        const card = task.card;
        exerciseLabel.innerText = this.EXERCISE_LABELS[task.type];

        if (task.type === 'study') {
            document.getElementById('testWord').innerText = `${card.word} = ${card.translation}`;
            audioBtn.style.display = 'inline-block';
            checkBtn.style.display = 'inline-block';
            checkBtn.innerText = 'Понятно, дальше 👍';
            testInput.style.display = 'none';
            choicesGrid.style.display = 'none';
            ApiModule.speak(card.word);
            return;
        }

        checkBtn.innerText = 'Проверить';
        const isEnPrompt = task.type.endsWith('en-ru');
        document.getElementById('testWord').innerText = isEnPrompt ? card.word : card.translation;

        if (isEnPrompt) {
            audioBtn.style.display = 'inline-block';
            ApiModule.speak(card.word);
        } else {
            audioBtn.style.display = 'none';
        }

        if (task.type.startsWith('choice')) {
            checkBtn.style.display = 'none';
            testInput.style.display = 'none';
            choicesGrid.style.display = 'grid';
            this.renderChoices(task);
        } else {
            checkBtn.style.display = 'inline-block';
            choicesGrid.style.display = 'none';
            testInput.style.display = 'inline-block';
            testInput.placeholder = isEnPrompt ? 'Введите перевод на русском' : 'Введите слово на английском';
            testInput.focus();
        }
    },

    renderChoices(task) {
        const card = task.card;
        const isEnPrompt = task.type.endsWith('en-ru');
        let correctAnswer, pool;

        if (isEnPrompt) {
            correctAnswer = card.translation.split(',')[0].trim();
            pool = window.currentCards
                .filter(c => c.word.trim().toLowerCase() !== card.word.trim().toLowerCase())
                .map(c => c.translation.split(',')[0].trim());
        } else {
            correctAnswer = card.word.trim();
            pool = window.currentCards
                .filter(c => c.word.trim().toLowerCase() !== card.word.trim().toLowerCase())
                .map(c => c.word.trim());
        }

        pool = [...new Set(pool)].filter(t => t && t.toLowerCase() !== correctAnswer.toLowerCase());
        pool.sort(() => Math.random() - 0.5);

        const distractors = pool.slice(0, 3);
        const options = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);

        const choicesGrid = document.getElementById('choicesGrid');
        options.forEach((option) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice-btn';
            btn.innerText = option;
            btn.onclick = () => LessonValidator.validate(option.toLowerCase() === correctAnswer.toLowerCase(), correctAnswer);
            choicesGrid.appendChild(btn);
        });
    },

    checkAnswer() {
        const task = this.queue[this.currentIndex];
        if (!task || task.type.startsWith('choice')) return;

        if (task.type === 'study') {
            this.currentIndex++;
            this.showQuestion();
            return;
        }

        LessonValidator.validateTypedAnswer(task);
    },

    // Внутри файла lesson-engine.js найдите эти два метода и замените их:

    finishLesson() {
        StorageModule.incrementDailyActivity();
        
        document.getElementById('progressBar').style.width = '100%';
        
        document.getElementById('testProgress').innerText = `Урок завершен!`;
        document.getElementById('testExerciseLabel').innerText = 'Отличная работа 🎯';
        document.getElementById('testWord').innerText = `Успешно пройдено карточек: ${this.uniqueCardsCount} из ${StorageModule.getLessonSize()}`;
        
        document.getElementById('testInput').style.display = 'none';
        document.getElementById('choicesGrid').style.display = 'none';
        if (document.getElementById('testAudioBtn')) document.getElementById('testAudioBtn').style.display = 'none';
        
        // ИСПРАВЛЕНО: Теперь жестко и со 100% гарантией скрываем кнопку по её точному ID
        const cancelBtn = document.getElementById('abortLessonBtn');
        if (cancelBtn) cancelBtn.style.display = 'none';
        
        const checkBtn = document.getElementById('checkAnswerBtn');
        if (checkBtn) {
            checkBtn.style.display = 'inline-block';
            checkBtn.innerText = 'Завершить 🏁';
        }
    },

    stop() {
        this.queue = [];
        this.currentIndex = 0;
        this.score = 0;
        this.uniqueCardsCount = 0;
        
        document.getElementById('testBox').classList.remove('hard-mode');
        
        // ИСПРАВЛЕНО: При выходе из урока возвращаем видимость кнопки по ID на случай следующего старта сессии
        const cancelBtn = document.getElementById('abortLessonBtn');
        if (cancelBtn) cancelBtn.style.display = 'inline-block';
        
        document.getElementById('testBox').style.display = 'none';
    },


    speakCurrentWord() {
        if (this.currentIndex < this.queue.length) {
            const task = this.queue[this.currentIndex];
            ApiModule.speak(task.card.word);
        }
    }

};
