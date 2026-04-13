function loadData() {
    return JSON.parse(localStorage.getItem('teamsData')) || { characters: [] };
}

function getDeck(team) {
    return document.querySelector(`.deck[data-team="${team}"]`);
}

function getFreeSlot(deck) {
    const slots = deck.querySelectorAll('.slot__frame');
    return Array.from(slots).find(slot => !slot.children.length);
}

function createCard(image) {
    const card = document.createElement('div');
    card.className = 'secret-card__item';

    card.innerHTML = `
        <img src="${image}" class="secret-card__image">
    `;

    return card;
}

function renderDecks() {
    const data = loadData();

    data.characters.forEach(character => {
        const deck = getDeck(character.team);
        if (!deck) return;

        const slot = getFreeSlot(deck);
        if (!slot) return;

        const card = createCard(character.image);
        slot.appendChild(card);
    });
}

function clearDecks() {
    if (typeof window.resetThirdPageDecksAndSecretCards === 'function') {
        window.resetThirdPageDecksAndSecretCards();
        return;
    }

    localStorage.removeItem('teamsData');

    document.querySelectorAll('.slot__frame').forEach(slot => {
        slot.innerHTML = '';
    });

    document.querySelectorAll('.deck').forEach(deck => {
        deck.classList.remove('active-deck', 'deck-disabled');
    });
}

document.addEventListener('DOMContentLoaded', renderDecks);

document.querySelector('.clear-decks-btn')?.addEventListener('click', () => {
    if (!confirm('Очистить все колоды?')) return;
    clearDecks();
});