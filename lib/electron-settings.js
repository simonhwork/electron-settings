/**
 * Electron Settings
 *
 * A fast and powerful persistent user settings manager for Electron. Adapted
 * from Atom's configuration manager, electron-settings allows you to save
 * application settings to a disk so that they can be loaded in the next time
 * your app starts.
 *
 * @version 2.0.0
 * @author Nathan Buchar
 * @copyright 2016 Nathan Buchar <hello@nathanbuchar.com>
 * @license ISC
 */

'use strict';

const debounce = require('debounce');
const electron = require('electron');
const exists = require('file-exists');
const extend = require('extend');
const events = require('events');
const fs = require('fs-extra');
const helpers = require('key-path-helpers');
const path = require('path');
const minimatch = require('minimatch');
const util = require('util');

/**
 * Obtain a reference to the Electron app. If the ElectronSettings instance is
 * running within the context of a renderer view, we need to import it via
 * remote.
 *
 * @see http://electron.atom.io/docs/api/app
 * @type Object
 */
const app = electron.app || electron.remote.app;

/**
 * The path to the user data directory for the app.
 *
 * @see http://electron.atom.io/docs/api/app/#appgetpathname
 * @type string
 */
const USER_DATA_PATH = app.getPath('userData');

/**
 * Define the root key path.
 *
 * @type string
 */
const ROOT_KEY_PATH = '';

/**
 * Utility function that performs no action.
 *
 * @type Function
 */
const NOOP = function () {};

/**
 * ElectronSettings class definition.
 *
 * @see https://nodejs.org/api/events.html#events_class_eventemitter
 * @extends events.EventEmitter
 */
class ElectronSettings extends events.EventEmitter {

