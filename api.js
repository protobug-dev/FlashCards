// Модуль внешних сервисов (API & Speech Module)

const ApiModule = {
    speak(text, event) {
        if (event) event.stopPropagation();
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    },

    async fetchTranslation(text) {
        try {
            const urlObject = new URL('https://api.mymemory.translated.net');
            urlObject.searchParams.append('q', text);
            urlObject.searchParams.append('langpair', 'en|ru');

            const response = await fetch(urlObject.toString());
            return await response.json();
        } catch (error) {
            console.error('Ошибка MyMemory API:', error);
            throw error;
        }
    }
};

function exportData() {
    StorageModule.exportJSON();
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    StorageModule.importJSON(file, (updatedCards) => {
        // Записываем обновленные данные в единое глобальное хранилище
        window.currentCards = updatedCards;
        
        // Вызываем методы обновленного UI модуля
        UiManager.updateCategorySelects();
        UiManager.renderCards();
    });
    
    event.target.value = '';
}
