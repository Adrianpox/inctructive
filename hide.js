let hiddenBtn = document.querySelector('.hidden-btn');
let coinValues = document.querySelectorAll('.coin__value');
let input = document.querySelector('.scale-input');
let scaleBtn = document.querySelector('.scale-btn');

// Функция для обновления видимости
function updateVisibility() {
    if (hiddenBtn.checked) {
        coinValues.forEach(value => value.classList.add('hidden-value'));
    } else {
        coinValues.forEach(value => value.classList.remove('hidden-value'));
    }
}

// Вызываем функцию сразу при загрузке скрипта
updateVisibility();

// Слушаем изменения
hiddenBtn.addEventListener('change', updateVisibility);

// Оставляем вашу логику масштабирования
scaleBtn.addEventListener('click', () => {
    let scale = input.value;
    if (!scale) return; // Проверка на пустой ввод
    coinValues.forEach(value => {
        value.textContent = Math.round(+scale * +value.textContent);
    });
});