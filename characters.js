const characterImages = document.querySelectorAll('.character__image');

const TEAM_COLORS = {
    'color-one': '#ffffff',
    'color-two': '#ED2C2C',
    'color-three': '#F6C627',
    'color-four': '#27A3E6',
    'color-five': '#000000',
    'color-six': '#22C01D',
    'color-seven': '#FF00EE',
    'color-eight': '#D77D00'
};

let activePopoverContainer = null;
let activeTrigger = null;

function createPopoverContent(image) {
    const imageSrc = image.getAttribute('src') || '';
    const fileName = imageSrc.split('/').pop() || 'Персонаж';
    const characterName = fileName.replace(/\.[^.]+$/, '');

    return `
        <div class="popover__title">${characterName}</div>
        <div class="popover__colors">
            <button class="popover__color color-one" type="button" aria-label="Первая команда"></button>
            <button class="popover__color color-two" type="button" aria-label="Вторая команда"></button>
            <button class="popover__color color-three" type="button" aria-label="Третья команда"></button>
            <button class="popover__color color-four" type="button" aria-label="Четверта команда"></button>
            <button class="popover__color color-five" type="button" aria-label="Пятая команда"></button>
            <button class="popover__color color-six" type="button" aria-label="Шестая команда"></button>
            <button class="popover__color color-seven" type="button" aria-label="Седьмая команда"></button>
            <button class="popover__color color-eight" type="button" aria-label="Восьмая команда"></button>
        </div>
        <button class="popover__remove">Убрать</button>
    `;
}

function getStorageData() {
    return JSON.parse(localStorage.getItem('teamsData')) || { characters: [] };
}

function applyCharacterColor(image, team) {
    const characterItem = image.closest('.character__item');
    const color = TEAM_COLORS[team];

    if (!characterItem || !color) return;

    characterItem.style.setProperty('--team-color', color);
    characterItem.setAttribute('data-team-color', 'true');
}

function restoreCharacterColors() {
    const data = getStorageData();

    data.characters.forEach(character => {
        const image = document.getElementById(character.id);
        if (!image) return;

        applyCharacterColor(image, character.team);
    });
}

function removeCharacter(id) {
    const data = getStorageData();

    data.characters = data.characters.filter(c => c.id !== id);

    localStorage.setItem('teamsData', JSON.stringify(data));
}

function canAddMoreCharacters() {
    const data = getStorageData();
    return data.characters.length < 7;
}

function closePopover() {
    if (activePopoverContainer) {
        activePopoverContainer.remove();
        activePopoverContainer = null;
    }

    if (activeTrigger) {
        activeTrigger.classList.remove('character__image--active');
        activeTrigger = null;
    }
}

function saveCharacter(id, image, team) {
    const data = getStorageData();

    data.characters = data.characters.filter(c => c.id !== id);

    data.characters.push({
        id,
        image,
        team
    });

    localStorage.setItem('teamsData', JSON.stringify(data));
}

function positionPopover(trigger, popoverContainer, popoverElement) {
    const targetRect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gap = 14;

    popoverElement.classList.remove(
        'arrow-top',
        'arrow-bottom',
        'arrow-left',
        'arrow-right'
    );

    let top = targetRect.top - popoverContainer.offsetHeight - gap;
    let left = targetRect.left + (targetRect.width / 2) - (popoverContainer.offsetWidth / 2);

    popoverElement.classList.add('arrow-bottom');

    if (top < 8) {
        top = targetRect.bottom + gap;
        popoverElement.classList.remove('arrow-bottom');
        popoverElement.classList.add('arrow-top');
    }

    if (left + popoverContainer.offsetWidth > viewportWidth - 8) {
        left = viewportWidth - popoverContainer.offsetWidth - 8;
    }

    if (left < 8) {
        left = 8;
    }

    const fitsAbove = targetRect.top - popoverContainer.offsetHeight - gap >= 8;
    const fitsBelow = targetRect.bottom + popoverContainer.offsetHeight + gap <= viewportHeight - 8;

    if (!fitsAbove && !fitsBelow) {
        top = targetRect.top + (targetRect.height / 2) - (popoverContainer.offsetHeight / 2);
        left = targetRect.right + gap;

        popoverElement.classList.remove('arrow-top', 'arrow-bottom');
        popoverElement.classList.add('arrow-left');

        if (left + popoverContainer.offsetWidth > viewportWidth - 8) {
            left = targetRect.left - popoverContainer.offsetWidth - gap;
            popoverElement.classList.remove('arrow-left');
            popoverElement.classList.add('arrow-right');
        }

        if (top < 8) top = 8;
        if (top + popoverContainer.offsetHeight > viewportHeight - 8) {
            top = viewportHeight - popoverContainer.offsetHeight - 8;
        }
    }

    popoverContainer.style.top = `${top}px`;
    popoverContainer.style.left = `${left}px`;
}

