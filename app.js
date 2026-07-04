// Главная точка входа приложения (Application Entry Point)

// Инициализируем базу данных
window.currentCards = StorageModule.getCards();

function startLesson() {
    const filterCategory = document.getElementById('filterCategory').value;

    if (window.currentCards.length === 0) {
        alert('Ваш словарь пуст! Создайте первую карточку, кликнув на пустую плитку в сетке.');
        return;
    }

    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('controlZone').style.display = 'none';
    document.getElementById('cardsGrid').style.display = 'none';

    LessonModule.start(filterCategory);
}

function checkAnswer() { 
    const checkBtn = document.getElementById('checkAnswerBtn');
    if (checkBtn.innerText === 'Завершить 🏁') {
        stopTest();
        return;
    }
    LessonModule.checkAnswer(); 
}

function stopTest() { 
    LessonModule.stop(); 
    
    document.querySelector('.app-header').style.display = 'flex';
    document.getElementById('controlZone').style.display = 'flex';
    document.getElementById('cardsGrid').style.display = 'grid';

    document.getElementById('filterCategory').value = 'all';

    UiManager.updateCategorySelects();
    UiManager.renderCards(); 
}

document.getElementById('testInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

// Инициализация приложения
window.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('lessonSizeSelect').value = StorageModule.getLessonSize();
    
    // --- ИСПРАВЛЕНО: Автоматический онбординг для новых пользователей ---
    // Если в LocalStorage нет карточек (первый заход), загружаем дефолтный файл с сервера
    if (window.currentCards.length === 0) {
        await StorageModule.loadDefaultData((loadedCards) => {
            window.currentCards = loadedCards;
        });
    }
    // -------------------------------------------------------------------

    UiManager.updateCategorySelects();
    UiManager.renderCards();
});
