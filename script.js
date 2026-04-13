const cards = document.querySelectorAll('.secret-card__item');
const decks = document.querySelectorAll('.deck');
const container = document.querySelector('.secret-card__container');
const secretCardList = document.querySelector('.secret-card__list');
const undoSecretCardBtn = document.querySelector('.undo-secret-card-btn');

let lastMovedCardInfo = null;

// --- РАБОТА С ПАМЯТЬЮ (localStorage) ---

function getTeamsData() {
    return JSON.parse(localStorage.getItem('teamsData')) || { characters: [], secretCards: [] };
}

function saveSecretCardToStorage(cardId, imageSrc, team) {
    const data = getTeamsData();
    if (!data.secretCards) data.secretCards = [];

    // Удаляем старую запись об этой карте, если она была
    data.secretCards = data.secretCards.filter(c => c.id !== cardId);
    data.secretCards.push({ id: cardId, image: imageSrc, team: team });

    localStorage.setItem('teamsData', JSON.stringify(data));
}

function removeSecretCardFromStorage(cardId) {
    const data = getTeamsData();
    if (!data.secretCards) return;

    data.secretCards = data.secretCards.filter(c => c.id !== cardId);
    localStorage.setItem('teamsData', JSON.stringify(data));
}

function restoreSecretCards() {
    const data = getTeamsData();
    if (!data.secretCards || data.secretCards.length === 0) return;

    data.secretCards.forEach(savedCard => {
        const cardElement = document.querySelector(`.secret-card__item[data-secret-index="${savedCard.id}"]`);
        const targetDeck = document.querySelector(`.deck[data-team="${savedCard.team}"]`);

        if (cardElement && targetDeck) {
            const targetSlot = getLastSlot(targetDeck);
            if (targetSlot && !targetSlot.querySelector('.secret-card__item')) {
                const innerCard = cardElement.querySelector('.card-inner');
                if (innerCard) innerCard.classList.add('is-flipped');
                
                targetSlot.appendChild(cardElement);
            }
        }
    });
}

// --- ЛОГИКА ВЕЕРА (10 КАРТ) ---

function ensureSecretCardIndices() {
    if (!secretCardList) return;
    const allCards = secretCardList.querySelectorAll('.secret-card__item');
    allCards.forEach((el, i) => {
        if (el.dataset.secretIndex === undefined) {
            el.dataset.secretIndex = String(i);
        }
    });
}

function getFanCards() {
    if (!secretCardList) return [];
    return Array.from(secretCardList.querySelectorAll(':scope > .secret-card__item'));
}

function resetFanCardStyles(card) {
    card.style.left = '';
    card.style.top = '';
    card.style.marginLeft = '';
    card.style.transform = '';
    card.style.zIndex = '';
    card.style.transition = '';
}

function layoutSecretCards() {
    const fanCards = getFanCards();
    const count = fanCards.length;

    // Если все 10 карт в веере - используем базовый CSS
    if (count === 10) {
        fanCards.forEach(resetFanCardStyles);
        return;
    }

    // Мапы для плавного сближения оставшихся карт (расстояние ~140px)
    const maxOffsetMap = { 9: 560, 8: 490, 7: 420, 6: 350, 5: 280, 4: 210, 3: 140, 2: 70, 1: 0 };
    const maxRotationMap = { 9: 20, 8: 17, 7: 14, 6: 11, 5: 8, 4: 6, 3: 4, 2: 2, 1: 0 };
    const maxTopMap = { 9: 110, 8: 95, 7: 82, 6: 70, 5: 60, 4: 50, 3: 42, 2: 35, 1: 30 };

    const maxOffset = maxOffsetMap[count] ?? 180;
    const maxRotation = maxRotationMap[count] ?? 7;
    const minTop = 30;
    const maxTop = maxTopMap[count] ?? 50;

    fanCards.forEach((card, index) => {
        if (card.classList.contains('is-active')) return;

        const middle = (count - 1) / 2;
        const ratio = middle === 0 ? 0 : (index - middle) / middle;

        const offsetX = ratio * maxOffset;
        const rotation = ratio * maxRotation;
        const top = minTop + Math.pow(Math.abs(ratio), 1.5) * (maxTop - minTop);

        card.style.transition = 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
        card.style.left = '50%';
        card.style.marginLeft = '0';
        card.style.top = `${top}px`;
        card.style.transform = `translateX(calc(-50% + ${offsetX}px)) rotate(${rotation}deg)`;
        card.style.zIndex = `${100 + index}`;
    });
}

// --- УПРАВЛЕНИЕ КОЛОДАМИ ---

function getLastSlot(deck) {
    const allSlots = deck.querySelectorAll('.slot__frame');
    return allSlots[allSlots.length - 1] || null;
}

function isLastSlotOccupied(deck) {
    const lastSlot = getLastSlot(deck);
    return lastSlot ? !!lastSlot.querySelector('.secret-card__item') : true;
}

function clearActiveDeck() {
    decks.forEach(deck => deck.classList.remove('active-deck'));
}

function updateDeckStates() {
    decks.forEach(deck => {
        if (isLastSlotOccupied(deck)) {
            deck.classList.add('deck-disabled');
            deck.classList.remove('active-deck');
        } else {
            deck.classList.remove('deck-disabled');
        }
    });
}

