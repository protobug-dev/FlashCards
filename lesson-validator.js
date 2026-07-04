// Модуль валидации ответов и сохранения бизнес-логики прогресса (Lesson Validator)

const LessonValidator = {
    validateTypedAnswer(task) {
        const card = task.card;
        const userAnswer = document.getElementById('testInput').value.trim().toLowerCase();
        const isEnPrompt = task.type.endsWith('en-ru');

        let isCorrect = false;
        let correctAnswerMessage = '';

        if (isEnPrompt) {
            const correctAnswers = card.translation.split(',').map(ans => ans.trim().toLowerCase());
            isCorrect = correctAnswers.includes(userAnswer);
            correctAnswerMessage = card.translation;
        } else {
            isCorrect = (userAnswer === card.word.trim().toLowerCase());
            correctAnswerMessage = card.word;
        }

        this.validate(isCorrect, correctAnswerMessage);
    },

    validate(isCorrect, correctAnswerMessage) {
        const task = LessonModule.queue[LessonModule.currentIndex];
        const card = task.card;
        const realCard = window.currentCards.find(c => c.word === card.word);
        const feedbackEl = document.getElementById('feedback');

        const buttons = document.querySelectorAll('#choicesGrid .choice-btn');
        const cleanCorrectAnswer = correctAnswerMessage.split(',').map(t => t.trim())[0].toLowerCase();
        
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText.toLowerCase() === cleanCorrectAnswer) {
                btn.classList.add('correct');
            }
        });

        if (!realCard.stats) realCard.stats = { correct: 0, wrong: 0 };
        if (!realCard.level) realCard.level = 1;

        if (isCorrect) {
            feedbackEl.style.color = 'var(--success-color)';
            
            // Если это был верный ответ в рамках "Экзамена на вылет"
            if (task.isTestOut) {
                feedbackEl.innerText = `Верно! Проверка слова.. (Шаг ${task.testOutStep} из 4) 🔍`;
                
                if (task.isFirstTry) realCard.stats.correct++;

                if (task.testOutStep < 4) {
                    // Генерируем следующий шаг экспресс-теста
                    let nextType = 'typed:ru-en'; // шаг 2
                    if (task.testOutStep === 2) nextType = 'choice:en-ru'; // шаг 3
                    if (task.testOutStep === 3) nextType = 'choice:ru-en'; // шаг 4

                    // На лету добавляем следующее задание СРАЗУ за текущим элементом в очереди
                    LessonModule.queue.splice(LessonModule.currentIndex + 1, 0, {
                        card: card,
                        type: nextType,
                        isFirstTry: task.isFirstTry, // Сохраняем, была ли ошибка ранее
                        isTestOut: true,
                        testOutStep: task.testOutStep + 1
                    });
                } else {
                    // ШАГ 4 УСПЕШНО ПРОЙДЕН: Слово подтверждено!
                    feedbackEl.innerText = 'Потрясающе! Слово выучено экстерном! 🥇';
                    realCard.level = 6; // Отправляем в вечный архив
                    realCard.nextReview = null; // Ему больше не нужны даты повторения
                }
            } else {
                // СТАНДАРТНАЯ ЛОГИКА ОТВЕТА (для старых/повторяемых карточек)
                feedbackEl.innerText = 'Правильно! 🎉';
                
                if (task.isFirstTry) {
                    LessonModule.score++;
                    realCard.stats.correct++;
                    
                    const totalAnswers = realCard.stats.correct + realCard.stats.wrong;
                    const successRate = realCard.stats.correct / totalAnswers;

                    if (successRate >= 0.90) {
                        // Если обычное слово дошло до 5 уровня и снова пройдено без ошибок -> Архив Lvl 6
                        if (realCard.level === 5) {
                            realCard.level = 6;
                            realCard.nextReview = null;
                            feedbackEl.innerText = 'Поздравляем! Слово полностью выучено и уходит в архив! 🏆';
                        } else {
                            realCard.level++;
                            const intervals = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
                            const daysToAdd = intervals[realCard.level] || 1;
                            const nextDate = new Date();
                            nextDate.setDate(nextDate.getDate() + daysToAdd);
                            realCard.nextReview = nextDate.toISOString();
                        }
                    } else {
                        realCard.nextReview = new Date().toISOString(); // Карантин
                    }
                }
            }

            if (task.type.endsWith('ru-en')) ApiModule.speak(card.word);
            LessonModule.currentIndex++;

        } else {
            // ЕСЛИ ПОЛЬЗОВАТЕЛЬ СДЕЛАЛ ОШИБКУ
            feedbackEl.style.color = 'var(--danger-color)';
            feedbackEl.innerText = `Ошибка. Правильно: ${correctAnswerMessage}`;
            
            if (task.isFirstTry) {
                realCard.stats.wrong++;
                realCard.level = 1;
                realCard.nextReview = new Date().toISOString();
            }

            if (task.isTestOut) {
                // Если сбой произошел во время "Экзамена на вылет"
                feedbackEl.innerText = `Не зачтено. Добавляем слово на базовое изучение. Правильно: ${correctAnswerMessage}`;
                
                // Прерываем экспресс-тест и заставляем пройти классический цикл: Ознакомление + Выбор
                LessonModule.queue.push({ card: card, type: 'study' });
                LessonModule.queue.push({ card: card, type: 'choice:en-ru', isFirstTry: false });
            } else {
                // Обычное зацикливание ошибки
                LessonModule.queue.push({ card: card, type: task.type, isFirstTry: false });
            }
            
            LessonModule.currentIndex++;
        }

        // Обновляем общее количество задач на ходу, так как длина очереди динамически меняется
        const uniqueWords = new Set(LessonModule.queue.map(t => t.card.word.trim().toLowerCase()));
        LessonModule.uniqueCardsCount = uniqueWords.size;

        StorageModule.saveCards(window.currentCards);
        setTimeout(() => LessonModule.showQuestion(), task.type.startsWith('choice') ? 1200 : 2000);
    }
};