  /**
   * Creates a new ElectronSettings instance.
   *
   * @param {Object} [options={}]
   * @param {boolean} [enablePersistence=true]
   * @param {boolean} [configDirPath=<user data path>/config]
   * @param {boolean} [configFileName=settings.json]
   * @param {boolean} [prettify=false]
   * @param {Object} [defaults]
   */
  constructor(options) {
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
     * The options for this ElectronSettings instance.
     *
     * @type Object
     * @private
     */
    this._options = extend({}, ElectronSettings.Defaults, options);

    /**
     * A map of key paths that are being observed.
     *
     * @type {Map}
     * @private
     */
    this._keyPathObservers = new Map();

    /**
     * A boolean indicating that a save is pending.
     *
     * @type boolean
     * @default false
     * @private
     */
    this._isAwaitingSave = false;

    /**
     * The path to the config file where we will store the settings.
     *
     * @type string
     * @default null
     * @private
     */
    this._pathToConfigFile = null;

    /**
     * A debounced function to request a load.
     *
     * @type Function
     * @default null
     * @private
     */
    this._debouncedLoad = null;

    /**
     * A debounced function to request a save.
     *
     * @type Function
     * @default null
     * @private
     */
    this._debouncedSave = null;

    /**
     * The FSWatcher instance.
     *
     * @type FSWatcher
     * @default null
     * @private
     */
    this._fsWatcher = null;

    /**
     * Invoked when the file is changed, renamed, or deleted.
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
    this._initConfigFilePath();
    this._initSettings();
    this._initSafeQuit();
    this._initLoadDebouncer();
    this._initSaveDebouncer();
  }

  /**
   * Set up deprecation warnings for deprecated or modified methods and
   * properties.
   *
   * @private
   */
  _initDeprecations() {
    this.getWatchers =
      util.deprecate(
        NOOP, '"getWatchers()" has been deprecated.'
      );

    this.clearWatchers =
      util.deprecate(
        NOOP, '"clearWatchers()" has been deprecated.'
      );

    this.clear =
      util.deprecate(
        NOOP, '"clear()" has been deprecated.'
      );

    this.destroy =
      util.deprecate(
        NOOP, '"destroy()" has been deprecated.'
      );
  }

  /**
   * Constructs the path to the config file within the app's data directory.
   *
   * @private
   */
  _initConfigFilePath() {
    const ext = ElectronSettings.ConfigFileExt;
    const configDirPath = this._options.configDirPath;
    const configFileName = this._options.configFileName;
    const configFile = path.basename(configFileName, ext) + ext;

    this._pathToConfigFile = path.join(
      configDirPath,
      configFile
    );
  }

  /**
   * Initialize the internal cache.
   *
   * @private
   */
  _initSettings() {
    this._cache = {};

    // Replace the cache with the contents of the config file if file system
    // access is permissible and the file exists.
    if (this.shouldAccessFileSystem() && this.configFileExists()) {
      this._load();
    } else {
      this._applyDefaults();
      this._save();
    }

    this._observeUserConfig();
  }

  /**
   * Ensures that the app will always quit safely by saving all remaining
   * changes when the app is about to quit.
   *
   * @private
   */
  _initSafeQuit() {
    app.on('quit', evt => {
      if (!this.canQuitSafely()) {
        this._save();
      }
    });
  }

  /**
   * Creates the debounced load function.
   *
   * @private
   */
  _initLoadDebouncer() {
    this._debouncedLoad = debounce(
      this._load,
      ElectronSettings.DebounceTime
    );
  }

  /**
   * Creates the debounced save function.
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
   * Requests that we load the settings file from the disk and cache it.
   *
   * @private
   */
  _requestLoad() {
    if (this.shouldAccessFileSystem()) {
      this._debouncedLoad();
      this._observeUserConfig();
    }
  }

  /**
   * Requests the current contents of the cache be saved to disk.
   *
   * @private
   */
  _requestSave() {
    if (this.shouldAccessFileSystem()) {
      this._isAwaitingSave = true;
      this._debouncedSave();
    }
  }

  /**
   * Loads the contents of the config file, if file system access is
   * permissible.
   *
   * @private
   */
  _load() {
    if (this._isAwaitingSave) return;

    if (this.shouldAccessFileSystem() && this.configFileExists()) {
      this._cache = this._readSettingsFileSync();
    }
  }

  /**
   * Saves the current contents of the cache to the config file.
   *
   * @private
   */
  _save() {
    if (this.shouldAccessFileSystem()) {
      this._outputSettingsFileSync(this._cache);

      this._isAwaitingSave = false;
      this._emitSaveEvent();
    }
  }

  /**
   * Reads the config file, parses it as JSON and returns the contents.
   *
   * @returns {Object?}
   * @private
   */
  _readSettingsFileSync() {
    if (this.shouldAccessFileSystem()) {
      return fs.readJsonSync(this._pathToConfigFile);
    }
  }

  /**
   * Saves the config file with the given obejct as JSON.
   *
   * @param {Object} obj
   * @returns {Object?}
   * @private
   */
  _outputSettingsFileSync(obj) {
    if (this.shouldAccessFileSystem()) {
      return fs.outputJsonSync(this._pathToConfigFile, obj, {
        spaces: this._options.prettify ? 2 : 0
      });
    }
  }

  /**
   * Applies the defaults to the settings cache.
   *
   * @private
   */
  _applyDefaults() {
    this._setValueAtKeyPath(ROOT_KEY_PATH,
      extend(
        {},
        this._cache,
        this._options.defaults
      )
    );
  }

  /**
   * Starts the pathwatcher to watch the config file for changes.
   *
   * @private
   */
  _observeUserConfig() {
    if (this.shouldAccessFileSystem() && !this._fsWatcher) {
      try {
        this._fsWatcher = pathwatcher.watch(
          this._pathToConfigFile,
          this._handleFileChange
        );
      } catch (err) {
        // Could not watch path at this time. Likely doesn't exist yet, or
        // file permissions are wonky. ¯\_(ツ)_/¯
      }
    }
  }

  /**
   * Observes the given chosen key path for changes, and calls the event
   * handler when a change occurs.
   *
   * @param {string} keyPath
   * @param {Function} handler
   */
  _addObserver(keyPath, handler) {
    const handlers = this._keyPathObservers.get(keyPath);

    // Create the key path observer if it does not exist.
    if (!handlers) {
      this._keyPathObservers.set(keyPath, [handler]);
      return;
    }

    handlers.push(handler);
  }

  /**
   * Removes a key path observer handler.
   *
   * @param {string} keyPath
   * @param {Function} [fn]
   * @private
   */
  _removeObserver(keyPath, fn) {
    const handlers = this._keyPathObservers.get(keyPath);

    if (!handlers) {
      return;
    }

    if (!fn) {
      this._keyPathObservers.delete(keyPath);
    } else {
      this._keyPathObservers.set(keyPath,
        handlers.reduce((newHandlers, handler) => {
          if (handler !== fn) {
            newHandlers.push(handler);
          }

          return newHandlers;
        }, [])
      );
    }
  }

  /**
   * Called when the "change" event occurs.
   *
   * @param {string} event - Either 'create', 'change', or 'delete'
   * @param {string} keyPath
   * @param {any} newValue
   * @private
   */
  _notifyObservers(event, keyPath, newValue) {
    this._keyPathObservers.forEach((watchHandlers, watchKeyPath) => {
      if (minimatch(keyPath, watchKeyPath)) {
        watchHandlers.forEach(handler => {
          handler(event, keyPath, newValue);
        });
      }
    });
  }

  /**
   * Indicates whether a value at the chosen key path exists.
   *
   * @param {string} keyPath
   * @returns {boolean}
   * @private
   */
  _hasValueAtKeyPath(keyPath) {
    return helpers.hasKeyPath(this._cache, keyPath);
  }

  /**
   * Gets the value at the chosen key path.
   *
   * @param {string} keyPath
   * @returns {any}
   * @private
   */
  _getValueAtKeyPath(keyPath) {
    if (keyPath === ROOT_KEY_PATH) {
      return extend({}, this._cache);
    } else {
      return helpers.getValueAtKeyPath(this._cache, keyPath);
    }
  }

  /**
   * Sets the value at the chosen key path.
   *
   * @param {string} keyPath
   * @param {any} value
   * @private
   */
  _setValueAtKeyPath(keyPath, value) {
    const hasKeyPath = this.has(keyPath);

    if (keyPath === ROOT_KEY_PATH) {
      this._cache = extend({}, value);
    } else {
      helpers.setValueAtKeyPath(this._cache, keyPath, value);
    }

    this._requestSave();
    this._emitChangeEvent(keyPath);
    this._notifyObservers(
      hasKeyPath ?
        ElectronSettings.ObserverEvents.CHANGE :
        ElectronSettings.ObserverEvents.CREATE,
      keyPath,
      value
    );
  }

  /**
   * Unsets the value at the chosen key path.
   *
   * @param {string} keyPath
   * @private
   */
  _unsetValueAtKeyPath(keyPath) {
    helpers.deleteValueAtKeyPath(this._cache, keyPath);

    this._requestSave();
    this._emitChangeEvent(keyPath);
    this._notifyObservers(
      ElectronSettings.ObserverEvents.DELETE,
      keyPath
    );
  }

  /**
   * Emits the change event.
   *
   * @emits ElectronSettings#change
   * @param {string} keyPath
   * @private
   */
  _emitChangeEvent(keyPath) {
    this.emit(ElectronSettings.Events.CHANGE, keyPath);
  }

  /**
   * Emits the save event.
   *
   * @emits ElectronSettings#save
   * @private
   */
  _emitSaveEvent() {
    this.emit(ElectronSettings.Events.SAVE);
  }

  /**
   * The config file has been changed.
   *
   * @param {string} event - Either "rename", "delete", or "change"
   * @private
   */
  _onFileChange(event) {
    console.log('test2');
    console.log(event);
    if (event === ElectronSettings.PathwatcherEvents.CHANGE) {
      // The file may have been edited from a different source. Load the
      // contents of the config file into memory just to be sure.
      this._requestLoad();
    }
  }

  /**
   * Indicates whether a value at the chosen key path exists.
   *
   * @param {string} keyPath
   * @returns {boolean}
   */
  has(keyPath) {
    return this._hasValueAtKeyPath(keyPath);
  }

  /**
   * Gets the value at the chosen key path.
   *
   * @param {string} [keyPath='']
   */
  get(keyPath) {
    keyPath = keyPath ? keyPath : ROOT_KEY_PATH;

    return this._getValueAtKeyPath(keyPath);
  }

  /**
   * Sets the value at the chosen key path. If a key path is not given, the
   * value must be an Object.
   *
   * @param {string} keyPath
   * @param {any} value
   */
  set(keyPath, value) {
    if (typeof arguments[0] === 'object') {
      this._setValueAtKeyPath(ROOT_KEY_PATH, arguments[0]);
    } else {
      this._setValueAtKeyPath(keyPath, value);
    }
  }

  /**
   * Unsets the value at the chosen key path.
   *
   * @param {string} keyPath
   */
  unset(keyPath) {
    this._unsetValueAtKeyPath(keyPath);
  }

  /**
   * Clears the entire settings cache.
   */
  clear(keyPath) {
    this._unsetValueAtKeyPath(ROOT_KEY_PATH);
  }

  /**
   * Invokes the callback when a setting with the chosen key path pattern is
   * changed.
   *
   * @param {string} keyPath
   * @param {Function} handler
   */
  watch(keyPath, handler) {
    if (typeof handler === 'function') {
      this._addObserver(keyPath, handler);
    }
  }

  /**
   * Removes a key path observer handler from a key path pattern.
   *
   * @param {string} keyPath
   * @param {Function} [handler]
   */
  unwatch(keyPath, handler) {
    this._removeObserver(keyPath, handler);
  }

  /**
   * Returns a boolean indicating whether file system access is permissible.
   *
   * @returns {boolean}
   */
  shouldAccessFileSystem() {
    return this._options.enablePersistence;
  }

  /**
   * Indicates if the app can quit safely without losing data because of any
   * unprocessed save requests.
   *
   * @returns {boolean}
   */
  canQuitSafely() {
    return !this._isAwaitingSave;
  }

  /**
   * Returns a boolean indicating whether the config file exists.
   *
   * @returns {boolean?}
   */
  configFileExists() {
    if (this.shouldAccessFileSystem()) {
      return exists(this._pathToConfigFile);
    }
  }

  /**
   * Gets the path to the config file.
   *
   * @returns {string}
   */
  getConfigFilePath() {
    return this._pathToConfigFile;
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
 * The directory where the config file will be saved to.
 *
 * @type string
 * @readonly
 */
ElectronSettings.ConfigDirPath = path.join(USER_DATA_PATH, 'electron-settings');

/**
 * The name of the config file.
 *
 * @type string
 * @readonly
 */
ElectronSettings.ConfigFileName = 'settings.json';

/**
 * The file extension for the config file.
 *
 * @type string
 * @readonly
 */
ElectronSettings.ConfigFileExt = '.json';

/**
 * Default options for an ElectronSettings instance.
 *
 * @type Object
 * @readonly
 */
ElectronSettings.Defaults = {
  configDirPath: ElectronSettings.ConfigDirPath,
  configFileName: ElectronSettings.ConfigFileName,
  enablePersistence: true,
  prettify: false,
  defaults: {}
};

/**
 * ElectronSettings event names.
 *
 * @enum {string}
 * @readonly
 */
ElectronSettings.Events = {
  CHANGE: 'change',
  SAVE: 'save'
};

/**
 * Observer event types.
 *
 * @enum {string}
 * @readonly
 */
ElectronSettings.ObserverEvents = {
  CREATE: 'create',
  CHANGE: 'change',
  DELETE: 'delete'
};

/**
 * Pathwatcher event names.
 *
 * @enum {string}
 * @readonly
 */
ElectronSettings.PathwatcherEvents = {
  CHANGE: 'change',
  RENAME: 'rename',
  DELETE: 'delete'
};

/**
 * The time in ms to debounce file system interaction.
 *
 * @type number
 * @readonly
 */
ElectronSettings.DebounceTime = 100;

module.exports = ElectronSettings;
