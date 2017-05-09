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

FAQ
---

**Q**: When I open an epub file, I see a window with the cover
thumbnail open.  Shortly after the viewer quits for no apparent
reason.  What's going on here?

**A**: This is a focus bug in the webkit egg.  For yet unknown reasons
the webkit egg does run a watchdog that (among other things)
periodically checks how many top-level windows are visible and kills
the application after failing to find any.  Incidentally, if you open
a window with it and immediately steal its focus, it cannot see that
top-level window and therefore quits the viewer.

I wrote a small patch that removes this hack in favor of linking
application exit to window deletion which hasn't made it upstream
yet.  If you're interested in it, I could publish my forked version of
the egg.

**Q**: When I exit the viewer, I see messages about a segfault in the
finalizer.  Is this normal?

**A**: This appears to be another bug in the webkit egg.  Despite the
segfault messages, the finalizers are run successfully, so ignore
these for now until the bug has been fixed.

**Q**: How do I debug the viewer?

**A**: For the sake of convenience, the debugging tools have been
enabled and are available in the context menu.  Open the inspector for
tweaking the CSS and executing JavaScript.
