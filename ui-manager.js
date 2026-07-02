// Модуль отрисовки интерфейса (UI Rendering Module)

const UiManager = {
    updateCategorySelects() {
        const catSelect = document.getElementById('categorySelect');
        const filterCat = document.getElementById('filterCategory');
        const categories = StorageModule.getCategories();
        
        catSelect.innerHTML = '';
        filterCat.innerHTML = '<option value="all">Все категории</option>';

        categories.forEach(cat => {
            catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
            filterCat.innerHTML += `<option value="${cat}">${cat}</option>`;
        });
    },

    renderCards() {
        const grid = document.getElementById('cardsGrid');
        const filterCategory = document.getElementById('filterCategory').value;
        const filterRepetition = document.getElementById('filterRepetition').value;
        const sortOrder = document.getElementById('sortOrder').value; // Получаем режим сортировки
        grid.innerHTML = '';

        const now = new Date();

        // 1. Фильтруем карточки
        let filteredCards = window.currentCards.filter(card => {
            const matchCat = filterCategory === 'all' || card.category === filterCategory;
            
            let matchRep = true;
            if (filterRepetition === 'due') {
                matchRep = card.nextReview ? new Date(card.nextReview) <= now : true;
            }
            
            return matchCat && matchRep;
        });

        // 2. Сортируем отфильтрованные карточки по алфавиту, если выбран этот режим
        if (sortOrder === 'alphabetical') {
            filteredCards.sort((a, b) => {
                // Приводим к нижнему регистру для корректного сравнения
                const wordA = a.word.trim().toLowerCase();
                const wordB = b.word.trim().toLowerCase();
                // localeCompare правильно сравнивает строки с учетом специфики языков
                return wordA.localeCompare(wordB, 'en');
            });
        }

        // 3. Отрисовываем карточки
        filteredCards.forEach((card) => {
            const realIndex = window.currentCards.indexOf(card);
            const exampleHtml = card.example ? `<div class="card-example">“${card.example}”</div>` : '';
            
            // Безопасные дефолты для статистики
            const correct = card.stats ? card.stats.correct : 0;
            const wrong = card.stats ? card.stats.wrong : 0;
            const level = card.level || 1;
            
            // Проверка, нужно ли повторять прямо сейчас
            const isDue = card.nextReview ? new Date(card.nextReview) <= now : true;
            const dueBadgeHtml = isDue ? `<div class="card-due-badge">⏳ Повторить</div>` : '';

            const statsHtml = `
                <div class="card-stats">
                    <span class="stat-ok">✓ ${correct}</span>
                    <span class="stat-fail">✗ ${wrong}</span>
                </div>
            `;

            const toolbarHtml = `
                <div class="card-toolbar">
                    <button class="toolbar-btn btn-edit" onclick="FormHandler.editCard(event, ${realIndex})">Редактировать</button>
                    <button class="toolbar-btn btn-delete" onclick="FormHandler.deleteCard(event, ${realIndex})">Удалить</button>
                </div>
            `;

            const container = document.createElement('div');
            container.className = 'card-container';
            container.innerHTML = `
                <div class="card" onclick="UiManager.flipCard(this)">
                    <!-- Лицевая сторона -->
                    <div class="card-front">
                        ${statsHtml}
                        <button class="audio-btn" onclick="ApiModule.speak('${card.word.replace(/'/g, "\\'")}', event)">🔊</button>
                        <div class="card-content">
                            ${card.word}
                            ${exampleHtml}
                            <div class="card-category">📁 ${card.category}</div>
                        </div>
                        <div class="card-level">Lvl ${level}</div>
                        ${dueBadgeHtml}
                        ${toolbarHtml}
                    </div>
                    <!-- Обратная сторона -->
                    <div class="card-back">
                        ${statsHtml}
                        <div class="card-content">
                            ${card.translation}
                            <div class="card-category">📁 ${card.category}</div>
                        </div>
                        <div class="card-level">Lvl ${level}</div>
                        ${toolbarHtml}
                    </div>
                </div>
            `;
            grid.appendChild(container);
        });
    },

    flipCard(element) { 
        element.classList.toggle('flipped'); 
    }
};
