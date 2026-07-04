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
        const cleanCorrectAnswer = correctAnswerMessage.split(',')[0].trim().toLowerCase();
        
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.innerText.toLowerCase() === cleanCorrectAnswer) {
                btn.classList.add('correct');
            }
        });

        if (!realCard.stats) realCard.stats = { correct: 0, wrong: 0 };
        if (!realCard.reviewLvl) realCard.reviewLvl = 1;

        if (isCorrect) {
            feedbackEl.style.color = 'var(--success-color)';
            
            // ИСПРАВЛЕНО: Новая развилка для первого шага "Экзамена на вылет"
            if (task.isTestOut && task.testOutStep === 1) {
                if (task.isFirstTry) realCard.stats.correct++;
                
                // Переключаем форму на вывод вопроса-выбора вместо автоматического продолжения
                document.getElementById('lessonInteractiveZone').style.display = 'none';
                document.getElementById('testOutConfirm').style.display = 'block';
                return; // Останавливаем выполнение, ждем клика по кнопкам диалога
            } 
            
            // Если пользователь уже принял вызов и идет по жесткой проверке (шаги 2, 3, 4)
            if (task.isTestOut && task.testOutStep > 1) {
                feedbackEl.innerText = `⚡ Жёсткая проверка: Шаг ${task.testOutStep} из 4 пройден!`;
                if (task.isFirstTry) realCard.stats.correct++;

                if (task.testOutStep < 4) {
                    let nextType = 'typed:ru-en'; 
                    if (task.testOutStep === 2) nextType = 'choice:en-ru'; 
                    if (task.testOutStep === 3) nextType = 'choice:ru-en'; 

                    LessonModule.queue.splice(LessonModule.currentIndex + 1, 0, {
                        card: card,
                        type: nextType,
                        isFirstTry: task.isFirstTry,
                        isTestOut: true,
                        testOutStep: task.testOutStep + 1
                    });
                } else {
                    // Экзамен сдан на 100%
                    feedbackEl.innerText = 'Потрясающе! Слово выучено экстерном! 🥇';
                    realCard.reviewLvl = 6;
                    realCard.nextReview = null;
                    // Выключаем фиолетовую рамку экстрима
                    document.getElementById('testBox').classList.remove('hard-mode');
                }
            } else {
                // Стандартная ветка повторения
                feedbackEl.innerText = 'Правильно! 🎉';
                if (task.isFirstTry) {
                    LessonModule.score++;
                    realCard.stats.correct++;
                    
                    const totalAnswers = realCard.stats.correct + realCard.stats.wrong;
                    const successRate = realCard.stats.correct / totalAnswers;

                    if (successRate >= 0.90) {
                        if (realCard.reviewLvl === 5) {
                            realCard.reviewLvl = 6;
                            realCard.nextReview = null;
                            feedbackEl.innerText = 'Поздравляем! Слово уходит в архив! 🏆';
                        } else {
                            realCard.reviewLvl++;
                            const intervals = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
                            const daysToAdd = intervals[realCard.reviewLvl] || 1;
                            const nextDate = new Date();
                            nextDate.setDate(nextDate.getDate() + daysToAdd);
                            realCard.nextReview = nextDate.toISOString();
                        }
                    } else {
                        realCard.nextReview = new Date().toISOString();
                    }
                }
            }

            if (task.type.endsWith('ru-en')) ApiModule.speak(card.word);
            LessonModule.currentIndex++;

        } else {
            // ЕСЛИ ПОЛЬЗОВАТЕЛЬ СДЕЛАЛ ОШИБКУ
            feedbackEl.style.color = 'var(--danger-color)';
            feedbackEl.innerText = `Ошибка. Правильно: ${correctAnswerMessage}`;
            
            // Выключаем фиолетовый экстрим-режим в случае ошибки
            document.getElementById('testBox').classList.remove('hard-mode');

            if (task.isFirstTry) {
                realCard.stats.wrong++;
                realCard.reviewLvl = 1;
                realCard.nextReview = new Date().toISOString();
            }

            if (task.isTestOut) {
                feedbackEl.innerText = `Не зачтено. Отправляем слово на базовое изучение. Правильно: ${correctAnswerMessage}`;
                LessonModule.queue.push({ card: card, type: 'study' });
                LessonModule.queue.push({ card: card, type: 'choice:en-ru', isFirstTry: false });
            } else {
                LessonModule.queue.push({ card: card, type: task.type, isFirstTry: false });
            }
            
            LessonModule.currentIndex++;
        }

        const uniqueWords = new Set(LessonModule.queue.map(t => t.card.word.trim().toLowerCase()));
        LessonModule.uniqueCardsCount = uniqueWords.size;

        StorageModule.saveCards(window.currentCards);
        setTimeout(() => LessonModule.showQuestion(), task.type.startsWith('choice') ? 1200 : 2000);
    },

    // ИСПРАВЛЕНО: Обработчик клика по кнопкам диалога развилки
    handleTestOutChoice(wantsHardCheck) {
        const task = LessonModule.queue[LessonModule.currentIndex];
        const card = task.card;
        
        // Прячем диалоговое окно и возвращаем стандартную зону инпутов
        document.getElementById('testOutConfirm').style.display = 'none';
        document.getElementById('lessonInteractiveZone').style.display = 'block';

        if (wantsHardCheck) {
            // Включаем визуальный фиолетовый экстрим-режим для формы!
            document.getElementById('testBox').classList.add('hard-mode');

            // Запускаем жесткую цепочку: подмешиваем в очередь следующий шаг (Шаг 2)
            LessonModule.queue.splice(LessonModule.currentIndex + 1, 0, {
                card: card,
                type: 'typed:ru-en', // Шаг 2: Ввод на английском руками
                isFirstTry: task.isFirstTry,
                isTestOut: true,
                testOutStep: 2
            });
            
            // Сдвигаем индекс на это новое созданное задание
            LessonModule.currentIndex++;
            LessonModule.showQuestion();
        } else {
            // Если пользователь нажал "Оставить": убираем флаг экзамена, 
            // слово превращается в стандартного новичка и уходит в обычную тренировку
            task.isTestOut = false;
            
            // Пушим стандартную пару: Ознакомление + Выбор
            LessonModule.queue.push({ card: card, type: 'study' });
            LessonModule.queue.push({ card: card, type: 'choice:en-ru', isFirstTry: false });
            
            LessonModule.currentIndex++;
            LessonModule.showQuestion();
        }
    }
};
