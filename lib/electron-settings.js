/**
 * Electron Settings
 *
 * A powerful user settings manager for Electron. Adapted from Atom's
 * configuration manager, electron-settings allows you to save application
 * settings to a disk so that they can be loaded in the next time your app
 * starts.
 *
 * @version 2.0.0
 * @author Nathan Buchar
 * @copyright 2016 Nathan Buchar <hello@nathanbuchar.com>
 * @license ISC
 */

'use strict';

const debounce = require('debounce');
const debug = require('debug')('electron-settings');
const electron = require('electron');
const events = require('events');
const fs = require('fs-extra');
const helpers = require('key-path-helpers');
const path = require('path');
const util = require('util');

/**
 * Get reference to the Electron app. If the ElectronSettings instance exists
 * outside of the Electron server, we must require it via remote.
 *
 * @see http://electron.atom.io/docs/api/remote/
 * @type Object
 */
const app = electron.app || electron.remote.app;

/**
 * Import EventEmitter.
 *
 * @see https://nodejs.org/api/events.html#events_class_eventemitter
 * @type EventEmitter
 */
const EventEmitter = events.EventEmitter;

/**
 * No operation utility function.
 *
 * @type Function
 */
const noop = function () {};

/**
 * ElectronSettings class definition.
 *
 * @extends events.EventEmitter
 */
class ElectronSettings extends EventEmitter {

  constructor() {
    super();

    /**
     * The internal settings cache.
     *
     * @type Object
     * @default null
     * @private
     */
    this._cache = null;

    /**
     * The save debouncer.
     *
     * @type Function
     * @default null
     * @private
     */
    this._debouncedSave = null;

    /**
     * The full path to the config file that is saved to the disk.
     *
     * @type string
     * @default null
     * @private
     */
    this._pathToSettingsFile = null;

    /**
     * An FSWatcher that watches for changes on the settings file.
     *
     * @type fs.FSWatcher
     * @default null
     * @private
     */
    this._fsWatcher = null;

    /**
     * A boolean indicating whether we are currently saving to disk.
     *
     * @type boolean
     * @default false
     * @private
     */
    this._isSaving = false;

    /**
     * A boolean indicating whether a save request has been issued, but not
     * executed.
     *
     * @type boolean
     * @default false
     * @private
     */
    this._isAwaitingSave = false;

    /**
     * The path to the app's user data folder.
     *
     * @type string
     * @private
     */
    this._pathToUserData = app.getPath('userData');

    /**
     * Internal handler for "save" events.
     *
     * @type Function
     * @private
     */
    this._handleSave = this._onSave.bind(this);

    /**
     * Internal handler for "error" events.
     *
     * @type Function
     * @private
     */
    this._handleError = this._onError.bind(this);

    /**
     * Internal handler for file change events triggered by the FSWatcher
     * instance.
     *
     * @type Function
     * @private
     */
    this._handleFileChange = this._onFileChange.bind(this);

    this._init();
  }

  /**
   * Sets up the ElectronSettings instance.
   *
   * @private
   */
  _init() {
    this._initDeprecations();
    this._initSettingsFilePath();
    this._initSettings();
    this._initMigrations();
    this._initInternalEventBindings();
    this._initSaveDebouncer();
    this._initFSWatcher();
  }

  /**
   * Set up deprecation warnings for deprecated methods and properties.
   *
   * @since 2.0.0
   * @private
   */
  _initDeprecations() {
    this.watch = util.deprecate(noop,
      '"watch" has been deprecated. Key paths watchers ' +
      'are no longer available in v2 and above.'
    );

    this.unwatch = util.deprecate(noop,
      '"unwatch" has been deprecated. Key paths watchers ' +
      'are no longer available in v2 and above.'
    );

    this.getWatchers = util.deprecate(noop,
      '"getWatchers" has been deprecated. Key paths watchers ' +
      'are no longer available in v2 and above.'
    );

    this.clearWatchers = util.deprecate(noop,
      '"clearWatchers" has been deprecated. Key paths watchers ' +
      'are no longer available in v2 and above.'
    );

    this.getConfigFilePath = util.deprecate(this.getPathToSettingsFile,
      '"getConfigFilePath" has been deprecated. Please use ' +
      '"getPathToSettingsFile" instead.'
    );

    this.destroy = util.deprecate(noop,
      '"destroy" has been deprecated.'
    );
  }

