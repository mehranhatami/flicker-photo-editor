require(["photo-editor", "flicker-api"], function (getPhotoEditor, getFlickerApi) {
    
     var flickerApi = getFlickerApi();

    var trim = function trim(str){
        return String(str).replace(/^\s+|\s+$/g, '');
    };

    var format = function format() {
        var s = arguments[0];
        for (var i = 0; i < arguments.length - 1; i++) {
            var reg = new RegExp("\\{" + i + "\\}", "gm");
            s = s.replace(reg, arguments[i + 1]);
        }
        return s;
    };

    var submitButton = document.getElementById("submitButton");
    submitButton.addEventListener("click", function () {
        var searchBox = document.getElementById("searchBox");
        if (trim(searchBox.value)) {
            flickerApi.search(searchBox.value, function (photos) {

                var thumbnails = document.getElementById("thumbnails"),
                    thumbnailTemplate = document.getElementById("thumbnailTemplate"),
                    template = thumbnailTemplate.innerHTML,
                    i = 0,
                    l = photos.photo.length,
                    row = null;

                for (; i < l; i++) {
                    var photo = photos.photo[i],
                        imgUrl = flickerApi.getFlickerImageUrl(photo),
                        thumb = document.createElement("div");

                    if (!row || (i > 2 && !(i % 3))) {
                        row = document.createElement("div");
                        row.className = "row";
                        thumbnails.appendChild(row);
                    }
                    thumb.setAttribute("class", "col-sm-6 col-md-4");
                    row.appendChild(thumb);

                    thumb.innerHTML = format(template, photo.title, photo.title);
                    $(thumb).find("img").attr("src", imgUrl);

                    $(thumb).find("button[role=button]").click((function (imgUrl) {
                        return function () {

                            var img = $(this).closest(".thumbnail").find("img")[0];

                            getPhotoEditor({
                                url: imgUrl,
                                width: img.clientWidth,
                                height: img.clientHeight
                            });

                            $('#details').modal("show");
                        }
                    })(imgUrl));
                }
            });
        }
    });
});
