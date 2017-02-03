function dashboard() {
    var urlParameters = getUrlParameters();
    var review_grabber = new iTunesReviews();
    var appID = urlParameters['appID'];
    
    var appStore = urlParameters['store']; 
    if(!appStore) { appStore = "us"; }

    // Grabbing and rendeting data
    review_grabber.getAppInfo(appID, appStore, function(appInfo) {

        var appID = appInfo['trackId'];

        // App info
        renderAppInfo(appID, appInfo);

        // Ratings
        renderRatings(appID, appInfo);

        // Accent color
        grabAndSetAccentColor(appID);

        // Reviews
        grabReviews(appID, appStore, appInfo);

        // Ranks
        grabRanks(appID, appStore, appInfo);

    });
}


function renderAppInfo(appID, appInfo) {
    var app_template = document.getElementById("apps-template").innerHTML;
    var app_rendered = Mustache.render(app_template, appInfo);
    var app_target = document.getElementById("apps").innerHTML += app_rendered;
}


function grabReviews(appID, appStore, appInfo) {
    var review_grabber = new iTunesReviews();    
    review_grabber.getAppReviewsXML(appID, appStore, function(reviews) {

        var reviews_template = document.getElementById("app-reviews-template").innerHTML;
        var rating_template = document.getElementById("rating-template").innerHTML;

        var reviews_rendered = Mustache.render(reviews_template, 
                                               {'reviews': reviews, 'reviews-count':appInfo['userRatingCount']}, 
                                               {'rating_template':rating_template});
        var reviews_target = document.getElementById(appID).getElementsByClassName("app-reviews")[0].innerHTML += reviews_rendered;


        [].forEach.call( document.querySelectorAll('.review-title-text'), function(el) {
            el.addEventListener('click', function(e) {
                this.parentElement.nextElementSibling.nextElementSibling.classList.toggle("short");
            }, false);
        }); 

    });

};


function grabAndSetAccentColor(appID) {
    var iconImg = document.getElementById(appID + "-icon");
    iconImg.addEventListener('load', function() {
        var vibrant = new Vibrant(iconImg);
        var swatches = vibrant.swatches();

        var style = document.createElement("style");
        style.appendChild(document.createTextNode(""));
        document.head.appendChild(style);
        var sheet = style.sheet;
        sheet.insertRule(".app-rating polygon { fill:" + swatches["Vibrant"].getHex() + ";}", sheet.cssRules.length);
    });
};


function grabRanks(appID, appStore, appInfo) {

    var categoryName = appInfo["primaryGenreName"];
    var categoryID = appInfo["primaryGenreId"];

    var topFree = "topfreeapplications";
    var topGrossing = "topgrossingapplications";

    if(appInfo["kind"] == "mac-software") {
        topFree = "topfreemacapps";
        topGrossing = "topgrossingmacapps";
    }

    if(appInfo["price"] == 0) {
        renderRank(appID, appStore, topFree, "", "", "Top Free");
    }

    renderRank(appID, appStore, topGrossing, "", "", "Top Grossing");

    // Category
    //renderRank(appID, appStore, topGrossing, categoryName, categoryID, "Top Grossing");
    //renderRank(appID, appStore, topFree, categoryName, categoryID, "Top Free");
}


function renderRank(appID, appStore, category, rankCategoryName, rankCategoryID, rankLabel) {
    var review_grabber = new iTunesReviews();
    review_grabber.getAppRank(appID, appStore, category, rankCategoryID, function(appRank) {
        if(appRank != null) {
            var rank_template = document.getElementById("app-rank-template").innerHTML;
            var rank_rendered = Mustache.render(rank_template, {'rank-label':rankLabel, 'rank-category':rankCategoryName, 'rank-value':appRank});
            var rank_target = document.getElementById(appID).getElementsByClassName("info-blocks")[0].innerHTML += rank_rendered;
        }
    });
}


function renderRatings(appID, appInfo) {
    if(appInfo['averageUserRating']) {
        renderRating(appID, appInfo['averageUserRating'], 'All time (' + appInfo['userRatingCount'] +')');
    }
    
    if(appInfo['averageUserRatingForCurrentVersion']) {
        renderRating(appID, 
                     appInfo['averageUserRatingForCurrentVersion'], 
                    'Current (' + appInfo['userRatingCountForCurrentVersion'] +')');
    }                            
}


function renderRating(appID, rating, label) {
    var rating_template = document.getElementById("rating-template").innerHTML;
    var app_rating_template = document.getElementById("app-rating-template").innerHTML;
    var app_rating_rendered = Mustache.render(app_rating_template, 
            {'rating':rating, 'label':label}, 
            {'rating_template':rating_template});
    document.getElementById(appID).getElementsByClassName("info-blocks")[0].innerHTML += app_rating_rendered;
}
