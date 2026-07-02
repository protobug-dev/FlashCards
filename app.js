// Полный исправленный файл app.js (Application Entry Point)

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

    // Скрываем шапку, панель управления и сетку карточек
    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('controlZone').style.display = 'none';
    document.getElementById('cardsGrid').style.display = 'none';

    TestModule.start(testCards);
}

function checkAnswer() { 
    TestModule.checkAnswer(); 
}

function stopTest() { 
    TestModule.stop(); 
    
    // Возвращаем элементы интерфейса на место
    document.querySelector('.app-header').style.display = 'flex';
    document.getElementById('controlZone').style.display = 'flex';
    document.getElementById('cardsGrid').style.display = 'grid'; // Гарантируем видимость сетки

    // ИСПРАВЛЕНО: Сбрасываем фильтры в дефолтное состояние "Все", чтобы карточки не исчезали
    document.getElementById('filterCategory').value = 'all';
    document.getElementById('filterRepetition').value = 'all';
    document.getElementById('sortOrder').value = 'default';

    // Перерисовываем сетку с чистыми фильтрами
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
