(use extras files data-structures scsh-process srfi-1
     ssax sxpath sxml-transforms webkit)

;;; sxml helpers

(define (strip-namespaces sxml)
  (pre-post-order*
   sxml
   `((*text* . ,(lambda (_ str) str))
     (*default* . ,(lambda (tag elements)
                     (if (namespaced-tag? tag)
                         (cons (strip-namespace tag) elements)
                         (cons tag elements)))))))

(define (xml->sxml filename)
  (condition-case
   (with-input-from-file filename
     (lambda () (ssax:xml->sxml (current-input-port) '())))
   ((exn ssax) #f)))

(define (parse-xml filename)
  (and-let* ((sxml (xml->sxml filename)))
    (strip-namespaces sxml)))

(define (namespaced-tag? tag)
  (let ((name (symbol->string tag)))
    (substring-index ":" name)))

(define (strip-namespace tag)
  (let ((name (symbol->string tag)))
    (string->symbol (last (string-split name ":")))))

(define (non-blank-string string)
  (if (not (equal? string ""))
      string
      #f))

;;; epub preprocessing

(define (unzip-epub directory filename)
  (receive (exit-code status _pid)
     (run (unzip -d ,directory ,filename) (= 2 1) (> "/dev/null"))
   (and status (zero? exit-code))))

(define (file-contents filename)
  (with-input-from-file filename read-string))

(define (mimetype-valid? directory)
  (let ((filename (make-pathname directory "mimetype")))
    (and (file-exists? filename)
         (equal? (file-contents filename) "application/epub+zip"))))

(define (container-file directory)
  (make-pathname directory "META-INF/container.xml"))

(define (container-content-file sxml)
  ((sxpath "string(/container/rootfiles
                   /rootfile[@media-type='application/oebps-package+xml']
                   /@full-path)") sxml))

(define (container-valid? directory)
  (and-let* ((filename (container-file directory))
             ((file-exists? filename))
             (sxml (strip-namespaces (parse-xml filename)))
             (content-file (non-blank-string (container-content-file sxml)))
             ((file-exists? (make-pathname directory content-file))))
    #t))

(define (epub-valid? directory)
  (and (mimetype-valid? directory)
       (container-valid? directory)))

(define (content-manifest directory sxml)
  (map (lambda (item)
         (let ((id ((sxpath "string(/@id)") item))
               (source ((sxpath "string(/@href)") item)))
           (cons (string->symbol id) (make-pathname directory source))))
       ((sxpath "/package/manifest/item") sxml)))

(define (content-spine sxml)
  (map
   (lambda (item)
     (string->symbol ((sxpath "string(/@idref)") item)))
   ((sxpath "/package/spine/itemref") sxml)))

(define (content-files directory sxml)
  (let ((manifest (content-manifest directory sxml))
        (spine (content-spine sxml)))
    (map (lambda (item) (alist-ref item manifest))
         spine)))

(define (epub-documents directory)
  (let* ((sxml (parse-xml (container-file directory)))
         (content-file (make-pathname directory (container-content-file sxml)))
         (sxml (parse-xml content-file)))
    ;; NOTE: files referenced by the content file are relative to it
    (content-files (pathname-directory content-file) sxml)))

(define (clean-up directory)
  (when (file-exists? directory)
    (delete-directory directory #t)))

;;; last places

(define last-places (make-parameter '()))

(define (last-place filename)
  (and-let* ((place (alist-ref filename (last-places) equal?)))
    (list->vector place)))

(define (last-places-file)
  (let ((data-home (get-environment-variable "XDG_DATA_HOME")))
    (if (and data-home (equal? (string-ref data-home 0) #\/))
        (string-append data-home "/teapub/last_places")
        (string-append (get-environment-variable "HOME")
                       "/.local/share/teapub/last_places"))))

(define (load-last-places)
  (when (file-exists? (last-places-file))
    (let ((places (with-input-from-file (last-places-file) read)))
      (last-places places))))

(define (dump-last-places)
  (let ((base-directory (pathname-directory (last-places-file))))
    (when (not (file-exists? base-directory))
      (create-directory base-directory #t)))
  (with-output-to-file (last-places-file)
    (lambda () (pp (last-places)))))

(define (add-to-last-places filename index scroll-top)
  (last-places (alist-update filename (list index scroll-top)
                             (last-places) equal?)))

;;; webkit

(define (user-stylesheet-file)
  (let ((config-home (get-environment-variable "XDG_CONFIG_HOME")))
    (if (and config-home (equal? (string-ref config-home 0) #\/))
        (string-append config-home "/teapub/style.css")
        (string-append (get-environment-variable "HOME")
                       "/.config/teapub/style.css"))))

(define documents (make-parameter #()))
(define epub-filename (make-parameter #f))
(define user-stylesheet (make-parameter #f))

(define (initialize-webkit-window! window)
  (let ((chicken (jso-new (jso-ref window 'Object))))
    (jso-set! chicken 'documents documents)
    (jso-set! chicken 'userStylesheet user-stylesheet)
    (jso-set! chicken 'filename epub-filename)
    (jso-set! chicken 'addToLastPlaces add-to-last-places)
    (jso-set! chicken 'lastPlace last-place)
    (jso-set! chicken 'lastPlaces last-places)
    (jso-set! chicken 'quit main-loop-quit!)
    (jso-set! window 'chicken chicken)))

(define (open-webkit-window! url)
  (make-window url
               #:status-visible? #f
               #:developer-extras? #t
               #:initialize! initialize-webkit-window!)
  (main-loop))

;;; CLI

(define (extend-exception-handler thunk)
  (let ((original-handler (current-exception-handler)))
    (lambda (exception)
      (thunk)
      (original-handler exception))))

(define (print-error . args)
  (with-output-to-port (current-error-port)
    (lambda () (apply print args))))

(define (resources-directory)
  (make-pathname (chicken-home) "teapub/"))

(define (file-url path)
  (string-append "file://" path))
(define (main)
  (when (not (= (length (command-line-arguments)) 1))
    (print-error "No filename specified")
    (exit 1))
  (let* ((directory (create-temporary-directory))
         (filename (car (command-line-arguments)))
         (status (unzip-epub directory filename))
         (clean-up-thunk (lambda () (clean-up directory))))
    (on-exit clean-up-thunk)
    (extend-exception-handler clean-up-thunk)

    (when (not status)
      (print-error "Could not extract archive")
      (exit 1))
    (when (not (epub-valid? directory))
      (print-error "Invalid EPUB file")
      (exit 1))

    (epub-filename (pathname-strip-directory filename))
    (load-last-places)
    (when (file-exists? (user-stylesheet-file))
      (user-stylesheet (file-url (user-stylesheet-file))))
    (documents (list->vector (epub-documents directory)))
    (open-webkit-window! (file-url (make-pathname (resources-directory) "index.html")))

    (dump-last-places)))

(main)
