// Главная точка входа приложения (Application Entry Point)

window.currentCards = StorageModule.getCards();

function startLesson() {
    const activeFilters = UiManager.filters;

    if (window.currentCards.length === 0) {
        alert('Ваш словарь пуст! Создайте первую карточку, кликнув на пустую плитку в сетке.');
        return;
    }

    document.querySelector('.app-header').style.display = 'none';
    document.getElementById('controlZone').style.display = 'none';
    document.getElementById('cardsGrid').style.display = 'none';

    LessonModule.start(activeFilters);
}

function checkAnswer() { 
    const checkBtn = document.getElementById('checkAnswerBtn');
    if (checkBtn && checkBtn.innerText === 'Завершить 🏁') {
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

    UiManager.filters = { level: 'all', partOfSpeech: 'all', topic: 'all' };
    document.getElementById('customSelectValueLevel').innerText = 'Все';
    document.getElementById('customSelectValuePartOfSpeech').innerText = 'Все';
    document.getElementById('customSelectValueTopic').innerText = 'Все';

    UiManager.updateModalSelects();
    UiComboBox.initFilters();
    UiCardsRenderer.renderCards(); 
}

// Хелпер динамического импорта HTML-компонентов с сервера
async function loadHtmlComponent(containerId, url) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            document.getElementById(containerId).innerHTML = await response.text();
        }
    } catch (e) {
        console.error(`Ошибка загрузки компонента ${url}:`, e);
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    // ДИНАМИЧЕСКИЙ ИМПОРТ РАЗМЕТКИ
    await loadHtmlComponent('dynamicLessonBoxContainer', './lesson-box.html');
    await loadHtmlComponent('dynamicModalContainer', './card-modal.html');

    // Навешиваем слушатель Enter на инпут, который только что прилетел из lesson-box.html
    const testInput = document.getElementById('testInput');
    if (testInput) {
        testInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkAnswer();
        });
    }

    document.getElementById('lessonSizeSelect').value = StorageModule.getLessonSize();
    
    if (window.currentCards.length === 0) {
        await StorageModule.loadDefaultData((loadedCards) => {
            window.currentCards = loadedCards;
        });
    }

    UiManager.updateModalSelects();
    UiComboBox.initFilters();
    UiCardsRenderer.renderCards();
});

// Автоматическая регистрация PWA Сервис-Воркера
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Service Worker успешно зарегистрирован!', reg.scope))
            .catch(err => console.log('Сбой регистрации Service Worker:', err));
    });
}
