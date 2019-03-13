$(function () {
  let socket;
  let intervalId;
  var records = {};
  const editStatusName = "(edited)";
  let action;

  $("#send").click(function () {
    let id = $('#send').attr('name');
    let msg = $('#msg').val();
    if (id === "send") {
      id = $.now();
    }
    sendMsg(id, msg);
    $('#msg').val('');
    $('#send').attr('name', 'send');
    return false;
  });

  $("#new").click(function () {
    $('span[name="message-content"]').removeClass('editing');
    $("#to").prop("readonly", false);
    $("#send").attr('name', 'send');
    return false
  });

  $("#me").keyup(function (ev) {
    if (ev.which === 13 && !!$("#me").val()) {
      sub();
    }
  });

  $('#sub').click(() => {
    sub();
  });

  function sub() {
    if (socket) {
      socket.disconnect();
    }
    socket = io("http://localhost:3025");
    if (intervalId) {
      clearInterval(intervalId);
    }
    socket.on('connect', () => {
      console.log('connect', socket);
      intervalId = setInterval(() => {
        socket.emit('ping');
      }, 25000);

      let me = $('#me').val();
      if (me) {
        socket.emit('add', me);
      }
      document.title = me;
    });

    socket.on('sub', msg => {
      dispSubmsg(msg);
    })

    socket.on('pong', latency => {
      console.log('pong', latency);
    })
    socket.on('disconnect', reason => {
      console.log('disconnect', reason);
    });
    socket.on('chat', (from, id, msg, action) => {
      if (action === 'display') {
        if (!!records[id]) {
          $(`#message${id}`).html(`<- ${from}: ${msg}${editStatusName}`);
        } else {
          dispMsg(from, id, `<div id=message${id}><span id=name${id} name=message-name><- ${from}: </span><span id=message-content>${msg}</span></div>`);
          let to = from;
          bindSingleEditTo(to, id);
        }
      }
      else if (action === 'delete') {
        $(`#${id}`).remove();
        records[id] = null;
      }
    });
  }

  function sendMsg(id, msg) {
    let to = $('#to').val();
    action = 'display';
    socket.emit('chat', to, id, msg, action);
    if (!!records[id]) {
      editMsg(to, id, msg);
    } else {
      dispMsg(to, id, `<div id=message${id} class=inline><span id=name${id} name=message-name>-> ${to}: </span><span id=content${id} name=message-content>${msg}</span></div>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp<div id=del${id} class=inline style="display:none"><span id=x>X</span></div>`);
      $(`#${id}`).hover(
        function () {
          $(`#del${id}`).css('display', 'inline');
        }, function () {
          $(`#del${id}`).css('display', 'none');
        }
      );
    }
    bindSingleEditTo(to, id);
    bindSingleEditText(to, id);
    bindSingleDeleteButton(to, id);
    $('span[name="message-content"]').removeClass('editing');
    $("#to").prop("readonly", false);
    return;
  }

  function dispSubmsg(msg) {
    let to = msg.replace(/[\s]has[\s]subscribed/, '');
    $('#messages').append($(`<li id=Submsg${to}>`).text(msg));
    let messageBody = document.querySelector('#messages');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    // window.scrollTo(0, document.body.scrollHeight);
    bindSubmsg(to);
  }

  function dispMsg(to, id, msg) {
    $('#messages').append(`<li id = ${id} name = ${to}>${msg}`);
    records[id] = id;
    let messageBody = document.querySelector('#messages');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    // window.scrollTo(0, document.body.scrollHeight);
  }

  function editMsg(to, id, msg) {
    $(`#name${id}`).html(`-> ${to}: `);
    $(`#content${id}`).html(`${msg}${editStatusName}`);
  }

  function bindSubmsg(to) {
    $(`#Submsg${to}`).click(function () {
      editToAera(to);
    });
  }

  function bindSingleEditTo(to, id) {
    $(`#name${id}`).click(function () {
      editToAera(to);
    });
  }

  function editToAera(to) {
    $('#to').val(to);
    $('#msg').val('');
    $('span[name="message-content"]').removeClass('editing');
    $('#send').attr('name', 'send');
    return;
  }

  function bindSingleEditText(to, id) {
    $(`#content${id}`).click(function () {
      editInputAera(to, id);
    });
  }

  function editInputAera(to, id) {
    if (!!id) {
      $('#to').val(to);
      $("#to").prop("readonly", true);
      let msgText = $(`#message${id}`).text().replace(/\(edited\)$/, '');
      // let arr = msgText.replace('(edited)', '').split(':');
      // msgText = arr.length > 1 ? arr[1] : arr[0];
      // const length = editStatusName.length;
      // msgText = msgText.slice(-length) === editStatusName ? msgText.substring(0, msgText.length - length) : msgText.substring(0);
      let editedMsg = msgText.replace(/^[\-][>]\s\w*[\:][\s]/, '');
      $('#msg').val(editedMsg);
      $('span[name="message-content"]').removeClass('editing');
      $(`#content${id}`).addClass('editing');
      $('#send').attr('name', id);
    }
    return;
  }

  function bindSingleDeleteButton(to, id) {
    $(`#del${id}`).click(function () {
      deleteMsg(to, id);
    });
  }

  function deleteMsg(to, id) {
    if (!!id) {
      $(`#${id}`).remove();
      records[id] = null;
      action = 'delete';
      msg = '';
      socket.emit('chat', to, id, msg, action);
    }
    return;
  }

});


