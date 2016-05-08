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

function pageScrollSize() {
    var inner = frame.contentDocument.body;
    var fontSize = parseFloat(window.getComputedStyle(inner, null).fontSize);
    return Math.floor(frame.clientHeight - fontSize);
}

function pageUp() {
    var inner = frame.contentDocument.body;
    if (inner.scrollTop > 0) {
        var scrollTop = Math.max(inner.scrollTop - pageScrollSize(), 0);
        inner.scrollTop = scrollTop;
    }
}

function pageDown() {
    var inner = frame.contentDocument.body;
    if (inner.scrollTop < inner.scrollHeight - frame.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + pageScrollSize(),
                                 inner.scrollHeight);
        inner.scrollTop = scrollTop;
    }
}

function pageDownOrNextDocument() {
    var inner = frame.contentDocument.body;
    if (inner.scrollTop < inner.scrollHeight - frame.clientHeight) {
        var scrollTop = Math.min(inner.scrollTop + pageScrollSize(),
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
