electron-settings 
==================

A fast and powerful persistent user settings manager for [Electron](https://electron.atom.io), adapted from [Atom's own configuration manager](https://github.com/atom/atom/blob/master/src/config.coffee).

Having trouble? [Check the troubleshooting guide]()!

Migrating from v1? [Click me]().

[![Join the chat at https://gitter.im/nathanbuchar/electron-settings](https://badges.gitter.im/nathanbuchar/electron-settings.svg)](https://gitter.im/nathanbuchar/electron-settings?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)



***


How It Works
------------

Electron doesn't have a built-in system for managing persistent user settings for your application. Bummer. This package attempts to bridge that gap.

With electron-settings, you aren't actually communicating directly with the file system. Instead, you're interacting with a local copy of the settings object that's stored in memory. Any time this cache is modified, a save request is issued internally which will then save the current state of the settings cache to the disk in the background. This behavior allows you to read and write settings asynchronously and *much* faster than you would if you were interacting directly with the file system.

By default, these save requests are debounced by 100ms. This means that once a change is made to the settings object, electron-settings will wait one-tenth of a second before saving to the disk. This ensures that save requests will not queue unnecessarily and that we are not reading and writing more than we need to.

Interacting with a local copy of the settings object instead of the file system means that not only will your app run faster but you can also read and write settings *synchronously*!

**Just be sure to check that the app can quit safely before quitting** – otherwise data waiting to be saved may be lost.



Quick Start
-----------

```js
const settings = require('electron-settings');

settings.set('user', {
  firstName: 'Art',
  lastName: 'Vandelay'
});

settings.get('user.lastName');
// => "Vandelay"
```


Quitting Safely
---------------

Part of what makes electron-settings fast is its caching layer and lazy interaction with the file system, but as a result special precautions need to be taken to ensure that data is not corrupted or lost if the app quits in the middle of a save or before a queued save request has been fulfilled.

When the app will quit, ensure that it can in fact quit safely by using the `canQuitSafely` method and the `'can-quit-safely'` event handler.

```js
// When the app is about to quit, check that we can quit
// the app safely without losing any data. If we cannot,
// prevent the app from quitting, wait for the next
// "can-quit-safely" event, then quit the app.
app.on('will-quit', event => {
  if (!settings.canQuitSafely()) {
    event.preventDefault();

    settings.once('can-quit-safely', () => {
      app.quit();
    });
  }
});
```

Documentation
-------------
* [Events][docs_events]
* [Methods][docs_methods]


Contributors
-------
* [Nathan Buchar] (Owner)
* [Kai Eichinger](mailto:kai.eichinger@outlook.com)
* *You?*


License
-------
ISC


***

<small>:two_hearts:</small>



[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[docs_events]: ./docs/events.md
[docs_methods]: ./docs/methods.md

[event_save]: #event-save
[event_change]: #event-change
[event_error]: #event-error
[event_canQuitSafely]: #event-can-quit-safely

[method_has]: #has
[method_get]: #get
[method_set]: #set
[method_unset]: #unset
[method_clear]: #clear
[method_defaults]: #defaults
[method_canQuitSafely]: #canquitsafely
[method_getPathToConfigFile]: #getpathtoconfigfile
