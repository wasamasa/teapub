(define documents #f)
(define filename #f)
(define last-place #f)
(define index #f)
(define frame #f)

(define (init)
  (set! frame (%inline "document.getElementById" "content"))
  (set! documents (%inline "window.chicken.documents"))
  (set! filename (%inline "window.chicken.filename"))
  (set! last-place (%inline "window.chicken.lastPlace" filename))

  (if (equal? (.type last-place) "vector")
      (set! index (vector-ref last-place 0))
      (set! index 0))

  (set! (.src frame) (vector-ref documents index))
  (%inline ".addEventListener" frame "load" (callback init-frame)))

(define (maybe-set-scroll!)
  (when (equal? (.type last-place) "vector")
    (set! (.contentDocument.body.scrollTop frame) (vector-ref last-place 1))
    ;; HACK: restore the last location only once
    (set! last-place #f)))

(define (init-frame)
  (%inline ".contentWindow.focus" frame)
  (%inline ".addEventListener" (.contentWindow frame) "keydown" (callback key-handler))

  (let ((user-stylesheet (%inline "window.chicken.userStylesheet")))
    (if user-stylesheet
        (inject-style! (.contentDocument.head frame) user-stylesheet)
        ;; there is no custom stylesheet, so scroll can be set now
        (maybe-set-scroll!))))

(define (inject-style! element stylesheet)
  (let ((link (%inline "document.createElement" "link")))
    (set! (.href link) stylesheet)
    (set! (.rel link) "stylesheet")
    (set! (.type link) "text/css")
    ;; there is a custom stylesheet, so set scroll after it's loaded
    ;; in case it changed the iframe height
    (set! (.onload link) (callback maybe-set-scroll!))
    (%inline ".appendChild" element link)))

(define (prev-document!)
  (when (> index 0)
    (set! index (- index 1))
    (set! (.src frame) (vector-ref documents index))))

(define (next-document!)
  (when (< index (- (.length documents) 1))
    (set! index (+ index 1))
    (set! (.src frame) (vector-ref documents index))))

(define (maybe-next-document! event)
  (let ((inner (.contentDocument.body frame)))
    (when (= (.scrollTop inner) (- (.scrollHeight inner) (.clientHeight frame)))
      (.preventDefault event)
      (next-document!))))

(define (key-handler event)
  (let ((key-code (.keyCode event))
        (shift? (.shiftKey event)))
    (cond
     ((or (= key-code 81) (= key-code 27)) ;; Q / ESC
      (let ((scroll-top (.contentDocument.body.scrollTop frame)))
        (%inline "window.chicken.addToLastPlaces" filename index scroll-top)
        (%inline "window.chicken.quit")))
     ((and (= key-code 32) (not shift?)) ;; SPC
      (maybe-next-document! event))
     ((= key-code 80) ;; P
      (prev-document!))
     ((= key-code 78) ;; N
      (next-document!)))))

(%inline "window.addEventListener" "DOMContentLoaded" (callback init))
