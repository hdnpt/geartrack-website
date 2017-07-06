/*
 |--------------------------------------------------------------------------
 | Main
 |--------------------------------------------------------------------------
 */
'use strict'

$('body').tooltip({
  selector: '[data-toggle="tooltip"]'
})

moment.locale('pt')
var timezone = moment.tz.guess()

/*
 |--------------------------------------------------------------------------
 | Handlebars templates
 |--------------------------------------------------------------------------
 */
Handlebars.registerHelper('HelperFromNow', function (date) {
  return moment(date).tz(timezone).fromNow()
})

Handlebars.registerHelper('HelperDate', function (date) {
  return moment(date).tz(timezone).format('DD/MM/YYYY')
})

Handlebars.registerHelper('HelperDateWithHours', function (date) {
  return moment(date).tz(timezone).format('DD/MM/YYYY HH:mm')
})

Handlebars.registerHelper('HelperHours', function (date) {
  return moment(date).tz(timezone).format('HH:mm')
})

Handlebars.registerHelper('HelperCapitalize', function (string) {
  var lower = string.toLowerCase()

  if (lower.charAt(0) == '[') { // cainiao states have [country] message
    lower = lower.replaceAt(1, lower.charAt(1).toUpperCase())
    var idx = lower.indexOf(']') + 2
    lower = lower.replaceAt(idx, lower.charAt(idx).toUpperCase())
  }

  return lower.charAt(0).toUpperCase() + lower.slice(1)
})

Handlebars.registerHelper('HelperCapitalizeWords', function (string) {
  if(string.length == 2) { // uppercase country codes
    return string.toUpperCase()
  }

  string = string.toLowerCase()
  return string.replace(/(?:^|\s)\S/g, function (a) {
    return a.toUpperCase()
  })
})

Handlebars.registerHelper('HelperLowerCase', function (string) {
  return string.toLowerCase()
})

Handlebars.registerHelper('HelperState', function (state, first, insideFirst) {
  switch (state.toLowerCase()) {
    case 'product delivered':
    case 'entregue':
    case 'entregado':
    case 'delivery success':
    case 'order delivered':
    case 'item delivered':
    case 'the item has been delivered successfully':
    case 'entregado. su envío está entregado.':
      return 'delivered'
    default:
      if (typeof insideFirst == 'boolean') {
        if (insideFirst && first)
          return 'new'
      } else {
        if (first)
          return 'new'
      }

      return ''
  }
})

Handlebars.registerHelper('HelperTrackerSkyPQ', function (skyinfo, options) {
  if (skyinfo.id.indexOf('PQ') != -1) { // is PQ
    if (skyinfo.messages.length == 0 && skyinfo.status.length > 0)
      return options.fn(this)

    return options.inverse(this)
  } else {
    return options.fn(this)
  }
})

/*
 |--------------------------------------------------------------------------
 | String utils
 |--------------------------------------------------------------------------
 */
String.prototype.replaceAt = function (index, replacement) {
  return this.substr(0, index) + replacement + this.substr(index + replacement.length)
}
