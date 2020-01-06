const socket = io.connect('https://theelandating.com:31000');

let username = `Stranger_${Date.now()}`;
let inputUsername = $('#username');
let buttonChangeUsername = $('#change-username');
let divMessageHistoryContainer = $('#message-history-container');
let inputMessage = $('#message');
let btnSendMessage = $('#send-message');
let btnCloseConnection = $('close-connection');

inputUsername.val(username);
btnSendMessage.attr('disabled', true);

inputUsername.on('keypress', (e) => {
    if (e.keyCode === 13) {
        buttonChangeUsername.trigger('click');
    }
});

inputMessage.on('keypress', (e) => {
    if (e.keyCode === 13) {
        btnSendMessage.trigger('click');
    }
});

// btnCloseConnection.on('click', () => {
//     io.on('connection', function(socket) {
//         socket.on('end', function() {
//             socket.disconnect();
//         });
//     });
// });

buttonChangeUsername.on('click', () => {
    username = inputUsername.val();

});

btnSendMessage.on('click', () => {
    let message = inputMessage.val();
    if (message.trim().length === 0) {
        alert('Can\'t send empty message.');
        return;
    }
    socket.emit('send_message', {
        message: message,
        sender: {
            socketId: socket.id,
            username: username
        }
    });
    inputMessage.val('');
});

socket.on('wait', (data) => {
    console.log('need to wait.');
    btnSendMessage.attr('disabled', true);
});

socket.on('start_chat', () => {
    btnSendMessage.attr('disabled', false);
});

socket.on('broadcast_message', (data) => {
    let row = $(`
<div class="row">
<div class="col-3">
${data.sender.socketId === socket.id ? 'You' : data.sender.username}&nbsp;:&nbsp;
</div>
<div class="col-9">${data.message}</div>
</div>
</div>
    `);
    divMessageHistoryContainer.append(row);
});
