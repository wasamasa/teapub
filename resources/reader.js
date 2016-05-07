var documents, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();
    index = 0;
    frame.src = documents[index];
}

function getInnerBody(e) {
    return e.contentDocument.documentElement.getElementsByTagName('body')[0];
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
    var inner = getInnerBody(frame);
    if (inner.scrollTop > 0) {
        var scrollTop = Math.max(inner.scrollTop - frame.clientHeight, 0);
        inner.scrollTop = scrollTop;
    }
}

function pageDown() {
    var inner = getInnerBody(frame);
    if (inner.scrollTop < inner.scrollHeight - frame.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + frame.clientHeight,
                                 inner.scrollHeight);
        inner.scrollTop = scrollTop;
    }
}

function pageDownOrNextDocument() {
    var inner = getInnerBody(frame);
    if (inner.scrollTop < inner.scrollHeight - frame.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + frame.clientHeight,
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
