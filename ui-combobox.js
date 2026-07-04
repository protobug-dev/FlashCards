// Модуль управления кастомными комбобоксами панели фильтров (UI Combobox Module)

const UiComboBox = {
    // ИСПРАВЛЕНО: Теперь фильтры собираются динамически ТОЛЬКО из тех слов, что есть в базе карточек
    initFilters() {
        // 1. Извлекаем уникальные непустые значения из всех существующих карточек
        const uniqueLevels = [...new Set(window.currentCards.map(c => c.levelStr).filter(Boolean))];
        const uniquePos = [...new Set(window.currentCards.map(c => c.partOfSpeech).filter(Boolean))];
        const uniqueTopics = [...new Set(window.currentCards.map(c => c.topic).filter(Boolean))];

        // 2. Умная сортировка уровней по шкале CEFR (от А0 до С2)
        const cefrOrder = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
        uniqueLevels.sort((a, b) => cefrOrder.indexOf(a) - cefrOrder.indexOf(b));

        // 3. Сортировка частей речи и тем по алфавиту (для красоты отображения)
        uniquePos.sort((a, b) => a.localeCompare(b, 'ru'));
        uniqueTopics.sort((a, b) => a.localeCompare(b, 'ru'));

        // 4. Отрисовываем кастомные списки вариантов только на основе найденных живых элементов
        this.renderOptions('filterLevelOptions', uniqueLevels, 'level');
        this.renderOptions('filterPosOptions', uniquePos, 'partOfSpeech');
        this.renderOptions('filterTopicOptions', uniqueTopics, 'topic');
    },

    renderOptions(containerId, items, filterKey) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Кнопка сброса "Все" присутствует всегда
        container.innerHTML = `
            <div class="custom-select-option" onclick="UiComboBox.selectOption('${filterKey}', 'all', 'Все')">Все</div>
        `;

        // Отрисовываем только существующие элементы
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
        UiManager.filters[filterKey] = value;
        
        const triggerId = `customSelectValue${filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}`;
        const triggerEl = document.getElementById(triggerId);
        if (triggerEl) triggerEl.innerText = label;
        
        const containerClass = `filter-${filterKey}-container`;
        const containerEl = document.querySelector(`.${containerClass}`);
        if (containerEl) containerEl.classList.remove('open');
        
        UiCardsRenderer.renderCards();
    }
};