  /**
   * Constructs the path to the settings file.
   *
   * @private
   */
  _initSettingsFilePath() {
    this._pathToSettingsFile = path.join(
      this._pathToUserData,
      ElectronSettings.ConfigDir,
      ElectronSettings.ConfigFilename
    );
  }

  /**
   * Ensures that the settings file exists, then sets the internal cache. If
   * the file doesn't already exist it is created with the default settings.
   *
   * @private
   */
  _initSettings() {
    let settings = {};

    try {
      settings = this._readSettingsFileSync();
    } catch (err) {
      this._outputSettingsFileSync(settings);
    } finally {
      this._updateCache(settings);
    }
  }

  /**
   * Automatically migrates to v2 from v1.
   *
   * @private
   */
  _initMigrations() {
    // TODO
  }

  /**
   * Registers internal event handlers for "save" and "error" events.
   *
   * @private
   */
  _initInternalEventBindings() {
    this.on(
      ElectronSettings.Events.SAVE,
      this._handleSave
    );

    this.on(
      ElectronSettings.Events.ERROR,
      this._handleError
    );
  }

  /**
   * Sets up the save debouncer. This ensures that save requests are not
   * overloaded.
   *
   * @private
   */
  _initSaveDebouncer() {
    this._debouncedSave = debounce(
      this._save,
      ElectronSettings.DebounceTime
    );
  }

  /**
   * Creates an FSWatcher to watch the config file for changes. NOTE: The
   * fs.watch API is not 100% consistent across platforms, and is unavailable
   * in some situations.
   *
   * @see https://nodejs.org/api/fs.html#fs_class_fs_fswatcher
   * @private
   */
  _initFSWatcher() {
    this._fsWatcher = fs.watch(
      this._pathToSettingsFile,
      this._handleFileChange
    );
  }

  /**
   * Creates a clone of the given object and updates the internal cache.
   *
   * @param {Object} obj
   * @private
   */
  _updateCache(obj) {
    this._cache = Object.assign({}, obj);
  }

  /**
   * Synchronously reads the contents of the settings file.
   *
   * @returns {Object}
   * @private
   */
  _readSettingsFileSync() {
    return fs.readJsonSync(this._pathToSettingsFile);
  }

  /**
   * Asynchronously creates the settings file at the file path with the
   * provided data, or an empty object.
   *
   * @param {Object} obj
   * @param {Function} fn
   * @private
   */
  _outputSettingsFile(obj, fn) {
    fs.outputJson(this._pathToSettingsFile, obj, fn);
  }

  /**
  * Synchronously creates the settings file at the file path with the
  * provided data, or an empty object.
  *
  * @param {Object} obj
  * @private
  */
  _outputSettingsFileSync(obj) {
    fs.outputJsonSync(this._pathToSettingsFile, obj);
  }

