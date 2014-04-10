define(function () {

    var FlickrApi = function FlickrApi() {
        this.callback = null;
    };

    FlickrApi.prototype.getSearchAPIUrl = function (tags) {
        return "http" + "://api.flickr.com/services/rest/?format=json&method=flickr.photos.search&per_page=30&tags=" + tags + "&tag_mode=all&api_key=" + apiKey;
    };

    FlickrApi.prototype.getFlickerImageUrl = function (photo) {
        var imageUrl = "http://farm" + photo.farm +
            ".static.flickr.com/" + photo.server + "/" +
            photo.id + "_" + photo.secret + "_" + "m.jpg";
        return imageUrl;
    };

    FlickrApi.prototype.search = function (tags, callback) {
        var url = this.getSearchAPIUrl(tags);
        this.callback = callback;
        getJSONP(url);
    };

    var flickrApi = new FlickrApi();

    window["jsonFlickrApi"] = function jsonFlickrApi(json) {
        if (json.stat != "ok") {
            throw new Error("Flickr API exception [json.stat = " + json.stat + "]");
        }

        if (isFunction(flickrApi.callback)) {
            flickrApi.callback.call(flickrApi, json.photos);
        }

    };

    var apiKey = "968570bdffffd0ec0d12d497dd14c16c",
        secret = "293e753bd009b1db";

    function isFunction(obj) {
        return Object.prototype.toString.call(obj) == "[object Function]";
    }

    function getJSONP(url) {
        var script = document.createElement('script');
        script.src = url + '&callback=jsonFlickrApi';
        document.getElementsByTagName('head')[0].appendChild(script);
    }

    return function () {
        return flickrApi;
    }

});
