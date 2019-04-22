const path = require('path')
const fs = require('fs')
const yaml = require('yaml')
const uuid = require('uuid/v1')
const untildify = require('untildify')
const { flow, remove, find } = require('lodash')

const Config = require('../core/config')

/**
 * @type {Config}
 */
const config = Config.getInstance()

class Project {
  /**
   * @params {Object} opts
   * @params {string} opts.source
   * @params {string} opts.storage
   * @params {string} opts.projectDir
   * @params {Object} opts.template
   */
  constructor({ source, storage, projectDir, template }) {
    /**
     * @type {string}
     */
    this.source = path.join(config.baseDir, source)

    /**
     * @type {string}
     */
    this.storage = path.join(config.baseDir, storage)

    /**
     * @type {string}
     */
    this.projectDir = path.resolve(untildify(projectDir))

    /**
     * @type {Object[]}
     */
    this.data = []

    /**
     * @type {Object}
     */
    this.template = template

    // Make sure storage directory is exists
    try {
      fs.accessSync(this.storage)
    } catch(e) {
      fs.mkdirSync(this.storage)
    }
  }

  /**
   * Return all project list
   *
   * @return {Object[]}
   */
  list() {
    return this.data.map(
      item => ({
        location: item.location.replace(`${this.projectDir}/`, ''),
        config: item.config,
      })
    )
  }

  /**
   * Get one project object
   *
   * @param {string} name
   * @return {Object}
   */
  get(name) {
    const location = path.join(this.projectDir, name)

    return find(this.data, { location })
  }

  /**
   * Add new project to the list
   *
   * @param {string} name
   */
  add(name) {
    const id = uuid()
    const location = path.join(this.projectDir, name)
    const config = path.join(this.storage, `${id}.yml`)

    const content = {
      session_name: name,
      start_directory: location,
      windows: this.template,
    }

    this.data.push({ location, config })

    try {
      fs.writeFileSync(
        config,
        yaml.stringify(content)
      )
    } catch(e) { }

    this.save()
  }

  /**
   * Remove project from the list
   *
   * @param {string} name
   */
  rm(name) {
    const { location, config } = this.get(name)

    try {
      fs.unlinkSync(config)
    } catch(e) { }

    remove(this.data, { location })

    this.save()
  }

  /**
   * Make project list persistent
   */
  save() {
    try {
      fs.writeFileSync(
        this.source,
        yaml.stringify(this.data)
      )
    } catch(e) { }
  }

  /**
   * Load data from file
   */
  load() {
    const parse = flow([
      src => fs.readFileSync(src, 'utf8'),
      str => yaml.parse(str),
    ])

    try {
      fs.accessSync(this.source)

      this.data = parse(this.source) || []
    } catch(e) { }
  }
}

/**
 * @type {Project}
 */
let instance

/**
 * Get class instance
 *
 * @param {Object} opt
 * @return {Project}
 */
Project.getInstance = opt => {
  if (!instance) {
    instance = new Project({
      source: 'project.yml',
      storage: 'storage',
      projectDir: config.get('projectDir'),
      template: [
        {
          window_name: 'editor',
          focus: true,
          panes: [
            'e .'
          ],
        },
        {
          window_name: 'shell',
          panes: [
            null
          ]
        }
      ]
    })

    instance.load()
  }

  return instance
}

module.exports = Project
