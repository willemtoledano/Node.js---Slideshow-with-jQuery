
$(function() {
  // 1-2- Get all templates together and compile with .each()
  var templates = {};
  // 3.2- we want to request to the server the photos just once since they are part of the gallery
  var photos_json;

  // 1- Grab templates
  // 2- Compile templates
  $("script[type='text/x-handlebars']").each(function() {
    var $tmpl = $(this);
    templates[$tmpl.attr("id")] = Handlebars.compile($tmpl.html());
  });

  // 5- EXTRA: Declare Partials
  $("[data-type=partial]").each(function() {
    var $partial = $(this);
    Handlebars.registerPartial($partial.attr("id"), $partial.html());
  });

  // 3- Define data object
  $.ajax({
    url: "/photos",
    success: function(json) {
      photos_json = json;

      // 4- Pass data to the template
      renderPhotos();
      renderPhotoInformation(0); //only 0 wehn loading the page
      // Slides JS
      slideshow.init();
      // 3- Define data object && 4- Pass data to the template - for comments
      getCommentsFor(photos_json[0].id);
    }
  });

  function renderPhotos() {
    $("#slides").html(templates.photos({ photos: photos_json}));
  }
  function renderPhotoInformation(idx) {
    $("#photo_info_container").html(templates.photo_information(photos_json[idx]));
  }
  function getCommentsFor(idx) {
    $.ajax({
      // url: "/comments?photo_id=" + idx,
      url: "/comments",
      data: "photo_id=" + idx,
      success: function(comm_json) {
        // 4- Pass data to the template
        $("#comments_container ul").html(templates.comment({ comment: comm_json})); //NOT USING PARTIALS
        // $("#comments_container ul").html(templates.comments({ comments: comm_json	})); //USING PARTIALS
      }
    })
  }

  // EVENT NEXT/PREV CLICK -------------------------------------------
  var slideshow = {
    $el: $("#slideshow"),
    duration: 500,
    prevSlide: function(e) {
      e.preventDefault();
      var $current = this.$el.find("figure:visible"),
          $prev = $current.prev("figure");

      if (!$prev.length) {
        $prev = this.$el.find("figure").last();
      }
      $current.fadeOut(this.duration);
      $prev.delay(this.duration).fadeIn(this.duration);
      this.renderPhotoContent($prev.attr("data-id"));
    },
    nextSlide: function(e) {
      e.preventDefault();
      var $current = this.$el.find("figure:visible"),
          $next = $current.next("figure");

      if (!$next.length) {
        $next = this.$el.find("figure").first();
      }
      $current.fadeOut(this.duration);
      $next.delay(this.duration).fadeIn(this.duration);
      this.renderPhotoContent($next.attr("data-id"));
    },
    renderPhotoContent: function(idx) {
      $("[name=photo_id]").val(idx);
      renderPhotoInformation(idx - 1);
      getCommentsFor(idx)
    },
    bind: function() {
      this.$el.find("a.prev").on("click", $.proxy(this.prevSlide, this));
      this.$el.find("a.next").on("click", $.proxy(this.nextSlide, this));
    },
    init: function() {
      this.bind();
    }
  };

  /// PHOTO INFORMATION BUTTONS: Like and Favorite
  $("#photo_info_container").on("click", ".actions a", function(e) {
    e.preventDefault();
    var $e = $(e.target),
        $param = getTheActionInParamValue($e);

    $.ajax({
      url: $e.attr("href"),
      type: "post",
      data: "photo_id=" + $e.attr("data-id"),
      success: function(json) {
        if ($e.attr("param") === "like") {
          $e.html("<span class='glyphicon glyphicon-heart'></span>" + " " + json.total + " " + "likes")
        } else if ($e.attr("param") === "favorite") {
          $e.html("<span class='glyphicon glyphicon-star-empty'></span>" + " " + json.total + " " + "favorites")
        }
      }
    });
  });

  function getTheActionInParamValue(element) {
    //not working inside $.ajax !!
    return element.attr("param");
  }

  // ADDING NEW COMMENTS
  $("form").on("submit", function(e) {
    e.preventDefault();
    var $f = $(this);

    $.ajax({
      url: $f.attr("action"),
      type: $f.attr("method"),
      data: $f.serialize(),
      success: function(json) {
        $("#comments_container ul").append(templates.comment({ comment: json}));
      }
    });
  });

});
