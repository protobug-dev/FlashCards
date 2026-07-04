// Модуль рендеринга карточек и дневного прогресса (UI Cards Renderer Module)

const UiCardsRenderer = {
    renderDailyProgress() {
        const cubesContainer = document.getElementById('dailyCubes');
        cubesContainer.innerHTML = '';

        const completed = StorageModule.getDailyActivity(); 
        const maxVisibleCubes = 5;

        if (completed < maxVisibleCubes) {
            const baseGoal = 3; 
            const totalCubesToRender = completed >= baseGoal ? completed + 1 : baseGoal;

            for (let i = 0; i < totalCubesToRender; i++) {
                const cube = document.createElement('div');
                cube.className = 'progress-cube';
                if (i < completed) cube.classList.add('completed');
                cubesContainer.appendChild(cube);
            }
        } else {
            const counterText = document.createElement('span');
            counterText.className = 'daily-lessons-counter';
            counterText.innerText = completed;
            cubesContainer.appendChild(counterText);
        }
    },

    renderCards() {
        const grid = document.getElementById('cardsGrid');
        grid.innerHTML = '';

        this.renderDailyProgress();

        // 1. Отрисовываем пустую карточку-кнопку для создания
        const creatorContainer = document.createElement('div');
        creatorContainer.className = 'card-container';
        creatorContainer.innerHTML = `
            <div class="card card-add-placeholder" onclick="FormHandler.openModalForCreate()">
                <div class="card-add-content">
                    <span class="plus-icon">➕</span>
                    <span class="plus-text">Создать карточку</span>
                </div>
            </div>
        `;
        grid.appendChild(creatorContainer);

        // 2. Умная трёхмерная фильтрация
        const f = UiManager.filters;
        let filteredCards = window.currentCards.filter(card => {
            const matchLvl = f.level === 'all' || card.levelStr === f.level;
            const matchPos = f.partOfSpeech === 'all' || card.partOfSpeech === f.partOfSpeech;
            const matchTopic = f.topic === 'all' || card.topic === f.topic;
            return matchLvl && matchPos && matchTopic;
        });

        // 3. Сортировка по алфавиту
        filteredCards.sort((a, b) => a.word.trim().toLowerCase().localeCompare(b.word.trim().toLowerCase(), 'en'));

        // 4. Отрисовка карточек
        filteredCards.forEach((card) => {
            const realIndex = window.currentCards.indexOf(card);
            
            const exampleHtml = card.example ? `<div class="card-example-box">“${card.example}”</div>` : '';
            const exampleTranslationHtml = card.exampleTranslation ? `<div class="card-example-box translation-box">(${card.exampleTranslation})</div>` : '';
            
            const correct = card.stats ? card.stats.correct : 0;
            const wrong = card.stats ? card.stats.wrong : 0;
            const reviewLvl = card.reviewLvl || 1;
            const isDue = card.nextReview ? new Date(card.nextReview) <= new Date() : true;
            
            let dueClass = '';
            if (reviewLvl === 6) dueClass = 'archived-card';
            else if (isDue) dueClass = 'due-card';

            const levelBadgeHtml = reviewLvl === 6 
                ? `<div class="master-badge">🥇 Выучено</div>`
                : `<div class="lvl-badge lvl-badge-${reviewLvl}">${reviewLvl}</div>`;

            // Компактные теги-пилюли для шапки карточки
            const tagsHtml = `
                <div class="card-header-tags">
                    <span class="tag-mini tag-lvl">${card.levelStr || 'A1'}</span>
                    <span class="tag-mini tag-pos">${card.partOfSpeech || 'Сущ.'}</span>
                    <span class="tag-mini tag-topic">${card.topic || 'Общее'}</span>
                </div>
            `;

            const statsHtml = `<div class="card-stats"><span class="stat-ok">✓ ${correct}</span><span class="stat-fail">✗ ${wrong}</span></div>`;
            
            const toolbarHtml = `
                <div class="card-toolbar">
                    <button class="icon-btn btn-edit" title="Редактировать" onclick="FormHandler.editCard(event, ${realIndex})">✏️</button>
                    <button class="icon-btn btn-delete" title="Удалить" onclick="FormHandler.deleteCard(event, ${realIndex})">🗑️</button>
                </div>
            `;

            const container = document.createElement('div');
            container.className = 'card-container';
            container.innerHTML = `
                <div class="card ${dueClass}" onclick="UiCardsRenderer.flipCard(this)">
                    <!-- Лицевая сторона -->
                    <div class="card-front">
                        <!-- ИСПРАВЛЕНО: Шапка теперь полностью свободна для длинных тегов групп -->
                        <div class="card-header-row">
                            ${tagsHtml}
                        </div>
                        
                        <!-- ИСПРАВЛЕНО: Кнопка прослушивания интегрирована прямо к слову по центру -->
                        <div class="card-content">
                            <div class="main-card-word-row">
                                <span class="main-card-word">${card.word}</span>
                                <button class="audio-btn inline-audio" onclick="ApiModule.speak('${card.word.replace(/'/g, "\\'")}', event)">🔊</button>
                            </div>
                            ${exampleHtml}
                        </div>
                        
                        <div class="card-footer-row">
                            ${levelBadgeHtml}
                            ${statsHtml}
                            ${toolbarHtml}
                        </div>
                    </div>
                    <!-- Обратная сторона -->
                    <div class="card-back">
                        <div class="card-header-row">
                            ${tagsHtml}
                        </div>
                        <div class="card-content">
                            <div class="main-card-word target-translation">${card.translation}</div>
                            ${exampleTranslationHtml}
                        </div>
                        <div class="card-footer-row">
                            ${levelBadgeHtml}
                            ${statsHtml}
                            ${toolbarHtml}
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(container);
        });
    },

    flipCard(element) { 
        if (element.classList.contains('card-add-placeholder') || element.classList.contains('archived-card')) return;
        element.classList.toggle('flipped'); 
    }
};
