let publicChatIsActive = true;
let chatLogPublicHistory = [];

let getChatCurrentTimeString = () => {
    let date = new Date;
    return '[' + String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0') + ':' +
        String(date.getSeconds()).padStart(2, '0') + ']';
}

function sendPublicMessage() {
    let chatInput = document.getElementById('chatInput');
    let chatLog = document.getElementById('chat-messages');
    if (!chatInput || !chatLog || !chatInput.value.trim()) return;

    let player_info = document.getElementById('cameraA') ? document.getElementById('cameraA').getAttribute('player-info') : null;

    let dateString = getChatCurrentTimeString();
    chatLog.innerHTML += '<span>' + dateString + ' Me: ' + chatInput.value + '</span><br>';
    chatLogPublicHistory.push(dateString + ' Me: ' + chatInput.value);
    if (typeof NAF !== 'undefined' && NAF.connection) {
        NAF.connection.broadcastData("chat", { txt: chatInput.value, player: player_info });
    }
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'chat_public_msg_dispatched');
    }

    // Clear input after sending
    chatInput.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
    let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
    let chatInput = document.getElementById('chatInput');

    if (sendMsgChatBtn) {
        sendMsgChatBtn.addEventListener("click", sendPublicMessage);
    }

    if (chatInput) {
        chatInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                sendPublicMessage();
            }
        });
    }

    // Wait for NAF connection before subscribing
    const subscribeWhenReady = () => {
        let chatLog = document.getElementById('chat-messages');
        if (NAF.connection) {
            NAF.connection.subscribeToDataChannel("chat", (senderId, dataType, data, targetId) => {
                let dateString = getChatCurrentTimeString();
                if (publicChatIsActive && chatLog) {
                    let playerColor = data.player ? data.player.color : '#80c9d4';
                    let playerName = data.player ? data.player.name : 'Stranger';
                    chatLog.innerHTML += '<span style=" color: ' + playerColor + '">•</span> <span style="color: #80c9d4">' + dateString + ' ' + playerName + ": " + data.txt + '</span><br>';
                }
                chatLogPublicHistory.push(dateString + ' ' + (data.player ? data.player.name : 'Stranger') + ": " + data.txt);
            });
        } else {
            setTimeout(subscribeWhenReady, 100);
        }
    };
    subscribeWhenReady();

    /**
     * Chat Controls (Drawer-style)
     */
    let chatExpanded = false;
    let chatMinimized = false;

    let expandBtn = document.getElementById('expand-chat-btn');
    if (expandBtn) {
        expandBtn.addEventListener("click", function () {
            let chatWrapper = document.getElementById("chat-wrapper-el");
            if (!chatWrapper) return;

            if (chatMinimized) {
                // If minimized, restore to normal first
                chatWrapper.classList.remove("ChatDrawerStyleMinimized");
                chatMinimized = false;
            }

            if (chatExpanded) {
                chatWrapper.classList.remove("ChatDrawerStyleExpanded");
                chatExpanded = false;
            } else {
                chatWrapper.classList.add("ChatDrawerStyleExpanded");
                chatExpanded = true;
            }
        });
    }

    let minimizeBtn = document.getElementById('minimize-chat-btn');
    if (minimizeBtn) {
        minimizeBtn.addEventListener("click", function () {
            let chatWrapper = document.getElementById("chat-wrapper-el");
            if (!chatWrapper) return;

            if (chatMinimized) {
                chatWrapper.classList.remove("ChatDrawerStyleMinimized");
                chatMinimized = false;
            } else {
                chatWrapper.classList.add("ChatDrawerStyleMinimized");
                chatWrapper.classList.remove("ChatDrawerStyleExpanded");
                chatMinimized = true;
                chatExpanded = false;
            }
        });
    }
});


