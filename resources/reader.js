var documents, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();
    index = 0;
    frame.src = documents[index];
    frame.addEventListener('load', initFrame);
}

function initFrame() {
    frame.contentWindow.focus();
    frame.contentDocument.addEventListener('keydown', keyHandler);

    var stylesheet = window.chicken.stylesheet();
    if (stylesheet) {
        injectStyle(frame.contentDocument.head, stylesheet);
    }
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

function maybeNextDocument(e) {
    var inner = frame.contentDocument.body;
    if (inner.scrollTop === inner.scrollHeight - frame.clientHeight) {
        e.preventDefault();
        nextDocument();
    }
}

function keyHandler(e) {
    if (e.keyCode === 81 || e.keyCode === 27) { // Q / ESC
        window.chicken.quit();
    } else if (e.keyCode === 32 && !e.shiftKey) { // SPC
        maybeNextDocument(e);
    } else if (e.keyCode === 80) { // P
        prevDocument();
    } else if (e.keyCode === 78) { // N
        nextDocument();
    }
}

window.addEventListener('load', init);
