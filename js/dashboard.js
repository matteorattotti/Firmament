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


        // Making clamped rewview clickable to expand the full text
        makeReviewTextClickable();


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

function makeReviewTextClickable(e) {
    [].forEach.call( document.querySelectorAll('.review-comment.short'), function(el) {

        var needClickToExpand = !isFullTextDisplayed(el);
        if(needClickToExpand) {

            el.style.setProperty("cursor", "pointer");
            el.addEventListener('click', function(e) {
                this.classList.toggle("short");
            });
        }
    }); 
}

function isFullTextDisplayed(e) {
    var eLineClamp = Number.parseInt(window.getComputedStyle(e).getPropertyValue("-webkit-line-clamp"));
    if (isNaN(eLineClamp)) {
        console.warn("Error - the element has no -webkit-line-clamp set");
        return false;
    }
    var clonedElement = e.cloneNode(true);
    clonedElement.style.setProperty("-webkit-line-clamp", eLineClamp + 1);
    clonedElement.style.setProperty("opacity", 0);
    clonedElement.style.maxHeight = "none";
    e.parentNode.appendChild(clonedElement);
    var isFullTextDisplayed = (e.clientHeight == clonedElement.clientHeight);
    e.parentNode.removeChild(clonedElement);

    return isFullTextDisplayed;
};

