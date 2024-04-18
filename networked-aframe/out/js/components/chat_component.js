
let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
let chatInput = document.getElementById('chatInput');
let chatLog = document.getElementById('chat-messages');

let publicChatIsActive = true;

let chatLogPublicHistory = [];


function sendPublicMessage() {
    let player_object = document.getElementById('cameraA').getAttribute('player-info', 'name');

    let dateString = getChatCurrentTimeString();
    chatLog.innerHTML += '<span>' + dateString + ' Me: ' + chatInput.value + '</span><br>';
    chatLogPublicHistory.push(dateString + ' Me: ' + chatInput.value);
    NAF.connection.broadcastData("chat", {txt: chatInput.value, player: player_object });
}

NAF.connection.subscribeToDataChannel("chat", (senderId, dataType, data, targetId) => {
    let dateString = getChatCurrentTimeString();
    if (publicChatIsActive)
        chatLog.innerHTML += '<span style=" color: ' + data.player.color + '">•</span> <span style="color: #80c9d4">' + dateString + ' ' + data.player.name + ": " + data.txt + '</span><br>';
    chatLogPublicHistory.push(dateString + ' ' + data.player.name + ": " + data.txt);
} )

sendMsgChatBtn.addEventListener("click",sendPublicMessage);

let chatExpanded = false;
let chatMinimized = false;

document.getElementById('expand-chat-btn').addEventListener("click", function() {
    let chatWrapper = document.getElementById("chat-wrapper-el");
    let messagesWrapper = document.getElementById("chat-messages-wrapper");

    if (chatMinimized) {
        chatExpanded = false;
    }
    else {
        if (chatExpanded) {
            chatWrapper.classList.add("ChatWrapperStyle");
            chatWrapper.classList.remove("ChatWrapperStyleExpanded");
            messagesWrapper.classList.add("ChatMessagesStyleNormal");
            messagesWrapper.classList.remove("ChatMessagesStyleExpanded");
            chatExpanded = false;
        } else {
            chatWrapper.classList.add("ChatWrapperStyleExpanded");
            chatWrapper.classList.remove("ChatWrapperStyle");
            messagesWrapper.classList.add("ChatMessagesStyleExpanded");
            messagesWrapper.classList.remove("ChatMessagesStyleNormal");
            chatExpanded = true;
        }
    }
});

document.getElementById('minimize-chat-btn').addEventListener("click", function() {
    let chatWrapper = document.getElementById("chat-wrapper-el");
    let messagesWrapper = document.getElementById("chat-messages-wrapper");

    chatWrapper.classList.add("ChatWrapperStyle");
    chatWrapper.classList.remove("ChatWrapperStyleExpanded");
    messagesWrapper.classList.remove("ChatMessagesStyleExpanded");

    if (chatMinimized) {
        messagesWrapper.classList.add("ChatMessagesStyleNormal");
        messagesWrapper.classList.remove("ChatMessagesStyleMinimized");
        chatMinimized = false;
    } else {
        messagesWrapper.classList.add("ChatMessagesStyleMinimized");
        messagesWrapper.classList.remove("ChatMessagesStyleNormal");
        chatExpanded = false;
        chatMinimized = true;
    }
});

let getChatCurrentTimeString = () => {
    let date = new Date;
    return '[' + String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0') + ']';
}