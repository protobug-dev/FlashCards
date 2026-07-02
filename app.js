// Главная точка входа приложения (Application Entry Point)

// Объявляем глобальную базу данных без let/const, чтобы избежать SyntaxError
window.currentCards = StorageModule.getCards();

// Прослойки для вызова функций из HTML
function startTest() {
    const filterCategory = document.getElementById('filterCategory').value;
    const filterRepetition = document.getElementById('filterRepetition').value;
    const now = new Date();

    const testCards = window.currentCards.filter(card => {
        const matchCat = filterCategory === 'all' || card.category === filterCategory;
        let matchRep = true;
        if (filterRepetition === 'due') {
            matchRep = card.nextReview ? new Date(card.nextReview) <= now : true;
        }
        return matchCat && matchRep;
    });

    if (testCards.length === 0) {
        alert('Нет карточек, соответствующих выбранным фильтрам для теста!');
        return;
    }

    TestModule.start(testCards);
}

function checkAnswer() { 
    TestModule.checkAnswer(); 
}

function stopTest() { 
    TestModule.stop(); 
    UiManager.renderCards(); 
}

// Слушатель клавиатуры для инпута теста
document.getElementById('testInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

// Инициализация при первой загрузке приложения
window.addEventListener('DOMContentLoaded', () => {
    UiManager.updateCategorySelects();
    UiManager.renderCards();
});
