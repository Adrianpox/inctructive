document.addEventListener('DOMContentLoaded', function() {
    const startupScreen = document.getElementById('startup-screen');
    const loadingText = document.getElementById('loading-text');
    let hasStarted = false;

    if (!startupScreen) return;

    document.addEventListener('keydown', function(event) {
        if ((event.code === 'Space' || event.keyCode === 32) && !hasStarted) {
            event.preventDefault();
            hasStarted = true;
            let openPageSoundEffect = new Audio('open-page-sound.mp3');
            openPageSoundEffect.play();

            startupScreen.classList.add('is-animating');

            // --- СЧЕТЧИК ПРОЦЕНТОВ ---
            setTimeout(() => {
                let startTimestamp = null;
                const duration = 5000; // 5 секунд

                function step(timestamp) {
                    if (!startTimestamp) startTimestamp = timestamp;
                    const progressTime = timestamp - startTimestamp;
                    
                    let percent = (progressTime / duration);
                    percent = 1 - Math.pow(1 - percent, 3); 
                    percent = Math.floor(percent * 100);

                    if (percent > 100) percent = 100;
                    loadingText.textContent = percent + "%";

                    if (progressTime < duration) {
                        window.requestAnimationFrame(step);
                    } else {
                        loadingText.textContent = "100%";
                    }
                }
                window.requestAnimationFrame(step);
                let loadPageSoundEffect = new Audio('load-page-sound.mp3');
                loadPageSoundEffect.play();
            }, 2500); // Старт после анимации Supercell

            // --- БЕСШОВНЫЙ ПЕРЕХОД ---
            // Общее время: 2.5с (Supercell) + 5с (Полоска) = 7500мс
            setTimeout(() => {
                // 1. Плавно растворяем экран загрузки в черноту
                startupScreen.style.opacity = '0';
                
                // 2. Ждем полсекунды, пока отработает CSS transition (затемнение)
                setTimeout(() => {
                    // 3. Совершаем реальный переход на предзагруженную страницу
                    // Замените 'main.html' на имя вашего файла
                    window.location.href = 'second-page.html'; 
                }, 500);

            }, 7500); 
        }
    });
});