function updatePopoverColorsState(popoverElement, characterId) {
    const data = JSON.parse(localStorage.getItem('teamsData')) || { characters: [] };
    const currentCharacter = data.characters.find(c => c.id === characterId);
    const currentTeam = currentCharacter ? currentCharacter.team : null;

    popoverElement.querySelectorAll('.popover__color').forEach(colorBtn => {
        const team = Array.from(colorBtn.classList)
            .find(cls => cls.startsWith('color-'));

        const teamCount = data.characters.filter(c => c.team === team).length;

        const shouldDisable = teamCount >= 7 && currentTeam !== team;

        colorBtn.disabled = shouldDisable;
        colorBtn.classList.toggle('popover__color--disabled', shouldDisable);
    });
}

function openPopover(trigger) {
    closePopover();

    const popoverContainer = document.createElement('div');
    popoverContainer.className = 'popover-container';

    const popoverElement = document.createElement('div');
    popoverElement.className = 'popover';
    popoverElement.innerHTML = createPopoverContent(trigger);
    updatePopoverColorsState(popoverElement, trigger.id);

    popoverElement.querySelectorAll('.popover__color').forEach(colorBtn => {
        colorBtn.addEventListener('click', () => {
            const id = trigger.id;
            const teamval = Array.from(colorBtn.classList)
                .find(cls => cls.startsWith('color-'));

            const data = JSON.parse(localStorage.getItem('teamsData')) || { characters: [] };
            const currentCharacter = data.characters.find(c => c.id === id);
            const currentTeam = currentCharacter ? currentCharacter.team : null;

            const teamCount = data.characters.filter(c => c.team === teamval).length;

            // запрещаем только если целевая команда уже заполнена
            // и персонаж не состоит в этой же команде
            if (teamCount >= 7 && currentTeam !== teamval) {
                alert('В этой команде уже 7 персонажей');
                return;
            }

            const team = Array.from(colorBtn.classList)
                .find(cls => cls.startsWith('color-'));

            applyCharacterColor(trigger, team);

            const imageSrc = trigger.getAttribute('src');

            saveCharacter(id, imageSrc, team);
            updateCharactersState();

            closePopover();
        });
    });

    popoverContainer.appendChild(popoverElement);
    document.body.appendChild(popoverContainer);

    positionPopover(trigger, popoverContainer, popoverElement);

    activePopoverContainer = popoverContainer;
    activeTrigger = trigger;
    activeTrigger.classList.add('character__image--active');

    popoverElement.querySelector('.popover__remove').addEventListener('click', () => {
        const characterItem = trigger.closest('.character__item');

        characterItem.style.removeProperty('--team-color');
        characterItem.removeAttribute('data-team-color');

        removeCharacter(trigger.id);
        updateCharactersState();

        closePopover();
    });
}

function updateCharactersState() {
    document.querySelectorAll('.character__image').forEach(img => {
        img.classList.remove('disabled');
    });
}

characterImages.forEach((image) => {
    image.addEventListener('click', (event) => {
        event.stopPropagation();

        if (activeTrigger === image) {
            closePopover();
            return;
        }

        openPopover(image);
    });
});

document.addEventListener('click', (event) => {
    if (!activePopoverContainer) return;

    const clickedInsidePopover = activePopoverContainer.contains(event.target);
    const clickedOnCharacter = event.target.closest('.character__image');

    if (!clickedInsidePopover && !clickedOnCharacter) {
        closePopover();
    }
});

window.addEventListener('resize', () => {
    if (!activePopoverContainer || !activeTrigger) return;

    const popoverElement = activePopoverContainer.querySelector('.popover');
    if (!popoverElement) return;

    positionPopover(activeTrigger, activePopoverContainer, popoverElement);
});

window.addEventListener('scroll', () => {
    if (!activePopoverContainer || !activeTrigger) return;

    const popoverElement = activePopoverContainer.querySelector('.popover');
    if (!popoverElement) return;

    positionPopover(activeTrigger, activePopoverContainer, popoverElement);
}, true);

restoreCharacterColors();
updateCharactersState();