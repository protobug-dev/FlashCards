// Модуль управления кастомными комбобоксами панели фильтров (UI Combobox Module)

const UiComboBox = {
    // Динамическое наполнение кастомных списков данными из базы
    initFilters() {
        const categories = StorageModule.getCategories();

        this.renderOptions('filterLevelOptions', categories.levels, 'level');
        this.renderOptions('filterPosOptions', categories.partsOfSpeech, 'partOfSpeech');
        this.renderOptions('filterTopicOptions', categories.topics, 'topic');
    },

    renderOptions(containerId, items, filterKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Кнопка сброса "Все"
        container.innerHTML = `
            <div class="custom-select-option" onclick="UiComboBox.selectOption('${filterKey}', 'all', 'Все')">Все</div>
        `;

        items.forEach(item => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.innerText = item;
            optionDiv.onclick = () => UiComboBox.selectOption(filterKey, item, item);
            container.appendChild(optionDiv);
        });
    },

    toggleSelect(event, containerId) {
        event.stopPropagation();
        
        // Закрываем все остальные открытые комбобоксы перед открытием текущего
        document.querySelectorAll('.custom-select-container').forEach(el => {
            if (el.id !== containerId) el.classList.remove('open');
        });

        const container = document.getElementById(containerId);
        container.classList.toggle('open');
        
        if (container.classList.contains('open')) {
            const closeAll = (e) => {
                if (!container.contains(e.target)) {
                    container.classList.remove('open');
                    document.removeEventListener('click', closeAll);
                }
            };
            document.addEventListener('click', closeAll);
        }
    },

    selectOption(filterKey, value, label) {
        // Записываем выбранное значение в фильтры главного модуля
        UiManager.filters[filterKey] = value;
        
        // Обновляем текст на кнопке-триггере
        const triggerId = `customSelectValue${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`;
        document.getElementById(triggerId).innerText = label;
        
        // Закрываем контейнер
        const containerClass = `filter-${filterKey}-container`;
        document.querySelector(`.${containerClass}`).classList.remove('open');
        
        // Перерисовываем сетку карточек с учётом новых параметров
        UiCardsRenderer.renderCards();
    }
};
