const TestModule = {
    queue: [],
    currentIndex: 0,
    score: 0,

    // Метки и подсказки для каждого типа упражнения
    EXERCISE_LABELS: {
        'typed:en-ru': '✍️ Переведите на русский',
        'typed:ru-en': '✍️ Переведите на английский',
        'choice:en-ru': '🔘 Выберите перевод на русском',
        'choice:ru-en': '🔘 Выберите слово на английском'
    },

    start(filteredCards) {
        this.queue = this.buildQueue(filteredCards);
        this.currentIndex = 0;
        this.score = 0;

        document.getElementById('creatorPanel').style.display = 'none';
        document.getElementById('controlZone').style.display = 'none';
        document.getElementById('cardsGrid').style.display = 'none';
        document.getElementById('testBox').style.display = 'block';

        document.getElementById('testInput').style.display = 'inline-block';
        document.getElementById('testAudioBtn').style.display = 'inline-block';
        document.getElementById('checkAnswerBtn').style.display = 'inline-block';

        this.showQuestion();
    },

    // Строим очередь: для каждой карточки - 4 упражнения (typed/choice x en-ru/ru-en), затем перемешиваем
    buildQueue(cards) {
        let queue = [];
        cards.forEach(card => {
            queue.push({ card, execType: 'typed', direction: 'en-ru' });
            queue.push({ card, execType: 'typed', direction: 'ru-en' });
            queue.push({ card, execType: 'choice', direction: 'en-ru' });
            queue.push({ card, execType: 'choice', direction: 'ru-en' });
        });
        // Fisher-Yates
        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }
        return queue;
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

        const progressPercent = this.queue.length > 0 ? (this.currentIndex / this.queue.length) * 100 : 0;
        progressBar.style.width = `${progressPercent}%`;

        if (this.currentIndex >= this.queue.length) {
            document.getElementById('testProgress').innerText = `Тест окончен!`;
            exerciseLabel.innerText = '';
            document.getElementById('testWord').innerText = `Результат: ${this.score} из ${this.queue.length}`;
            testInput.style.display = 'none';
            choicesGrid.style.display = 'none';
            checkBtn.style.display = 'none';
            audioBtn.style.display = 'none';
            progressBar.style.width = '100%';
            return;
        }

        const ex = this.queue[this.currentIndex];
        const card = ex.card;

        document.getElementById('testProgress').innerText = `Вопрос ${this.currentIndex + 1} из ${this.queue.length}`;
        exerciseLabel.innerText = this.EXERCISE_LABELS[`${ex.execType}:${ex.direction}`];

        // Что показываем как "вопрос": для en-ru - английское слово, для ru-en - русский перевод
        const promptText = ex.direction === 'en-ru' ? card.word : card.translation;
        document.getElementById('testWord').innerText = promptText;

        // Озвучиваем и показываем кнопку 🔊 только когда на экране английское слово
        if (ex.direction === 'en-ru') {
            audioBtn.style.display = 'inline-block';
            ApiModule.speak(card.word);
        } else {
            audioBtn.style.display = 'none';
        }

        if (ex.execType === 'choice') {
            checkBtn.style.display = 'none';
            testInput.style.display = 'none';
            choicesGrid.style.display = 'grid';
            this.renderChoices(ex);
        } else {
            checkBtn.style.display = 'inline-block';
            choicesGrid.style.display = 'none';
            testInput.style.display = 'inline-block';
            testInput.placeholder = ex.direction === 'en-ru' ? 'Введите перевод на русском' : 'Введите слово на английском';
            testInput.focus();
        }
    },

    renderChoices(ex) {
        const card = ex.card;
        let correctAnswer, pool;

        if (ex.direction === 'en-ru') {
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

        const distractors = pool.slice(0, 4);
        const options = [...distractors, correctAnswer].sort(() => Math.random() - 0.5);

        const choicesGrid = document.getElementById('choicesGrid');
        choicesGrid.innerHTML = '';
        options.forEach((option) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'choice-btn';
            btn.innerText = option;
            btn.onclick = () => this.selectChoice(option, correctAnswer);
            choicesGrid.appendChild(btn);
        });
    },

    selectChoice(selected, correctAnswer) {
        const buttons = document.querySelectorAll('#choicesGrid .choice-btn');
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText === correctAnswer) btn.classList.add('correct');
            if (btn.innerText === selected && selected !== correctAnswer) btn.classList.add('wrong');
        });

        this.registerResult(selected === correctAnswer, correctAnswer);
    },

    speakCurrentWord() {
        if (this.currentIndex < this.queue.length) {
            const ex = this.queue[this.currentIndex];
            if (ex.direction === 'en-ru') {
                ApiModule.speak(ex.card.word);
            }
        }
    },

    checkAnswer() {
        const ex = this.queue[this.currentIndex];
        if (!ex || ex.execType === 'choice') return; // выбор обрабатывается через selectChoice

        if (this.currentIndex >= this.queue.length) {
            this.stop();
            return;
        }

        const card = ex.card;
        const userAnswer = document.getElementById('testInput').value.trim().toLowerCase();

        let isCorrect = false;
        let correctAnswerMessage = '';

        if (ex.direction === 'en-ru') {
            const correctAnswers = card.translation.split(',').map(ans => ans.trim().toLowerCase());
            isCorrect = correctAnswers.includes(userAnswer);
            correctAnswerMessage = card.translation;
        } else {
            const correctAnswer = card.word.trim().toLowerCase();
            isCorrect = (userAnswer === correctAnswer);
            correctAnswerMessage = card.word;
        }

        this.registerResult(isCorrect, correctAnswerMessage);
    },

    registerResult(isCorrect, correctAnswerMessage) {
        const ex = this.queue[this.currentIndex];
        const card = ex.card;
        const realCard = window.currentCards.find(c => c.word === card.word);
        const feedbackEl = document.getElementById('feedback');

        if (!realCard.stats) realCard.stats = { correct: 0, wrong: 0 };
        if (!realCard.level) realCard.level = 1;

        if (isCorrect) {
            feedbackEl.style.color = 'var(--success-color)';
            feedbackEl.innerText = 'Правильно! 🎉';
            this.score++;
            realCard.stats.correct++;

            // Интервальное повторение: повышаем уровень (макс 5)
            if (realCard.level < 5) realCard.level++;
            // Озвучиваем английское слово в качестве обратной связи, если вопрос был на русском
            if (ex.direction === 'ru-en') ApiModule.speak(card.word);
        } else {
            feedbackEl.style.color = 'var(--danger-color)';
            feedbackEl.innerText = `Ошибка. Правильно: ${correctAnswerMessage}`;
            realCard.stats.wrong++;

            // Ошибка сбрасывает уровень прогресса обратно на 1
            realCard.level = 1;
        }

        // Высчитываем дату следующего повторения на основе уровня
        // Уровень 1: через 1 день, 2: 3 дня, 3: 7 дней, 4: 14 дней, 5: 30 дней
        const intervals = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
        const daysToAdd = intervals[realCard.level] || 1;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysToAdd);
        realCard.nextReview = nextDate.toISOString();

        // Сохраняем прогресс на лету
        StorageModule.saveCards(window.currentCards);

        this.currentIndex++;
        setTimeout(() => this.showQuestion(), ex.execType === 'choice' ? 1200 : 2000);
    },

    stop() {
        document.getElementById('creatorPanel').style.display = 'block';
        document.getElementById('controlZone').style.display = 'flex';
        document.getElementById('cardsGrid').style.display = 'grid';
        document.getElementById('testBox').style.display = 'none';
        document.getElementById('testInput').style.display = 'inline-block';
        document.getElementById('testAudioBtn').style.display = 'inline-block';
        document.getElementById('checkAnswerBtn').style.display = 'inline-block';
        document.getElementById('choicesGrid').style.display = 'none';
        document.getElementById('testExerciseLabel').innerText = '';
    }
};