function getSelectedDeck() {
    return document.querySelector('.deck.active-deck');
}

// --- АНИМАЦИИ И ПЕРЕМЕЩЕНИЕ ---

function revealCardWithMagic(card) {
    const innerCard = card.querySelector('.card-inner');
    if (!innerCard || card.classList.contains('is-revealing') || innerCard.classList.contains('is-flipped')) return;

    card.classList.add('is-revealing');
    const onRevealEnd = () => {
        card.classList.remove('is-revealing');
        innerCard.classList.add('is-flipped');
        card.removeEventListener('animationend', onRevealEnd);
    };
    card.addEventListener('animationend', onRevealEnd);
}

function FLIP_moveToSlot(movingCard) {
    const selectedDeck = getSelectedDeck();
    if (!selectedDeck) return;

    const targetSlot = getLastSlot(selectedDeck);
    if (!targetSlot || targetSlot.querySelector('.secret-card__item')) return;

    const firstRect = movingCard.getBoundingClientRect();
    movingCard.classList.remove('is-active');

    // Сохраняем информацию для отмены
    lastMovedCardInfo = {
        card: movingCard,
        fromParent: secretCardList,
        nextSibling: movingCard.nextElementSibling
    };

    // Сохраняем в localStorage
    const cardId = movingCard.dataset.secretIndex;
    const imageSrc = movingCard.querySelector('.open-card img').getAttribute('src');
    const team = selectedDeck.dataset.team;
    saveSecretCardToStorage(cardId, imageSrc, team);

    targetSlot.appendChild(movingCard);
    layoutSecretCards();

    const lastRect = movingCard.getBoundingClientRect();
    const deltaX = firstRect.left - lastRect.left;
    const deltaY = firstRect.top - lastRect.top;

    movingCard.style.transition = 'none';
    movingCard.style.transformOrigin = 'top left';
    movingCard.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    movingCard.offsetHeight; // trigger reflow

    movingCard.style.transition = 'transform 0.6s cubic-bezier(0.25, 0.8, 0.25, 1)';
    movingCard.style.transform = 'translate(0, 0)';

    if (container) container.classList.remove('has-active-card');

    movingCard.addEventListener('transitionend', function cleanup(e) {
        if (e.propertyName === 'transform') {
            movingCard.style.transition = '';
            movingCard.style.transform = '';
            movingCard.style.transformOrigin = '';
            movingCard.removeEventListener('transitionend', cleanup);
        }
    });

    selectedDeck.classList.remove('active-deck');
    updateDeckStates();
}

function returnLastSecretCard() {
    if (!lastMovedCardInfo) return;

    const { card, fromParent, nextSibling } = lastMovedCardInfo;
    
    // Удаляем из localStorage
    removeSecretCardFromStorage(card.dataset.secretIndex);

    if (nextSibling && nextSibling.parentNode === fromParent) {
        fromParent.insertBefore(card, nextSibling);
    } else {
        fromParent.appendChild(card);
    }

    card.classList.remove('is-active', 'is-revealing');
    const innerCard = card.querySelector('.card-inner');
    if (innerCard) innerCard.classList.remove('is-flipped');

    resetFanCardStyles(card);
    layoutSecretCards();

    if (container) container.classList.remove('has-active-card');
    lastMovedCardInfo = null;
    updateDeckStates();
}

// --- ОБРАБОТЧИКИ СОБЫТИЙ ---

decks.forEach(deck => {
    deck.addEventListener('click', (e) => {
        e.stopPropagation();
        if (deck.classList.contains('deck-disabled')) return;
        clearActiveDeck();
        deck.classList.add('active-deck');
    });
});

if (cards.length > 0) {
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.stopPropagation();
            if (card.closest('.slot__frame')) return;

            const innerCard = card.querySelector('.card-inner');
            const isActive = card.classList.contains('is-active');
            const isFlipped = innerCard.classList.contains('is-flipped');

            if (!isActive) {
                cards.forEach(c => !c.closest('.slot__frame') && c.classList.remove('is-active'));
                card.classList.add('is-active');
                if (container) container.classList.add('has-active-card');
            } else if (!isFlipped) {
                revealCardWithMagic(card);
            } else {
                const selectedDeck = getSelectedDeck();
                if (selectedDeck && !isLastSlotOccupied(selectedDeck)) {
                    FLIP_moveToSlot(card);
                }
            }
        });
    });
}

document.addEventListener('click', (e) => {
    if (!e.target.closest('.secret-card__item') && !e.target.closest('.deck')) {
        cards.forEach(c => !c.closest('.slot__frame') && c.classList.remove('is-active'));
        if (container) container.classList.remove('has-active-card');
    }
});

if (undoSecretCardBtn) undoSecretCardBtn.addEventListener('click', returnLastSecretCard);

// Сброс всех данных (вызывается извне)
window.resetThirdPageDecksAndSecretCards = function() {
    localStorage.removeItem('teamsData');
    location.reload(); // Простейший способ очистить всё состояние
};

// --- ИНИЦИАЛИЗАЦИЯ ---

ensureSecretCardIndices();
restoreSecretCards(); 
layoutSecretCards();
updateDeckStates();

window.addEventListener('resize', layoutSecretCards);