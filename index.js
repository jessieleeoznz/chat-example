$(function () {
  let socket;
  let intervalId;
  var records = {};
  const editStatusName = "(edited)";

  $('form').submit(function () {
    let id = $('#send').attr('name');
    let msg = $('#msg').val();
    if (id === "send") {
      id = $.now();
    }
    sendMsg(id, msg);
    $('#msg').val('');
    $('#send').attr('name', "send");
    return false;
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
      }, 5000);

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
    socket.on('chat', (from, id, msg) => {
      if (!!records[id]) {
        editMsg(id, msg);
      } else {
        dispMsg(from, id, `<span id=message-name ><- ${from}: </span><span id=message-content>${msg}</span>`);
      }

    });
  }

  function sendMsg(id, msg) {
    let to = $('#to').val();
    // socket.editMsgId = id;
    socket.emit('chat', to, id, msg);
    if (!!records[id]) {
      editMsg(id, msg);
    } else {
      dispMsg(to, id, `<span id=message-name >-> ${to}: </span><span id=span${id}>${msg}</span>`);
    }
    bindSingleEditText(to, id)
  }

  function dispSubmsg(msg) {
    $('#messages').append($(`<li>`).text(msg));
    window.scrollTo(0, document.body.scrollHeight);
  }

  function dispMsg(to, id, msg) {
    $('#messages').append(`<li id = ${id} name = ${to}>${msg}`);
    records[id] = id;
    window.scrollTo(0, document.body.scrollHeight);
  }

  function editMsg(id, msg) {
    $(`#${id}`).html(`${msg}${editStatusName}`);
    $('li').removeClass("editing");
  }

  function bindSingleEditText(to, id) {
    $(`#${id}`).click(function () {
      editInputAera(to, id);
    });
  }

  function editInputAera(to, id) {
    if (!!id) {
      $("#to").val(to);
      let msgText = $(`#${id}`).text();
      // let arr = msgText.replace('(edited)', '').split(':');
      // msgText = arr.length > 1 ? arr[1] : arr[0];
      const length = ditStatusName.length;
      msgText = msgText.slice(-length) === editStatusName ? msgText.substring(0, msgText.length - length) : msgText.substring(0);
      $("#msg").val(msgText.trim());
      $('li').removeClass("editing");
      $(`#${id}`).addClass("editing");
      $("#send").attr("name", id);
    }
    return;
  }
});

// function bindAllEditText() {
//   $('li').click(function () {
//     let id = $(this).attr('id');
//     let to = $(this).attr('name');
//     editInputAera(to, id);
//   });
// }

