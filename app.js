// Главная точка входа приложения (Application Entry Point)

// Инициализируем базу данных
window.currentCards = StorageModule.getCards();

// Функция запуска "Умного урока"
function startLesson() {
    // ИСПРАВЛЕНО: Считываем категорию из переменной кастомного комбобокса, а не из удаленного select
    const filterCategory = UiManager.selectedCategoryFilter;

    if (window.currentCards.length === 0) {
        alert('Ваш словарь пуст! Создайте первую карточку, кликнув на пустую плитку в сетке.');
        return;
    }

    // Скрываем основные блоки интерфейса перед началом урока
    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('controlZone').style.display = 'none';
    document.getElementById('cardsGrid').style.display = 'none';

    // Запускаем игровой движок урока
    LessonModule.start(filterCategory);
}

// Прослойка для вызова проверки текстового ответа по кнопке или Enter
function checkAnswer() { 
    const checkBtn = document.getElementById('checkAnswerBtn');
    if (checkBtn.innerText === 'Завершить 🏁') {
        stopTest();
        return;
    }
    LessonModule.checkAnswer(); 
}

// Прослойка возврата на главный экран
function stopTest() { 
    LessonModule.stop(); 
    
    document.querySelector('.app-header').style.display = 'flex';
    document.getElementById('controlZone').style.display = 'flex';
    document.getElementById('cardsGrid').style.display = 'grid';

    // Сбрасываем фильтр категорий в дефолт
    UiManager.selectedCategoryFilter = 'all';
    document.getElementById('customSelectValue').innerText = 'Все категории';

    UiManager.updateCategorySelects();
    UiManager.renderCards(); 
}

// Слушатель клавиатуры для текстового инпута урока (отправка ответа по Enter)
document.getElementById('testInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

// Инициализация приложения
window.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('lessonSizeSelect').value = StorageModule.getLessonSize();
    
    if (window.currentCards.length === 0) {
        await StorageModule.loadDefaultData((loadedCards) => {
            window.currentCards = loadedCards;
        });
    }

    UiManager.updateCategorySelects();
    UiManager.renderCards();
});
