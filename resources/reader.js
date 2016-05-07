function init() {
    frame = document.getElementById('content');
    frame.src = window.chicken.documents()[0];
}

window.addEventListener('load', init);
