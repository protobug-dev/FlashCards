// Модуль управления формами (Form Handling Module)

const FormHandler = {
    async autoTranslate() {
        const wordInput = document.getElementById('wordInput');
        const translationInput = document.getElementById('translationInput');
        const exampleInput = document.getElementById('exampleInput');
        const exampleTranslationInput = document.getElementById('exampleTranslationInput');
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
                let foundExampleTranslation = '';

                if (data.matches) {
                    for (let i = 0; i < data.matches.length; i++) {
                        const match = data.matches[i];
                        if (match.segment && match.segment.toLowerCase() !== text.toLowerCase() && match.segment.length > text.length * 2) {
                            foundExample = match.segment;
                            foundExampleTranslation = match.translation || '';
                            break;
                        }
                    }
                }
                
                exampleInput.value = foundExample;
                // ИСПРАВЛЕНО: Выводим найденный перевод примера прямо в новое текстовое поле инпута
                exampleTranslationInput.value = foundExampleTranslation;

                if(!foundExample) {
                    exampleInput.placeholder = "Пример не найден, можно ввести вручную";
                    exampleTranslationInput.placeholder = "Перевод примера можно ввести вручную";
                }

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

    openModalForCreate() {
        this.resetFormFields();
        document.getElementById('editIndex').value = "-1";
        document.getElementById('formTitle').innerText = "Добавить новую карточку";
        document.getElementById('submitCardBtn').innerText = "Добавить";
        
        document.getElementById('cardModal').classList.add('active');
        document.getElementById('wordInput').focus();
    },

    editCard(event, index) {
        event.stopPropagation();
        const card = window.currentCards[index];
        
        this.resetFormFields();
        
        document.getElementById('wordInput').value = card.word;
        document.getElementById('translationInput').value = card.translation;
        document.getElementById('exampleInput').value = card.example || '';
        // ИСПРАВЛЕНО: Подгружаем перевод примера в текстовое поле при редактировании
        document.getElementById('exampleTranslationInput').value = card.exampleTranslation || '';
        document.getElementById('categorySelect').value = card.category;
        document.getElementById('editIndex').value = index;

        document.getElementById('formTitle').innerText = "Редактировать карточку";
        document.getElementById('submitCardBtn').innerText = "Сохранить изменения";
        
        document.getElementById('cardModal').classList.add('active');
    },

    closeModal() {
        document.getElementById('cardModal').classList.remove('active');
        this.resetFormFields();
    },

    closeModalViaOverlay(event) {
        if (event.target.id === 'cardModal') {
            this.closeModal();
        }
    },

    resetFormFields() {
        document.getElementById('wordInput').value = '';
        document.getElementById('translationInput').value = '';
        document.getElementById('exampleInput').value = '';
        // ИСПРАВЛЕНО: Сбрасываем новое текстовое поле
        document.getElementById('exampleTranslationInput').value = '';
        document.getElementById('newCategoryInput').value = '';
        document.getElementById('variantsContainer').style.display = 'none';
        document.getElementById('translationVariants').innerHTML = '';
    },

    addCard() {
        const word = document.getElementById('wordInput').value.trim();
        const translation = document.getElementById('translationInput').value.trim();
        const example = document.getElementById('exampleInput').value.trim();
        // ИСПРАВЛЕНО: Считываем перевод примера напрямую из текстового поля инпута
        const exampleTranslation = document.getElementById('exampleTranslationInput').value.trim();
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

        let stats = { correct: 0, wrong: 0 };
        let level = 1;
        let nextReview = new Date().toISOString();

        if (editIndex > -1 && window.currentCards[editIndex]) {
            stats = window.currentCards[editIndex].stats || stats;
            level = window.currentCards[editIndex].level || level;
            nextReview = window.currentCards[editIndex].nextReview || nextReview;
        }

        const cardData = { word, translation, example, exampleTranslation, category, stats, level, nextReview };

        if (editIndex > -1) {
            window.currentCards[editIndex] = cardData;
        } else {
            window.currentCards.push(cardData);
        }

        StorageModule.saveCards(window.currentCards);
        this.closeModal();
        
        UiManager.updateCategorySelects();
        if (newCat) {
            document.getElementById('categorySelect').value = newCat;
        }
        
        UiManager.renderCards();
    },

    deleteCard(event, index) {
        event.stopPropagation();
        if (confirm('Удалить эту карточку?')) {
            window.currentCards.splice(index, 1);
            StorageModule.saveCards(window.currentCards);
            UiManager.renderCards();
        }
    }
};
