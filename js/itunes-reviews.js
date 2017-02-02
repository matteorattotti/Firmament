var JsonHttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
                var data = JSON.parse(anHttpRequest.responseText);
                aCallback(data);
            }
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
};

var XMLHttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
                var data = anHttpRequest.responseText;

                var parseXml;
                if (typeof window.DOMParser != "undefined") {
                    parseXml = function(xmlStr) {
                        return ( new window.DOMParser() ).parseFromString(xmlStr, "text/xml");
                    };
                } else if (typeof window.ActiveXObject != "undefined" &&
                        new window.ActiveXObject("Microsoft.XMLDOM")) {
                    parseXml = function(xmlStr) {
                        var xmlDoc = new window.ActiveXObject("Microsoft.XMLDOM");
                        xmlDoc.async = "false";
                        xmlDoc.loadXML(xmlStr);
                        return xmlDoc;
                    };
                } else {
                    throw new Error("No XML parser found");
                }

                var xml = parseXml(data);
                aCallback(xml);

            }
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
};

function makeid()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

var sendJsonpRequest = function (url, callback) {
    if (!(url && callback)) { return; }

    // create script element
    var script = document.createElement("script"),
        jsonpCallback = "jsonp_" + makeid(),
        done = false;

    url = url.replace(/\&$/, "") + "&callback=" + jsonpCallback;

    window[jsonpCallback] = function (args) {
        callback(args);

        // Garbage collect
        window[jsonpCallback] = undefined;
        try { delete window[jsonpCallback]; } catch (e) { }
        if (document.head) { document.head.removeChild(script); }
    };

    script.src = url;
    document.head.appendChild(script);
};



var iTunesReviews = function () {


    this.getAppReviewsJSON = function (app, country, success) {
        var url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + app + '/sortBy=mostRecent/json';


        console.log(url);

        var aClient = new JsonHttpClient();
        aClient.get(url, function(response) {
            console.log(response);
            var entry = response['feed']['entry'];
            var links = response['feed']['link'];

            var reviews = new Array();

            if (entry && links) {
                for (var i = 1; i < entry.length ;i++) {
                    var rawReview = entry[i];
                    if ('content' in rawReview) {	
                        try
                        {		
                            var comment = {};
                            comment['id'] = rawReview['id']['label'];
                            comment['app'] = app;
                            comment['author'] = rawReview['author']['name']['label'];
                            comment['version'] = rawReview['im:version']['label'];
                            comment['rating'] = rawReview['im:rating']['label'];
                            comment['title'] = rawReview['title']['label'];
                            comment['comment'] = rawReview['content']['label'];
                            comment['vote'] = rawReview['im:voteCount']['label'];
                            comment['country'] = country;

                            reviews.push(comment);
                        }
                        catch (err) 
                        {
                            console.log(err);
                        }
                    }
                }
            }

            success(reviews);
        });            
    };

    this.getAppReviewsXML = function (app, country, success) {
        var url = 'https://itunes.apple.com/' + country + '/rss/customerreviews/id=' + app + '/sortBy=mostRecent/xml';

        console.log(url);

        var aClient = new XMLHttpClient();
        aClient.get(url, function(response) {

            var reviews = new Array();

            var entries = response.documentElement.getElementsByTagName("entry");
            var i;
            
            // Skipping the first item as it's not a review
            for (i = 1; i < entries.length; i++) {
                var entry = entries[i];

                var review = {};

                var date = new Date(entry.getElementsByTagName("updated")[0].textContent);
                var author = entry.getElementsByTagName("author")[0];

                review['updated'] = date.toDateString();
                review['id'] = entry.getElementsByTagName("id")[0].textContent;
                review['title'] = entry.getElementsByTagName("title")[0].textContent;
                review['comment'] = entry.getElementsByTagName("content")[0].textContent;
                review['rating'] = entry.getElementsByTagName("rating")[0].textContent;
                review['author'] = author.getElementsByTagName("name")[0].textContent;

                reviews.push(review);
            }

            success(reviews);

        });
    };            

    this.getAppInfo = function(appID, country, success) {
    
        var url = 'https://itunes.apple.com/lookup?country=' + country + '&id=' + appID + '&entity=software';
        
        console.log(url);

        sendJsonpRequest(url, function(response) {
            var resultCount = response['resultCount'];
            if(resultCount > 0) {
                var appData = response['results'][0];
                success(appData);
            }

        });

    };

    this.getAppRank = function(appID, store, rank_category, rank_genre, success) {

        // Building feed url
        var feed_url = "https://itunes.apple.com/" + store + "/rss/" + rank_category +"/limit=200/";

        // Adding eventual category
        if (!isNaN(rank_genre)) {
            feed_url = feed_url + "genre=" + rank_genre + "/";
        }

        // We want json format
        feed_url = feed_url + "json";

        console.log(feed_url);
        
        var aClient = new JsonHttpClient();
        aClient.get(feed_url, function(response) {

            var app_entry = response['feed']['entry'];
            var app_rank = null;

            for (var entry in app_entry ) {
                var app_name = app_entry[entry]['im:name']['label'];
                var app_id = app_entry[entry]['id']['attributes']['im:id'];
                if(app_id == appID) {
                    app_rank = entry;
                    // console.log(entry + " " + app_name); 
                    break;
                }
            }

            success(app_rank);
        });        
    };    

}
