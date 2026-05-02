let hiddenBtn = document.querySelector('.hidden-btn');
let coinValues = document.querySelectorAll('.coin__value');
let input = document.querySelector('.scale-input');
let scaleBtn = document.querySelector('.scale-btn');

// Ключ для хранения данных в браузере
const STORAGE_KEY = 'priceState';

// 1. Инициализация: сохраняем БАЗОВЫЕ значения и загружаем состояние
coinValues.forEach(value => {
    // Сохраняем исходный текст из HTML как базу (только если еще не сохранили)
    if (!value.dataset.baseValue) {
        value.dataset.baseValue = value.textContent.trim();
    }
});

function getSavedState() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : { isHidden: false, scale: 1 };
}

function saveState(isHidden, scale) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ isHidden, scale }));
}

// 2. Функция применения состояния (при загрузке или изменениях)
function applyState() {
    const state = getSavedState();

    // Устанавливаем положение чекбокса
    hiddenBtn.checked = state.isHidden;

    // Применяем видимость
    coinValues.forEach(value => {
        if (state.isHidden) {
            value.classList.add('hidden-value');
        } else {
            value.classList.remove('hidden-value');
        }
        
        // Применяем сохраненный коэффициент к базовым значениям
        const base = parseFloat(value.dataset.baseValue);
        value.textContent = Math.round(base * state.scale);
    });
}

// Запускаем при загрузке
applyState();

// 3. Обработка переключения видимости
hiddenBtn.addEventListener('change', () => {
    const state = getSavedState();
    saveState(hiddenBtn.checked, state.scale);
    applyState();
});

// 4. Обработка умножения цен
scaleBtn.addEventListener('click', () => {
    let rawValue = input.value.trim().replace(',', '.');
    
    // Если введено не число - просто очищаем и выходим
    if (rawValue === '' || isNaN(rawValue)) {
        input.value = '';
        return; 
    }

    const newScale = parseFloat(rawValue);
    const state = getSavedState();

    // Сохраняем новый коэффициент и текущую видимость
    saveState(state.isHidden, newScale);
    
    // Обновляем отображение
    applyState();

    // Очищаем поле ввода
    input.value = '';
});