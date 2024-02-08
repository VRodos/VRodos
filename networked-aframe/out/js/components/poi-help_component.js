AFRAME.registerComponent('help-chat', {
    init: function () {
        let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
        let chatInput = document.getElementById('chatInput');
        let chatLog = document.getElementById('chat-messages');

        console.log(this.el.getAttribute("title"));

        const onPrivateMessageStepIndex = function sendPrivateMessage(chat_id, element){
            {
                return function executeOnEvent (event) {
                    let player_object = document.getElementById('cameraA').getAttribute('player-info', 'name');
                    let dateString = getChatCurrentTimeString();
                    chatLog.innerHTML += '<span>' + dateString + ' Me: [Private Chat \'' + element.getAttribute("title") + '\'] ' + chatInput.value + '</span><br>';
                    NAF.connection.broadcastData(chat_id, {txt: chatInput.value, player: player_object })
                }
            }            
        };
        const onExitPrivateChatStepIndex = function exitPrivateChat(chat_id, element){
            {
                return function actualOnStepIndex (event) {     
                    NAF.connection.unsubscribeToDataChannel(chat_id);

                    stopPrivateMessageNode(chat_id);
                    sendMsgChatBtn.addEventListener("click",sendPublicMessage);

                    document.getElementById('exit-help-btn').style.display = 'none';
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', '');

                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Exiting Private Chat ' + "</pre>";

                    stopExitPrivateChatNode(chat_id); 

                    if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "0")
                        document.getElementById("chat-wrapper-el").style.visibility = 'hidden'; 
                }
            }  
        };
        const startPrivateMessageNode = (stepIndex, element) => {
            sendMsgChatBtn.addEventListener("click", privateMessageHandlers[stepIndex] = onPrivateMessageStepIndex(stepIndex, element), true);
        };      
        const stopPrivateMessageNode = (stepIndex) => {
            sendMsgChatBtn.removeEventListener("click", privateMessageHandlers[stepIndex], true);
        };
        const privateMessageHandlers = [];
        const exitPrivateChatHandlers = [];
        const startExitPrivateChatNode = (stepIndex, element) => {
            document.getElementById('exit-help-btn').addEventListener("click", exitPrivateChatHandlers[stepIndex] = onExitPrivateChatStepIndex(stepIndex, element), true);
        };          
        const stopExitPrivateChatNode = (stepIndex) => {
            document.getElementById('exit-help-btn').removeEventListener("click", exitPrivateChatHandlers[stepIndex], true);
        };
       
        this.el.addEventListener("click", evt => {
            if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "0")
                document.getElementById("chat-wrapper-el").style.visibility = 'visible';
                

            if (document.getElementById('cameraA').getAttribute('player-info').currentPrivateChat){
                chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' You are already in a private chat ' + "</pre>";
            }else{
                let elem = this.el; 
                
                sendMsgChatBtn.removeEventListener("click",sendPublicMessage);

                NAF.connection.unsubscribeToDataChannel("chat" );

                let  chatlist = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== elem.getAttribute("id")}).length;

                chatLog.innerHTML +="<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connecting to private chat ' + "</pre>" ;

                if (chatlist < 2){
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected. Press X to leave ' + "</pre>";
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', this.el.getAttribute("id"));
                    document.getElementById('exit-help-btn').style.display = 'inline-block';

                    startPrivateMessageNode(this.el.getAttribute("id"), this.el); 
                    startExitPrivateChatNode(this.el.getAttribute("id"), this.el); 
                    
                    
                }else{
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Current chat is full. Please try again later ' + "</pre>";
                }
                

                NAF.connection.subscribeToDataChannel(this.el.getAttribute("id"), (senderId, dataType, data, targetId) => {
                    let dateString = getChatCurrentTimeString();
                    chatLog.innerHTML += '<span style=" color: ' + data.player.color + '">•</span> <span style="color: white">' + dateString + ' [Private Chat \'' + this.el.getAttribute("title") + '\'] ' + data.player.name + ": " + data.txt + '</span><br>';
                } );

            }
        });
    }
});