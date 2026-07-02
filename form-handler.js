// Модуль управления формами (Form Handling Module)

const FormHandler = {
    async autoTranslate() {
        const wordInput = document.getElementById('wordInput');
        const translationInput = document.getElementById('translationInput');
        const exampleInput = document.getElementById('exampleInput');
        const translateBtn = document.getElementById('translateBtn');
        const variantsContainer = document.getElementById('variantsContainer');
        const variantsList = document.getElementById('translationVariants');

        const text = wordInput.value.trim();
        if (!text) {
            alert('Сначала введите английское слово!');
            return;
        }

        translateBtn.innerText = '⏳ Ищу...';
        translateBtn.disabled = true;
        variantsContainer.style.display = 'none';
        variantsList.innerHTML = '';

        try {
            const data = await ApiModule.fetchTranslation(text);

            if (data && data.responseData) {
                let uniqueTranslations = new Set();
                if(data.responseData.translatedText) {
                    uniqueTranslations.add(data.responseData.translatedText.trim().toLowerCase());
                }

                if (data.matches) {
                    data.matches.forEach(match => {
                        if (match.translation) {
                            const cleanWord = match.translation.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim().toLowerCase();
                            if (cleanWord && cleanWord.split(' ').length <= 2 && cleanWord !== text.toLowerCase()) {
                                uniqueTranslations.add(cleanWord);
                            }
                        }
                    });
                }

                const translationsArray = Array.from(uniqueTranslations);

                if (translationsArray.length > 0) {
                    variantsContainer.style.display = 'block';
                    translationsArray.forEach((trans, index) => {
                        const label = document.createElement('label');
                        label.className = 'variant-item';
                        const checked = index === 0 ? 'checked' : '';
                        label.innerHTML = `
                            <input type="checkbox" value="${trans}" ${checked} onchange="FormHandler.collectSelectedTranslations()">
                            <span>${trans}</span>
                        `;
                        variantsList.appendChild(label);
                    });
                    this.collectSelectedTranslations();
                } else {
                    translationInput.value = data.responseData.translatedText;
                }

                let foundExample = '';
                if (data.matches) {
                    for (let i = 0; i < data.matches.length; i++) {
                        const match = data.matches[i];
                        if (match.segment && match.segment.toLowerCase() !== text.toLowerCase() && match.segment.length > text.length * 2) {
                            foundExample = match.segment;
                            break;
                        }
                    }
                }
                exampleInput.value = foundExample;
                if(!foundExample) exampleInput.placeholder = "Пример не найден, можно ввести вручную";

            } else {
                alert('Слово не распознано.');
            }
        } catch (e) {
            alert('Ошибка соединения. Введите перевод вручную.');
        } finally {
            translateBtn.innerText = '🔍 Автоперевод';
            translateBtn.disabled = false;
        }
    },

    collectSelectedTranslations() {
        const checkboxes = document.querySelectorAll('#translationVariants input[type="checkbox"]');
        const translationInput = document.getElementById('translationInput');
        let selected = [];
        checkboxes.forEach(cb => { if (cb.checked) selected.push(cb.value); });
        translationInput.value = selected.join(', ');
    },

    addCard() {
        const word = document.getElementById('wordInput').value.trim();
        const translation = document.getElementById('translationInput').value.trim();
        const example = document.getElementById('exampleInput').value.trim();
        const newCat = document.getElementById('newCategoryInput').value.trim();
        let category = document.getElementById('categorySelect').value;
        const editIndex = parseInt(document.getElementById('editIndex').value);

        if (!word || !translation) {
            alert('Заполните обязательные поля!');
            return;
        }

        if (newCat) {
            if (StorageModule.addCategoryIfNew(newCat)) {
                UiManager.updateCategorySelects();
            }
            category = newCat;
        }

        // Сохраняем старую статистику при редактировании, либо создаем новую
        let stats = { correct: 0, wrong: 0 };
        let level = 1;
        let nextReview = new Date().toISOString();

        if (editIndex > -1 && window.currentCards[editIndex]) {
            stats = window.currentCards[editIndex].stats || stats;
            level = window.currentCards[editIndex].level || level;
            nextReview = window.currentCards[editIndex].nextReview || nextReview;
        }

        const cardData = { word, translation, example, category, stats, level, nextReview };

        if (editIndex > -1) {
            window.currentCards[editIndex] = cardData;
            this.cancelEdit();
        } else {
            window.currentCards.push(cardData);
        }

        StorageModule.saveCards(window.currentCards);

        document.getElementById('wordInput').value = '';
        document.getElementById('translationInput').value = '';
        document.getElementById('exampleInput').value = '';
        document.getElementById('newCategoryInput').value = '';
        document.getElementById('variantsContainer').style.display = 'none';

        UiManager.renderCards();
    },

    editCard(event, index) {
        event.stopPropagation();
        const card = window.currentCards[index];
        
        document.getElementById('wordInput').value = card.word;
        document.getElementById('translationInput').value = card.translation;
        document.getElementById('exampleInput').value = card.example || '';
        document.getElementById('categorySelect').value = card.category;
        document.getElementById('editIndex').value = index;
        document.getElementById('variantsContainer').style.display = 'none';

        document.getElementById('formTitle').innerText = "Редактировать карточку";
        document.getElementById('submitCardBtn').innerText = "Сохранить изменения";
        document.getElementById('cancelEditBtn').style.display = "inline-block";
        document.getElementById('creatorPanel').scrollIntoView({ behavior: 'smooth' });
    },

    cancelEdit() {
        document.getElementById('editIndex').value = "-1";
        document.getElementById('formTitle').innerText = "Добавить новую карточку";
        document.getElementById('submitCardBtn').innerText = "Добавить";
        document.getElementById('cancelEditBtn').style.display = "none";
        document.getElementById('wordInput').value = '';
        document.getElementById('translationInput').value = '';
        document.getElementById('exampleInput').value = '';
        document.getElementById('variantsContainer').style.display = 'none';
    },

    deleteCard(event, index) {
        event.stopPropagation();
        if (parseInt(document.getElementById('editIndex').value) === index) {
            this.cancelEdit();
        }
        if (confirm('Удалить эту карточку?')) {
            window.currentCards.splice(index, 1);
            StorageModule.saveCards(window.currentCards);
            UiManager.renderCards();
        }
    }
};
