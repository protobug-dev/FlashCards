// Главный координирующий модуль интерфейса (UI Core Module)

const UiManager = {
    // Храним текущие значения трёхмерной фильтрации
    filters: {
        level: 'all',
        partOfSpeech: 'all',
        topic: 'all'
    },

    // Метод обновления стандартных селектов внутри модального окна создания/редактирования
    updateModalSelects() {
        const categories = StorageModule.getCategories();
        
        // Находим селекты внутри модалки
        const lvlSelect = document.getElementById('categoryLevelSelect');
        const posSelect = document.getElementById('categoryPosSelect');
        const topicSelect = document.getElementById('categoryTopicSelect');

        // Перерисовываем список тем (динамический массив)
        topicSelect.innerHTML = '';
        categories.topics.forEach(t => {
            topicSelect.innerHTML += `<option value="${t}">${t}</option>`;
        });

        // Сбрасываем уровни и части речи к дефолту (они статичны)
        lvlSelect.selectedIndex = 0;
        posSelect.selectedIndex = 0;
    },

    toggleSettingsMenu(event) {
        event.stopPropagation();
        const dropdown = document.getElementById('settingsDropdown');
        dropdown.classList.toggle('active');
        
        if (dropdown.classList.contains('active')) {
            const closeMenu = (e) => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }
    }
};
