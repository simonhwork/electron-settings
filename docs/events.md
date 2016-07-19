[Electron Settings] » **Events**

***

Events
=======

* [`save`][event_save]
* [`change`][event_change]


save
----

Emitted when the settings have been saved to disk.


change
------

Emitted when a change has been made to the settings file. Returns the key path that was changed. You might be more inclined to use the [`watch()`](method_watch) method.

**Returns**

  * **`keyPath`** *string*






***

<small>Last updated Jul. 18th, 2016, by [Nathan Buchar]</small>






[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[event_save]: #save
[event_change]: #change

[method_watch]: ./methods.md#watch
