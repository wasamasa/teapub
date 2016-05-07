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
    ;; NOTE: files referenced by the content file is relative to it
    (content-files (pathname-directory content-file) sxml)))

(define (clean-up directory)
  (when (file-exists? directory)
    (delete-directory directory #t)))

;;; webkit

(define documents (make-parameter #()))

(define (initialize-webkit-window! window)
  (let ((chicken (jso-new (jso-ref window 'Object))))
    (jso-set! chicken 'documents documents)
    (jso-set! chicken 'quit main-loop-quit!)
    (jso-set! window 'chicken chicken)))

(define (open-webkit-window! url)
  (make-window url
               #:status-visible? #f
               #:developer-extras? #t
               #:initialize! initialize-webkit-window!)
  (main-loop))

;;; CLI

(define (print-error . args)
  (with-output-to-port (current-error-port)
    (lambda () (apply print args))))

(define (main)
  (when (not (= (length (command-line-arguments)) 1))
    (print-error "No filename specified")
    (exit 1))
  (let* ((directory (create-temporary-directory))
         (filename (car (command-line-arguments)))
         (status (unzip-epub directory filename)))
    (when (not status)
      (print-error "Could not extract archive")
      (clean-up directory)
      (exit 1))
    (when (not (epub-valid? directory))
      (print-error "Invalid EPUB file")
      (clean-up directory)
      (exit 1))
    (documents (list->vector (epub-documents directory)))
    (let ((file (make-absolute-pathname (current-directory)
                                        "resources/index.html")))
      (open-webkit-window! (string-append "file://" file)))
    (clean-up directory)))

(main)
