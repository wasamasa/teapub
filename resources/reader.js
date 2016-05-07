function init() {
    frame = document.getElementById('content');
    frame.src = window.chicken.documents()[0];
}

function keyHandler(e) {
    if (e.keyCode === 81 || e.keyCode === 27 ) { // ASCII Q/ESC
        e.preventDefault();
        window.chicken.quit();
    }
}

window.addEventListener('load', init);
window.addEventListener('keydown', keyHandler);
