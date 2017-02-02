var getUrlParameters = function () {
    var url_parameters = {};
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        // If first entry with this name
        if (typeof url_parameters[pair[0]] === "undefined") {
            url_parameters[pair[0]] = pair[1];
            // If second entry with this name
        } else if (typeof url_parameters[pair[0]] === "string") {
            var arr = [ url_parameters[pair[0]], pair[1] ];
            url_parameters[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            url_parameters[pair[0]].push(pair[1]);
        }
    } 
    return url_parameters;
};
