var documents, filename, lastPlace, index, frame;

function init() {
    frame = document.getElementById('content');
    documents = window.chicken.documents();

    filename = window.chicken.filename();
    lastPlace = window.chicken.lastPlace(filename);
    if (lastPlace.type === 'vector') {
        index = lastPlace[0];
    } else {
        index = 0;
    }

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

    if (lastPlace.type === 'vector') {
        frame.contentDocument.body.scrollTop = lastPlace[1];
        // HACK: restore the last location only once
        lastPlace = false;
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
        var scrollTop = frame.contentDocument.body.scrollTop;
        window.chicken.addToLastPlaces(filename, index, scrollTop);
        window.chicken.quit();
    } else if (e.keyCode === 32 && !e.shiftKey) { // SPC
        maybeNextDocument(e);
    } else if (e.keyCode === 80) { // P
        prevDocument();
    } else if (e.keyCode === 78) { // N
        nextDocument();
    }
}

window.addEventListener('DOMContentLoaded', init);
