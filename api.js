     //       const urlObject = new URL('https://api.mymemory.translated.net');
 
            
// Модуль интеграции с внешними API и системными функциями (API Module)

const ApiModule = {
    // Асинхронный запрос к MyMemory API для автоматического перевода слов и поиска примеров
    async fetchTranslation(text) {
        const url = `https://api.mymemory.translated.net{encodeURIComponent(text)}&langpair=en|ru`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Сбой сети API');
        return await response.json();
    },

    // Озвучка слов средствами браузера (Web Speech API)
    speak(text) {
        if (!text) return;
        // Перед запуском нового звука сбрасываем предыдущую озвучку, чтобы звуки не накладывались
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Задаем американский английский акцент
        utterance.rate = 0.9;     // Слегка замедляем темп для учебного восприятия
        window.speechSynthesis.speak(utterance);
    }
};

// ГЛОБАЛЬНЫЕ ПРОСЛОЙКИ ДЛЯ КНОПОК ИМПОРТА/ЭКСПОРТА ИЗ INDEX.HTML

function exportData() {
    StorageModule.exportJSON();
}

// ИСПРАВЛЕНО: Логика импорта полностью переведена на новые модули встраивания интерфейса
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    StorageModule.importJSON(file, (updatedCards) => {
        window.currentCards = updatedCards;
        
        // Синхронно обновляем тройные селекторы модалки, фильтры комбобоксов и строим сетку карточек
        UiManager.updateModalSelects();
        UiComboBox.initFilters();
        UiCardsRenderer.renderCards();
    });
    
    // Сбрасываем значение инпута, чтобы можно было загрузить тот же файл повторно
    event.target.value = '';
}