  /**
   * Returns a new Promise that will be resolved the next time the cache is
   * saved to disk. If we don't wish to wish to save the cache at this time,
   * resolve immediately.
   *
   * @param {Object} options
   * @returns {Promise}
   * @private
   */
  _deferredSave(options) {
    const shouldSave = typeof options.shouldSave !== 'undefined' ?
      options.shouldSave :
      ElectronSettings.Defaults.SHOULD_SAVE;

    const saveImmediately = typeof options.saveImmediately !== 'undefined' ?
      options.saveImmediately :
      ElectronSettings.Defaults.SAVE_IMMEDIATELY;

    return new Promise((resolve, reject) => {
      if (shouldSave) {
        this._requestSave(saveImmediately);

        // Watch for the next save event then resolve the promise.
        this.once(ElectronSettings.Events.SAVE, resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Requests the ElectronSettings instance to save the internal settings
   * cache to disk. A request is made so that, if immediate save is not desired,
   * the save request can be properly debounced.
   *
   * @param {boolean} [immediate=false]
   * @private
   */
  _requestSave(immediate=false) {
    this._isAwaitingSave = true;

    if (immediate) {
      this._save();
    } else {
      this._debouncedSave();
    }
  }

  /**
   * Clears the save queue then checks that we are not already in the middle
   * of saving, then attempts to save the current contents of cache to the disk
   * at the next process tick. If a save is already in progress, we instead
   * issue a new save request will be issued so as not to attempt to save at
   * the same time, potentially causing IO errors.
   *
   * Waiting until the next process tick ensures that a save request proceeding
   * an immediate save is handled properly.
   *
   * @private
   */
  _save() {
    this._clearSaveRequests();

    if (this._isSaving) {
      this._requestSave();
    } else {
      this._isSaving = true;
      process.nextTick(() => {
        this._outputSettingsFile(this._cache, err => {
          this._isSaving = false;
          this._isAwaitingSave = false;

          if (err) {
            this._emitErrorEvent(err);
          } else {
            this._emitSaveEvent();
          }

          this._emitCanQuitSafelyEvent();
        });
      });
    }
  }

  /**
   * Clears any queued save requests.
   *
   * @private
   */
  _clearSaveRequests() {
    // this._debouncedSave.clear();
  }

  /**
   * Emits the "save" event.
   *
   * @private
   */
  _emitSaveEvent() {
    this.emit(ElectronSettings.Events.SAVE);
  }

  /**
   * Emits the "error" event.
   *
   * @private
   */
  _emitErrorEvent(err) {
    this.emit(ElectronSettings.Events.ERROR, err);
  }

  /**
   * Emits the "change" event.
   *
   * @private
   */
  _emitChangeEvent() {
    this.emit(ElectronSettings.Events.CHANGE);
  }

  /**
   * Emits the "canQuitSafely" event.
   *
   * @private
   */
  _emitCanQuitSafelyEvent() {
    this.emit(ElectronSettings.Events.CAN_QUIT_SAFELY);
  }

  /**
   * Called when the "save" event fires.
   *
   * @private
   */
  _onSave() {
    debug('settings saved successfully');
  }

  /**
   * Called when the "error" event fires.
   *
   * @private
   */
  _onError(err) {
    debug(`failed to save settings: ${err}`);
  }

  /**
   * Called when the config file changes.
   *
   * @see https://nodejs.org/api/fs.html#fs_fs_watch_filename_options_listener
   * @param {string} event - Either "rename" or "change".
   * @param {string} filename
   * @private
   */
  _onFileChange(event, filename) {
    if (event === ElectronSettings.FSWatcherEvents.CHANGE) {
      debug('settings file has been changed');

      // Emit the change event.
      this._emitChangeEvent();
    }
  }

  /**
   * Gets the value at the chosen key path. If the key path is not specified,
   * return the entire settings object.
   *
   * @param {string} keyPath
   * @returns {mixed}
   */
  get(keyPath) {
    if (typeof keyPath === 'undefined') {
      return helpers.getValueAtKeyPath(this._cache, '');
    } else if (helpers.hasKeyPath(keyPath)) {
      return helpers.getValueAtKeyPath(this._cache, keyPath);
    }
  }

  /**
   * Sets the value at the chosen key path, and then attempts to save to disk.
   * If the key path is empty, the value must be an Object, as we are setting
   * the root.
   *
   * @param {string} keyPath
   * @param {mixed} value
   * @param {Object} [options={}]
   * @param {boolean} [options.shouldSave=true]
   * @param {boolean} [options.saveImmediately=false]
   * @returns {Promise}
   */
  set(keyPath, value, options={}) {
    if (typeof keyPath === 'object') {
      value = arguments[0];
      options = arguments[1] || {};

      if (typeof value === 'object') {
        this._updateCache(value);
      } else {
        throw new TypeError(
          `"value" must be an Object. Got "${typeof value}"`
        );
      }
    } else {
      helpers.setValueAtKeyPath(this._cache, keyPath, value);
    }

    return this._deferredSave(options);
  }

  /**
   * Unsets the value at the chosen key path, then attempts to save to disk.
   *
   * @param {string} keyPath
   * @param {Object} [options={}]
   * @param {boolean} [options.shouldSave=true]
   * @param {boolean} [options.saveImmediately=false]
   * @returns {Promise}
   */
  unset(keyPath, options={}) {
    helpers.deleteValueAtKeyPath(this._cache, keyPath);

    return this._deferredSave(options);
  }

  /**
   * Merges the current settings cache with default options. By default, the
   * default options will not overwrite settings that already exist, but this
   * behavior can be changed by setting options.overwrite to true.
   *
   * @param {Object} obj
   * @param {Object} [options={}]
   * @param {boolean} [options.shouldSave=true]
   * @param {boolean} [options.saveImmediately=false]
   * @param {boolean} [options.overwrite=false]
   * @returns {Promise}
   */
  defaults(obj, options={}) {
    const overwrite = typeof options.overwrite !== 'undefined' ?
      options.overwrite :
      ElectronSettings.Defaults.overwrite;

    if (overwrite) {
      return this.set('.', Object.assign({}, this._cache, obj), options);
    } else {
      return this.set('.', Object.assign({}, obj, this._cache), options);
    }
  }

  /**
   * Migrates the v1 user settings file to v2.
   *
   * @param {Object} [v1Options]
   * @param {string} [v1Options.configDirPath]
   * @param {string} [v1Options.configFilePath]
   */
  migrate(v1Options) {
    const opts = Object.assign({}, {
      configDirPath: 'electron-settings',
      configFilePath: 'settings.json'
    }, v1Options);

    // Construct the path to the old v1 settings file.
    const pathToV1Settings = path.join(
      this._pathToUserData,
      opts.configDirPath,
      opts.configFilePath
    );

    // Read the old settings file and parse it as JSON.
    const v1Settings = fs.readJsonSync(pathToV1Settings);

    this._updateCache(v1Settings);
    this._outputSettingsFileSync(this._cache);
  }

  /**
   * Indicates if the chosen key path exists.
   *
   * @param {string} keyPath
   * @returns {boolean}
   */
  has(keyPath) {
    return helpers.hasKeyPath(this._cache, keyPath);
  }

  /**
   * Erases all settings via the "unset" method.
   *
   * @param {Object} [options]
   * @param {boolean} [options.shouldSave=true]
   * @param {boolean} [options.saveImmediately=false]
   * @returns {Promise}
   */
  clear(options) {
    return this.set({}, options);
  }

  /**
   * Determines if we can quit the Electron app safely. Unsafely quitting may
   * interrupt saving to disk and lead to unsaved or corrupted data.
   *
   * @returns {boolean}
   */
  canQuitSafely() {
    return !this._isSaving && !this._isAwaitingSave;
  }

  /**
   * Returns the path to the settings file on the disk.
   *
   * @returns {string}
   */
  getPathToSettingsFile() {
    return this._pathToSettingsFile;
  }

  /**
   * Alias for "removeListener". Why doesn't this exist?
   *
   * @alias events.EventEmitter.removeListener
   */
  off() {
    this.removeListener.apply(this, arguments);
  }
}

/**
 * Default option values.
 *
 * @enum {boolean}
 * @readonly
 */
ElectronSettings.DefaultOptions = {
  SHOULD_SAVE: true,
  SAVE_IMMEDIATELY: false,
  OVERWRITE: false
};

/**
 * Event names dictionary.
 *
 * @enum {string}
 * @readonly
 */
ElectronSettings.Events = {
  SAVE: 'save',
  CHANGE: 'change',
  ERROR: 'error',
  CAN_QUIT_SAFELY: 'can-quit-safely'
};

/**
 * Node FSWatcher event names.
 *
 * @enum {string}
 * @readonly
 */
ElectronSettings.FSWatcherEvents = {
  RENAME: 'rename',
  CHANGE: 'change'
};

/**
 * The directory to store the config file within the app's data folder.
 *
 * @type string
 * @readonly
 */
ElectronSettings.ConfigDir = 'config';

/**
 * The name of the config file.
 *
 * @type string
 * @readonly
 */
ElectronSettings.ConfigFilename = 'settings.json';

/**
 * The time to debounce save requests in ms.
 *
 * @type number
 * @readonly
 */
ElectronSettings.DebounceTime = 100;

/**
 * The ElectronSettings instance.
 *
 * @type ElectronSettings
 */
ElectronSettings.Instance = new ElectronSettings();

module.exports = ElectronSettings.Instance;
