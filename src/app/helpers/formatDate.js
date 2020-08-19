 let formatDate = function(date = new Date(), locale = "es-GT", options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }){
    // gets date, locale? and options? parameters and returns formatted date
    let dateObject = new Date(date);
    return dateObject.toLocaleString(locale, options)
}

export default formatDate;