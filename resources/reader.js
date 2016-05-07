var documents, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();
    index = 0;
    frame.src = documents[index];
}

function prevDocument() {
    if (index > 0) {
        index--;
        frame.src = documents[index];
    }
}

function nextDocument() {
    if (index < documents.length - 1) {
        index++;
        frame.src = documents[index];
    }
}

function pageUp() {
    var inner = frame.contentDocument.documentElement;
    if (inner.scrollTop > 0) {
        var scrollTop = Math.max(inner.scrollTop - inner.clientHeight, 0);
        inner.scrollTop = scrollTop;
    }
}

function pageDown() {
    var inner = frame.contentDocument.documentElement;
    if (inner.scrollTop < inner.scrollHeight - inner.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + inner.clientHeight,
                                 inner.scrollHeight);
        inner.scrollTop = scrollTop;
    }
}

function pageDownOrNextDocument() {
    var inner = frame.contentDocument.documentElement;
    if (inner.scrollTop < inner.scrollHeight - inner.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + inner.clientHeight,
                                 inner.scrollHeight);
        inner.scrollTop = scrollTop;
    } else {
        nextDocument();
    }
}

function keyHandler(e) {
    if (e.keyCode === 81 || e.keyCode === 27 ) { // Q / ESC
        window.chicken.quit();
    } else if (e.keyCode === 32 ) { // SPC
        if (e.shiftKey) {
            pageUp();
        } else {
            pageDownOrNextDocument();
        }
    } else if (e.keyCode === 33) { // <pgup>
        pageUp();
    } else if (e.keyCode === 34) { // <pgdn>
        pageDown();
    } else if (e.keyCode === 80) { // P
        prevDocument();
    } else if (e.keyCode === 78) { // N
        nextDocument();
    }
}

window.addEventListener('load', init);
window.addEventListener('keydown', keyHandler);
