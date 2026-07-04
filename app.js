// Главная точка входа приложения (Application Entry Point)

// Инициализируем базу данных
window.currentCards = StorageModule.getCards();

// Функция запуска "Умного урока"
function startLesson() {
    const filterCategory = UiManager.selectedCategoryFilter;

    if (window.currentCards.length === 0) {
        alert('Ваш словарь пуст! Создайте первую карточку, кликнув на пустую плитку в сетке.');
        return;
    }

    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('controlZone').style.display = 'none';
    document.getElementById('cardsGrid').style.display = 'none';

    LessonModule.start(filterCategory);
}

// ИСПРАВЛЕНО: Умный роутер кнопки проверки
function checkAnswer() { 
    const checkBtn = document.getElementById('checkAnswerBtn');
    
    // Если на кнопке написано "Завершить", значит урок окончен и мы должны выйти
    if (checkBtn.innerText === 'Завершить 🏁') {
        stopTest();
        return;
    }
    
    // В противном случае — отправляем текст на валидацию
    LessonModule.checkAnswer(); 
}

function stopTest() { 
    LessonModule.stop(); 
    
    document.querySelector('.app-header').style.display = 'flex';
    document.getElementById('controlZone').style.display = 'flex';
    document.getElementById('cardsGrid').style.display = 'grid';

    //document.getElementById('filterCategory').value = 'all';
	UiManager.selectedCategoryFilter = 'all';

    UiManager.updateCategorySelects();
    UiManager.renderCards(); 
}

document.getElementById('testInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('lessonSizeSelect').value = StorageModule.getLessonSize();
    UiManager.updateCategorySelects();
    UiManager.renderCards();
});
