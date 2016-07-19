[Electron Settings] » **Methods**

***

Methods
=======

* [`has()`][method_has]
* [`get()`][method_get]
* [`set()`][method_set]
* [`unset()`][method_unset]
* [`clear()`][method_clear]
* [`watch()`][method_watch]
* [`unwatch()`][method_unwatch]
* [`getConfigFilePath()`][method_getconfigfilepath]



***


has()
-----

**`settings.has(keyPath):bool`**

Checks if the key path exists within the settings object. Will return `true` if it exists, or `false` if it doesn't. Pretty simple :thumbsup:

**Arguments**

  * **`keyPath`** *String* - The path to the key that we wish to check exists within the settings object.

**Examples**

```json
{
  "foo": {
    "bar": "baz"
  }
}
```

Check if `"foo.bar"` exists.
```js
settings.has('foo.bar');
// => true
```

Check if `"grizzknuckle"` exists.
```js
settings.has('grizzknuckle');
// => false
```


***


get()
-----

**`settings.get([keyPath]):any`**

Returns the value of the key at the chosen key path. If no key path is provided, this will instead return a copy of the entire settings cache.

**Arguments**

  * **`keyPath`** *String* (optional) - The path to the key that we wish to get the value of.

**Examples**

```json
{
  "foo": {
    "bar": "baz"
  }
}
```

Get all settings.
```js
settings.get();
// => { foo: { bar: 'baz' } }
```

Get the value at `"foo.bar"`.
```js
settings.get('foo.bar');
// => 'baz'
```

Get the value at `"grizzknuckle"`.
```js
settings.get('grizzknuckle');
// => undefined
```

***


set()
-----

**`settings.set([keyPath, ]value)`**

Sets the value of the key at the chosen key path. If no key path is provided, this will set the value of the entire settings object instead, but `value` must be an object.

**Arguments**

  * **`keyPath`** *String* (optional) - The path to the key whose value we wish to set. This key need not already exist.
  * **`value`** *Any* - The value to set the key and the chosen key path to.

**Examples**

```json
{}
```

Set the `'user.name'` key path to an object.
```js
settings.set('user.name', {
  first: 'Cosmo',
  last: 'Kramer'
});

settings.get('user.name.first');
// => 'Cosmo'
```

Set the value of the entire settings object.
```js
settings.set({
  annyong: {
    annyong: 'annyong'
  }
});

settings.get();
// => { annyong: { annyong: 'annyong' } }
```


***


clear()
-------

`settings.clear()`

Clears the entire settings object. Careful :raised_hands:

**Example**

```json
{
  "foo": {
    "bar": "baz"
  }
}
```

Clear all settings.
```js
settings.get();
// => { foo: { bar: 'baz' } }

settings.clear();

settings.get();
// => {}
```


***


unset()
-------

`settings.unset(keyPath)`

Deletes the key and value at the chosen key path. Note that unsetting a key path does not set it's value to `null` – it removes both the value *and* the key.

**Arguments**

  * **`keyPath`** *String* - The path to the key we wish to unset.

**Example**

```json
{
  "foo": {
    "bar": "baz"
  }
}
```

Delete `"foo.bar"`.
```js
settings.unset('foo.bar');

settings.get('foo');
// => { foo: {} }
```


***


watch()
-------

**`settings.watch(keyPath, handler)`**

Watches a key path and calls the handler function when it is changed. You may user [minimatch][external_package_minimatch] to watch dynamic key paths, like `"foo.*"`.

**Arguments**

  * **`keyPath`** *String* - The key path or pattern to watch we wish to watch.
  * **`handler`** *Function* - The function to call when the observed key path has changed. Returns:
    * `event` *String* - The type of change that has occured. Either `"create"`, `"change"`, or `"delete"`
    * `keyPath` *String* - The key path that was changed.
    * `newValue` *Any* - The new value of this setting, if applicable.

**Examples**

```json
  {
    "foo": "bar"
  }
```

Watches a key path and calls the handler function when it is changed.
```js
settings.watch('foo', (event, keyPath, newValue) => {
  console.log(newValue); // => 'baz'
});

settings.set('foo', 'baz');
```

Watches a dynamic key path. In this example, we are watching any key path that ends with `".bar"`or `".baz"`.
```js
settings.watch('*.+(bar|baz)', (event, keyPath, newValue) => {
  console.log(newValue);
});

settings.set('foo.bar', 'baz'); // watched
settings.set('baz.bar', 'qux'); // watched
settings.set('qux.baz', 'zap'); // watched
settings.set('zap.qux', 'norf'); // not watched
```


***


unwatch()
---------

**`settings.unwatch(keyPath[, handler])`**

Unwatches a key path. Note: the key path or pattern *must be the same* as that chosen when you set up the watcher otherwise it will not unbind. For example, if you watch `"foo.bar.*"`, you must unwatch with `"foo.bar.*"`.

**Arguments**

  * **`keyPath`** *String* - The key path or pattern to unwatch.
  * **`handler`** *Function* (optional) - The function to call when the observed key path has changed. If not provided, all key path watchers matching the given key path are removed.


***


getConfigFilePath()
-------------------

**`settings.getConfigFilePath():string`**

Returns the path to the config file. Typically found in your application's user data directory.

**Example**

```js
settings.getConfigFilePath();
// => /Users/Tobias-Funke/Library/Application Support/
```

***


<small>Last updated Jul. 18th, 2016, by [Nathan Buchar]</small>



[Electron Settings]: /

[Nathan Buchar]: (mailto:hello@nathanbuchar.com)

[method_has]: #has
[method_get]: #get
[method_set]: #set
[method_unset]: #unset
[method_clear]: #clear
[method_watch]: #watch
[method_unwatch]: #unwatch
[method_getconfigfilepath]: #getconfigfilepath

[external_package_minimatch]: https://npmjs.org/package/minimatch
