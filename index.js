$(function () {
  let socket;
  let intervalId;
  var records = {};
  const editStatusName = "(edited)";
  let action;
  let currentMsgs = {};

  $('#sub').click(() => {
    sub();
  });

  $("#me").keyup(function (ev) {
    if (ev.which === 13 && !!$("#me").val()) {
      sub();
    }
  });

  $("#to").keyup(function (ev) {
    if (ev.which === 13 && !!$("#to").val()) {
      let to = $('#to').val();
      editNameInputAera(to);
      $('#msg').focus();
    }
  });

  $("#send").click(function () {
    let id = $.now();
    let to = $('#to').val();
    let msg = $('#msg').val();
    sendMsg(id, to, msg);
  });

  $("#msg").keyup(function (ev) {
    if (ev.which === 13) {
      let id = $.now();
      let to = $('#to').val();
      let msg = $('#msg').val();
      sendMsg(id, to, msg);
    }
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
      alert(me + ", you are online now...");
      let to = $('#to').val();
      editNameInputAera(to);
      $('#msg').focus();
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
          dispMsg(from, id, `
          <div id=message${id}>
            <span id=name${id}><- ${from}: </span>
            <span id=message-content>${msg}</span>
          </div>
          `);
          let to = from;
          bindEditNameArea(to, id);
        }
      }
      else if (action === 'delete') {
        $(`#${id}`).remove();
        records[id] = null;
      }
    });
  }

  function dispSubmsg(msg) {
    let to = msg.replace(/[\s]has[\s]subscribed/, '');
    $('#messages').append($(`<li id=Submsg${to}>`).text(msg));
    let messageBody = document.querySelector('#messages');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
    bindSubmsg(to);
  }

  function bindSubmsg(to) {
    $(`#Submsg${to}`).click(function () {
      editNameInputAera(to);
    });
  }

  function sendMsg(id, to, msg) {
    action = 'display';
    msg = $('#msg').val();
    socket.emit('chat', to, id, msg, action);
    if (!!records[id]) {
      editMsg(to, id, msg);
    } else {
      dispMsg(to, id, `
    <div id="message${id}" class="message-wrapper">
      <span id="name${id}">-> ${to}: </span>
      <span id="content${id}" class="content">${msg}</span>
    </div>
    <div id="button${id}" class="button-wrapper">
      <div id="del${id}" class="delButton">
        <input type="button" value="delete">
      </div>
    </div>
    `);
      bindEditNameArea(to, id);
      bindEditContentArea(to, id);
      bindDeleteButton(to, id);
      $("#to").prop("readonly", false);
      editNameInputAera(to);
    }
    return false;
  }

  function dispMsg(to, id, msg) {
    $('#messages').append(`<li id = ${id}  class="message" name = ${to}>${msg}`);
    $(`#${id}`).append(`
    <div id="editMask${id}" name="${to}" class="row">
        <input id="msg${id}" class="msg" autocomplete="off" />
        <button id="send${id}" class="send" name="${id}" >Send</button>
        <button id="cancel${id}" class="cancel" name="${id}">Cancel</button>
      </div>
    `);
    $(`#editMask${id}`).css('display', 'none');
    bindEditContentSendButton(to, id);
    bindEditContentCancelButton(id);
    records[id] = id;
    currentMsgs[id] = $(`#content${id}`).text();
    let messageBody = document.querySelector('#messages');
    messageBody.scrollTop = messageBody.scrollHeight - messageBody.clientHeight;
  }

  function editMsg(to, id, msg) {
    $(`#name${id}`).html(`-> ${to}: `);
    $(`#content${id}`).html(`${msg}${editStatusName}`);
    currentMsgs[id] = $(`#content${id}`).text();
  }

  function bindEditNameArea(to, id) {
    $(`#name${id}`).click(function () {
      editNameInputAera(to);
    });
  }

  function editNameInputAera(to) {
    $('#to').val(to);
    let from = $('#me').val();
    if (from === "js" && to === "ts") {
      $('#msg').val('I am js, I love ' + to + '!');
    } else if (from === "ts" && to === "js") {
      $('#msg').val('I am ts, I love ' + to + '!');
    } else if (from === to) {
      $('#msg').val('I told to myself now, stupid!');
    } else if (from === "js" && to != "ts") {
      $('#msg').val('I do not love ' + to + ', I only love my ts!');
    } else if (from === "ts" && to != "js") {
      $('#msg').val('I do not love ' + to + ', I only love my js!');
    } else if (from != "ts" || from != "js") {
      $('#msg').val('I am ' + from + ', I am cry......');
    }
  }

  function bindEditContentArea(to, id) {
    $(`#content${id}`).click(function () {
      readyEditContent(id);
    });
    $(`#msg${id}`).keyup(function (ev) {
      if (ev.which === 13) {
        let msg = $(`#msg${id}`).val();
        sendMsg(id, to, msg);
        hideEditMask(id);
      }
    });
  }

  function readyEditContent(id) {
    let text = $(`#content${id}`).text().replace(/\(edited\)$/, '');
    $(`#msg${id}`).val(text);
    $(`li .row`).css('display', 'none');
    $(`.message-wrapper`).css('display', 'inline');
    $(`.button-wrapper`).css('display', 'inline');
    showEditMask(id);
  }

  function bindEditContentSendButton(to, id) {
    $(`#send${id}`).click(function () {
      let msg = $(`#msg${id}`).val();
      sendMsg(id, to, msg);
      hideEditMask(id);
    });
  }

  function bindEditContentCancelButton(id) {
    $(`#cancel${id}`).click(function () {
      cancelEditContent(id);
    });
  }

  function cancelEditContent(id) {
    hideEditMask(id);
    $(`#content${id}`).html(currentMsgs[id]);
  }

  function showEditMask(id) {
    $(`#editMask${id}`).css('display', 'flex');
    $(`#message${id}`).css('display', 'none');
    $(`#button${id}`).css('display', 'none');
  }

  function hideEditMask(id) {
    $(`#editMask${id}`).css('display', 'none');
    $(`#message${id}`).css('display', 'inline');
    $(`#button${id}`).css('display', 'inline');
  }

  function bindDeleteButton(to, id) {
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


