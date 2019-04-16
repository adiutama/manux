const path = require('path')
const fs = require('fs')
const yaml = require('yaml')
const dir = require('xdg-basedir')
const { flow, isObject } = require('lodash')
const { version, name } = require('../package.json')

/**
 * Config class
 */
class Config {
  /**
   * @param {Object} option
   * @param {string} option.name
   * @param {string} option.version
   * @param {string} option.configDir
   */
  constructor({ name, version, baseDir, source }) {
    /**
     * @type {string}
     */
    this.baseDir = path.resolve(baseDir, name)

    /**
     * @type {string}
     */
    this.source = path.join(this.baseDir, source)

    /**
     * @type {Object}
     */
    this.data = {
      name,
      version,
      projectDir: `~/${name}`,
    }
  }

  /**
   * Set value to current config
   *
   * @param {string|object} key
   * @param {*} [value]
   */
  set(key, value) {
    let data = {}

    if (isObject(key)) {
      data = key
    } else {
      data[key] = value
    }

    Object.assign(this.data, data)
  }

  /**
   * Get current data
   *
   * @param {string} [key]
   * @return {*}
   */
  get(key) {
    if (key) {
      return this.data[key]
    } else {
      return Object.assign({}, this.data)
    }
  }

  /**
   * Load configuration from file
   */
  load() {
    const parse = flow([
      src => fs.readFileSync(src, 'utf8'),
      str => yaml.parse(str),
    ])

    try {
      fs.accessSync(this.source)

      this.set(
        parse(this.source)
      )
    } catch(e) { }

    return this
  }
}

/**
 * @type {Config}
 */
let instance

/**
 * Get class instance
 *
 * @param {Object} opt
 * @return {Config}
 */
Config.getInstance = opt => {
  if (!instance) {
    instance = new Config({
      version,
      name,
      baseDir: dir.config,
      source: 'config.yml',
    })

    instance.load()
  }

  return instance
}

module.exports = Config
