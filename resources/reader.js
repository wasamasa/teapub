var documents, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();
    index = 0;
    frame.src = documents[index];
    frame.addEventListener('load', setStylesheet);
}

function injectStyle(element, stylesheet) {
    var links = element.querySelectorAll('link[rel="stylesheet"]');
    for (var i = 0; i < links.length; i++) {
        links[i].remove();
    }

    var link = document.createElement('link');
    link.href = stylesheet;
    link.rel = 'stylesheet';
    link.type = 'text/css';
    element.appendChild(link);
}

function setStylesheet() {
    var stylesheet = window.chicken.stylesheet();
    if (stylesheet) {
        injectStyle(frame.contentDocument.head, stylesheet);
    }
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

function frameFontSize() {
    var inner = frame.contentDocument.body;
    return Math.ceil(parseFloat(window.getComputedStyle(inner, null).fontSize));
}

function framePageSize() {
    return frame.clientHeight - frameFontSize();
}

function isFrameTop() {
    return frame.contentDocument.body.scrollTop === 0;
}

function isFrameBottom() {
    var inner = frame.contentDocument.body;
    return inner.scrollTop === inner.scrollHeight - frame.clientHeight;
}

function scrollUpBy(amount) {
    var inner = frame.contentDocument.body;
    inner.scrollTop = Math.max(inner.scrollTop - amount, 0);
}

function scrollDownBy(amount) {
    var inner = frame.contentDocument.body;
    inner.scrollTop = Math.min(inner.scrollTop + amount, inner.scrollHeight);
}

function lineUp() {
    if (!isFrameTop()) {
        scrollUpBy(frameFontSize());
    }
}

function lineDown() {
    if (!isFrameBottom()) {
        scrollDownBy(frameFontSize());
    }
}

function pageUp() {
    if (!isFrameTop()) {
        scrollUpBy(framePageSize());
    }
}

function pageDown() {
    if (!isFrameBottom()) {
        scrollDownBy(framePageSize());
    }
}

function pageDownOrNextDocument() {
    if (!isFrameBottom()) {
        scrollDownBy(framePageSize());
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
    } else if (e.keyCode === 75 || e.keyCode == 38) { // K / <up>
        lineUp();
    } else if (e.keyCode === 74 || e.keyCode == 40) { // J / <down>
        lineDown();
    } else if (e.keyCode === 80) { // P
        prevDocument();
    } else if (e.keyCode === 78) { // N
        nextDocument();
    }
}

window.addEventListener('load', init);
window.addEventListener('keydown', keyHandler);
