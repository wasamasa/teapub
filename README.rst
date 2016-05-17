Teapub
======

`Screenshot <https://raw.github.com/wasamasa/teapub/master/img/scrot.png>`_

About
-----

A simple EPUB viewer based on the `webkit egg
<http://www.chust.org/fossils/webkit/home>`_.

Installation
------------

This requires the ``unzip`` command to be on PATH.  Other than that,
the webkitgtk library must be available for the webkit egg to install.

.. code::

    $ git clone https://github.com/wasamasa/teapub
    $ cd teapub
    $ chicken-install
    $ teapub book.epub

Features
--------

- Basic navigation
- Custom stylesheet
- Saving and restoring the last read position

Usage
-----

After opening a document, you can scroll with the usual keys (``SPC``,
``S-SPC``, ``<up>``, ``<down>``, ``<pgup>``, ``<pgdown>``, etc.),
switch to the previous/next chapter with ``p`` and ``n`` and quit the
viewer with either ``q`` or ``ESC``.  ``SPC`` has been overloaded to
switch to the next chapter when at the bottom of the current one.

To use a custom stylesheet, copy a ``style.css`` to
``$XDG_CONFIG_HOME/teapub/`` or ``~/.config/teapub/``.
