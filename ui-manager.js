// Модуль отрисовки интерфейса (UI Rendering Module)

const UiManager = {
    selectedCategoryFilter: 'all',

    updateCategorySelects() {
        const catSelect = document.getElementById('categorySelect');
        const customOptionsContainer = document.getElementById('customSelectOptions');
        const categories = StorageModule.getCategories();
        
        catSelect.innerHTML = '';
        customOptionsContainer.innerHTML = `
            <div class="custom-select-option" onclick="UiManager.selectCustomCategory('all', 'Все категории')">Все категории</div>
        `;

        categories.forEach(cat => {
            catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
            
            const optionDiv = document.createElement('div');
            optionDiv.className = 'custom-select-option';
            optionDiv.innerText = cat;
            optionDiv.onclick = () => UiManager.selectCustomCategory(cat, cat);
            customOptionsContainer.appendChild(optionDiv);
        });
    },

    toggleCustomSelect(event) {
        event.stopPropagation();
        const container = document.getElementById('customSelectContainer');
        container.classList.toggle('open');
        
        if (container.classList.contains('open')) {
            const closeSelect = (e) => {
                if (!container.contains(e.target)) {
                    container.classList.remove('open');
                    document.removeEventListener('click', closeSelect);
                }
            };
            document.addEventListener('click', closeSelect);
        }
    },

    selectCustomCategory(value, label) {
        this.selectedCategoryFilter = value;
        document.getElementById('customSelectValue').innerText = label;
        document.getElementById('customSelectContainer').classList.remove('open');
        this.renderCards();
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
    },

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
                if (i < completed) {
                    cube.classList.add('completed');
                }
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
        const filterCategory = this.selectedCategoryFilter;
        grid.innerHTML = '';

        this.renderDailyProgress();

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

        let filteredCards = window.currentCards.filter(card => {
            return filterCategory === 'all' || card.category === filterCategory;
        });

        filteredCards.sort((a, b) => {
            const wordA = a.word.trim().toLowerCase();
            const wordB = b.word.trim().toLowerCase();
            return wordA.localeCompare(wordB, 'en');
        });

        filteredCards.forEach((card) => {
            const realIndex = window.currentCards.indexOf(card);
            
            // Лицевая сторона: пример на английском
            const exampleHtml = card.example ? `<div class="card-example">“${card.example}”</div>` : '';
            
            // ИСПРАВЛЕНО: Обратная сторона: перевод примера на русском (если он есть в базе)
            const exampleTranslationHtml = card.exampleTranslation 
                ? `<div class="card-example-translation">(${card.exampleTranslation})</div>` 
                : '';
            
            const correct = card.stats ? card.stats.correct : 0;
            const wrong = card.stats ? card.stats.wrong : 0;
            const level = card.level || 1;
            
            const isDue = card.nextReview ? new Date(card.nextReview) <= new Date() : true;
            
            let dueClass = '';
            if (level === 6) {
                dueClass = 'archived-card';
            } else if (isDue) {
                dueClass = 'due-card';
            }

            const levelBadgeHtml = level === 6 
                ? `<div class="master-badge">🥇 Выучено</div>`
                : `<div class="lvl-badge lvl-badge-${level}">${level}</div>`;

            const statsHtml = `
                <div class="card-stats">
                    <span class="stat-ok">✓ ${correct}</span>
                    <span class="stat-fail">✗ ${wrong}</span>
                </div>
            `;

            const toolbarHtml = `
                <div class="card-toolbar">
                    <button class="icon-btn btn-edit" title="Редактировать" onclick="FormHandler.editCard(event, ${realIndex})">✏️</button>
                    <button class="icon-btn btn-delete" title="Удалить" onclick="FormHandler.deleteCard(event, ${realIndex})">🗑️</button>
                </div>
            `;

            const container = document.createElement('div');
            container.className = 'card-container';
            container.innerHTML = `
                <div class="card ${dueClass}" onclick="UiManager.flipCard(this)">
                    <!-- Лицевая сторона -->
                    <div class="card-front">
                        <div class="card-header-row">
                            ${statsHtml}
                            <button class="audio-btn" onclick="ApiModule.speak('${card.word.replace(/'/g, "\\'")}', event)">🔊</button>
                        </div>
                        
                        <div class="card-content">
                            ${card.word}
                            ${exampleHtml}
                            <div class="card-category">${card.category}</div>
                        </div>
                        
                        <div class="card-footer-row">
                            ${levelBadgeHtml}
                            ${toolbarHtml}
                        </div>
                    </div>
                    <!-- Обратная сторона -->
                    <div class="card-back">
                        <div class="card-header-row">
                            ${statsHtml}
                            <div></div>
                        </div>
                        
                        <div class="card-content">
                            ${card.translation}
                            <!-- ИСПРАВЛЕНО: Выводим перевод примера под русским словом -->
                            ${exampleTranslationHtml}
                            <div class="card-category">${card.category}</div>
                        </div>
                        
                        <div class="card-footer-row">
                            ${levelBadgeHtml}
                            ${toolbarHtml}
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(container);
        });
    },

    flipCard(element) { 
        if (element.classList.contains('card-add-placeholder')) return;
        if (element.classList.contains('archived-card')) return;
        element.classList.toggle('flipped'); 
    }
};
