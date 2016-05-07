var documents, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();
    index = 0;
    frame.src = documents[index];
}

function keyHandler(e) {
    console.log(e.keyCode);
    if (e.keyCode === 81 || e.keyCode === 27 ) { // Q / ESC
        e.preventDefault();
        window.chicken.quit();
    } else if (e.keyCode === 80) { // P
        if (index > 0) {
            index--;
            frame.src = documents[index];
        }
    } else if (e.keyCode === 78) { // N
        if (index < documents.length - 1) {
            index++;
            frame.src = documents[index];
        }
    }
}

window.addEventListener('load', init);
window.addEventListener('keydown', keyHandler);
