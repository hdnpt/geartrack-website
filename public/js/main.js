/*
 |--------------------------------------------------------------------------
 | Main
 |--------------------------------------------------------------------------
 */

$('body').tooltip({
    selector: '[data-toggle="tooltip"]'
});

moment.locale('pt');
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
    return moment(date).tz(timezone).format("DD/MM/YYYY HH:mm")
})

Handlebars.registerHelper('HelperHours', function (date) {
    return moment(date).tz(timezone).format("HH:mm")
})

Handlebars.registerHelper('HelperCapitalize', function (string) {
    let lower = string.toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1);
})

Handlebars.registerHelper('HelperCapitalizeWords', function (string) {
    string = string.toLowerCase()
    return string.replace(/(?:^|\s)\S/g, function (a) {
        return a.toUpperCase();
    });
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
        case 'the item has been delivered successfully':
        case 'entregado. su envío está entregado.':
            return 'delivered';
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
    if (skyinfo.id.indexOf("PQ") != -1) {
        return options.fn(this)
    } else {
        return options.inverse(this)
    }
})