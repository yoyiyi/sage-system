function StreamModel(url) {
  this.url = url
  this.$container = $('.stream')
  this.$items = $('.stream-items')
  this.ajaxMark = null
  this.emptyStreamMsg = (url === '/stream/i' ? '没有信息哦，快去关注几个人吧' : '这里没有信息')
}

function stream_setup() {
  setupForwardDialog()
  stream_setupListeners()
  btnLike_init()

  $('.stream .newfeed').click(funcLookNewer())
  var lookEarlier = funcLookEarlier()
  $('.stream .oldfeed').click(lookEarlier)
  if ($('.stream .oldfeed').length > 0) {
    $(window).scroll(function () {
      var scrollTop = $(window).scrollTop()
      var winHeight = $(window).height()
      var docuHeight = $(document).height()
      if (scrollTop + winHeight >= docuHeight) {
        lookEarlier()
      }
    })
  }
}

function getStream(url) {
  window.streamModel = new StreamModel(url)
  $('.stream-items').tipover('获取中···', 3000)
  return $.get(url)
    .done(function (resp) {
      var $items = resp ? $(resp) : $()
      if ($items.length > 0) {
        $('.stream-items').empty().append($items)
        $items.find('.tag-label').tooltip()
        humanTime_show()
        $('.stream-items').tipover('获取了' + $('.stream-items .tweet').length + '条信息')
      } else {
        $('.stream-items').tipover(window.streamModel.emptyStreamMsg)
      }
    })
    .fail(function (resp) {
      $('.stream-items').tipover(errorMsg(resp));
    })
}

function funcLookNewer(ignoreEmpty) {
  return function() {
    var largest = null
    $('.stream-items .tweet').each(function () {
      if (shouldSkipThisTweet($(this))) {
        return // skip it
      }
      var id = parseInt($(this).attr('tweet-id'))
      if (id && (largest == null || id > largest)) {
        largest = id
      }
    })
    console.info("largest " + largest)

    var ajaxMark = new Object
    window.streamModel.ajaxMark = ajaxMark
    if (!largest) {
      return
    }
    $.get(window.streamModel.url, {after: largest}).done(function (resp) {
      if (ajaxMark == window.streamModel.ajaxMark) {
        var $items = resp ? $(resp) : $()
        if ($items.length > 0) {
          $('.stream-items').prepend($items)
          $items.find('.tag-label').tooltip()
        } else if (!ignoreEmpty) {
          $('.stream .newfeed').tipover('还没有新的')
        }
        humanTime_show()
      }
    }).fail(function (resp) {
      $('.stream .newfeed').tipover(errorMsg(resp))
    })
  }
}

function funcLookEarlier(ignoreEmpty) {
  return function() {
    var smallest = null
    $('.stream-items .tweet').each(function () {
      if (shouldSkipThisTweet($(this))) {
        return // skip it
      }
      var id = parseInt($(this).attr('tweet-id'))
      if (id && (smallest == null || id < smallest)) {
        smallest = id
      }
    })
    console.info("smallest " + smallest)

    var ajaxMark = new Object
    window.streamModel.ajaxMark = ajaxMark
    if (!smallest) {
      return
    }
    $.get(window.streamModel.url, {before: smallest}).done(function (resp) {
      if (ajaxMark == window.streamModel.ajaxMark) {
        var $items = resp ? $(resp) : $()
        if ($items.length > 0) {
          $('.stream-items').append($items)
          $items.find('.tag-label').tooltip()
        } else if (!ignoreEmpty) {
          $('.stream .oldfeed').tipover('没有更早的了')
        }
        humanTime_show()
      }
    }).fail(function (resp) {
      $('.stream .oldfeed').tipover(errorMsg(resp))
    })
  }
}

function shouldSkipThisTweet($tweet) {
  return $tweet.hasClass('t-origin') && $tweet.parents('.stream-item').data('contains-origin') === false
}

function setupForwardDialog() {
  var $dia = $('#forward-dialog')
  $dia.find('.modal-title').text('转发')
  $dia.on('show.bs.modal', function(){
    var $tweet = $dia.data('tweet')
    var $midForwards = $dia.find('.mid-forwards').empty()
    $tweet.find('.tweet-self-body[data-id='+$tweet.attr('tweet-id')+'] *[mf-id]').clone().appendTo($midForwards).show()
    $midForwards.children().each(function(){
      $(this).append('<a class="mf-x" href="javascript:;">&times;</a>')
    }).find('a[uid]').removeAttr('href')
    $dia.find('.modal-body .input').val('')
  })
}

function stream_setupListeners() {
  var $doc = $(document)
  $doc.delegate('a[uid]', 'mouseenter', launchUcOpener).delegate('a[uid]', 'mouseleave', launchUcCloser)
  
  $doc.delegate('.tweet-ops .forward-btn', 'click', function() {
    var $tweet = $(this).parents('.tweet').warnEmpty()
    $('#forward-dialog').data('tweet', $tweet).modal({backdrop: false})
  })
  $doc.delegate('.tweet-ops .comment-btn', 'click', toggleTweetComments)
  
  var $deleteDialog = $('#delete-dialog')
  $deleteDialog.on('show.bs.modal', function (event) {
    var $modal = $(this)
    var $delBtn = $(event.relatedTarget)
    var $tweet = $delBtn.parents('.tweet').warnEmpty()
    var id = $tweet.attr('tweet-id')
    $modal.find('.modal-body').html($tweet.html())
    var $sureBtn = $modal.find('.sure-btn')
    $sureBtn.data('url', '/tweets/'+id+'/delete')
    $sureBtn.data('selector', '.tweet[tweet-id='+id+']')
  })
  $deleteDialog.find('.sure-btn').click(function (event) {
    var $btn = $(event.target)
    $.post($btn.data('url')).done(function () {
      $($btn.data('selector')).remove()
    }).fail(function (resp) {
      console.error(errorMsg(resp))
    })
    $deleteDialog.modal('hide')
  })

  $('#forward-dialog').delegate('.mf-x', 'click', function() {
    $(this).parents('*[mf-id]').addClass('mf-removed')
  })
  $('#forward-dialog').find('.sure-btn').click(function() {
    var $dialog = $('#forward-dialog')
    $.post('/post/forward', {
      content: $dialog.find('.input').val(),
      originId: $dialog.data('tweet').attr('tweet-id'),
      removedIds: $dialog.find('.mf-removed').map(function() {
        return $(this).attr('mf-id')
      }).get()
    }).done(funcLookNewer('/stream/i'))
    $dialog.modal('hide')
  })

  $doc.delegate('.tweet-content .view-img', 'click', function(){
    $(this).toggleClass('view-img-large')
  })
}
