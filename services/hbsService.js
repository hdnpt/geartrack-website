const path = require('path')

/**
 * Load all partials and helpers to handlebars
 * Just a configurator for the hbs package
 */
module.exports = function (handlebars) {

  /*
   |--------------------------------------------------------------------------
   | Partials
   |--------------------------------------------------------------------------
   */
  handlebars.registerPartials(path.join(__dirname, '../views/partials'));

  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */
  /**
   * Append content to a named section
   * usage:
   *
   * {{#append 'scripts'}}
   *   <script src="js/script.js"></script>
   * {{/append}}
   *
   */
  handlebars.registerHelper('append', function (name, options) {
    if(!this._sections)
      this._sections = {}

    if(this._sections[name])
      this._sections[name] += options.fn(this) // append if there is already content
    else
      this._sections[name] = options.fn(this) // save the content of the block

    return null
  })

  /**
   * Display the content of the section
   * usage:
   *
   * {{section 'scripts' }}
   */
  handlebars.registerHelper('section', function (name) {
    if(this._sections && this._sections[name])
      return new handlebars.handlebars.SafeString(this._sections[name])

    return null
  })

  /**
   * Current year
   * usage:
   *
   * {{year}}
   */
  handlebars.registerHelper('year', function () {
    return new Date().getFullYear()
  })
}