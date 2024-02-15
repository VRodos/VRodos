AFRAME.registerComponent('help-chat', {
    init: function () {
        let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
        let chatInput = document.getElementById('chatInput');
        let chatLog = document.getElementById('chat-messages');

        this.el.setAttribute("isActive", "false");

        if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "1")
            this.el.setAttribute("currentState", "public");
               
        let chatLogPrivateHistory = [];
                
        const onPrivateMessageStepIndex = function sendPrivateMessage(chat_id, element){
            {
                return function executeOnEvent (event) {
                    let player_object = document.getElementById('cameraA').getAttribute('player-info', 'name');
                    let dateString = getChatCurrentTimeString();
                    chatLog.innerHTML += '<pre>' + dateString + ' Me: [Private Chat \'' + element.getAttribute("title") + '\'] ' + chatInput.value + '</pre><br>';
                    chatLogPrivateHistory.push(dateString + ' Me: [Private Chat \'' + element.getAttribute("title") + '\'] ' + chatInput.value);
                    NAF.connection.broadcastData(chat_id, {txt: chatInput.value, player: player_object })
                }
            }            
        };
        const onExitPrivateChatStepIndex = function exitPrivateChat(chat_id, element){
            {
                return function actualOnStepIndex (event) {     
                    NAF.connection.unsubscribeToDataChannel(chat_id);

                    stopPrivateMessageNode(chat_id);
                    
                    document.getElementById('exit-help-btn').style.display = 'none';
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', '');
                    element.setAttribute("isActive", "false");

                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Exiting Private Chat ' + "</pre>";

                    stopExitPrivateChatNode(chat_id); 

                    if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "0")
                        document.getElementById("chat-wrapper-el").style.visibility = 'hidden';
                    else{
                        chatLog.innerHTML = "";
                        chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected to public chat ' + "</pre>";
                        publicChatIsActive = true;
                        chatLogPublicHistory.forEach((element)=> chatLog.innerHTML += "<pre>" + element + "</pre>");
                        sendMsgChatBtn.addEventListener("click",sendPublicMessage);
                        document.getElementById("public-chat-button").classList.add('mdc-tab--active');
                        document.getElementById("private-chat-button").classList.remove('mdc-tab--active');
                    } 
                }
            }  
        };
        const startPrivateMessageNode = (stepIndex, element) => {
            NAF.connection.subscribeToDataChannel(element.getAttribute("id"), (senderId, dataType, data, targetId) => {
                let dateString = getChatCurrentTimeString();
                if (element.getAttribute("currentState") == "private")
                    chatLog.innerHTML += "<pre>" + '<span style=" color: ' + data.player.color + '">•</span> <span style="color: white">' + dateString + ' [Private Chat \'' + element.getAttribute("title") + '\'] ' + data.player.name + ": " + data.txt + '</span> </pre> <br>';
                chatLogPrivateHistory.push(dateString + ' [Private Chat \'' + element.getAttribute("title") + '\'] ' + data.player.name + ": " + data.txt);
            } );

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
            document.getElementById("private-chat-button").style.visibility = 'hidden';
            chatLogPrivateHistory = [];
        };

        document.addEventListener("chat-selected", (evt) =>{
            if (this.el.getAttribute("isActive") == "true"){
                 if (this.el.getAttribute("currentState") == evt.detail){
                }
                else{
                    this.el.setAttribute("currentState", evt.detail)
                    chatLogUpdate(evt.detail, this.el.getAttribute("id"), this.el);
                }
            }         
        });
              
        this.el.addEventListener("click", evt => {

            document.getElementById("chat-wrapper-el").style.visibility = 'visible';           
            document.getElementById("public-chat-button").classList.remove('mdc-tab--active');
            document.getElementById("public-chat-button").disabled = false;
            document.getElementById("private-chat-button").style.visibility = 'visible';
            document.getElementById("private-chat-button").classList.add('mdc-tab--active');

            publicChatIsActive = false;
            
            if (document.getElementById('cameraA').getAttribute('player-info').currentPrivateChat){
                chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' You are already in a private chat ' + "</pre>";
            }else{
                let elem = this.el; 
                
                sendMsgChatBtn.removeEventListener("click",sendPublicMessage);
                chatLog.innerHTML = "";

                let  chatlist = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== elem.getAttribute("id")}).length;

                chatLog.innerHTML +="<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connecting to private chat \'' + elem.getAttribute("title") + '\'' +"</pre>" ;

                if (chatlist < 2){
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected. Press X to leave ' + "</pre>";
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', this.el.getAttribute("id"));
                    this.el.setAttribute("isActive", "true");
                    document.getElementById('exit-help-btn').style.display = 'inline-block';

                    this.el.setAttribute("currentState", "private");

                    startPrivateMessageNode(this.el.getAttribute("id"), this.el); 
                    startExitPrivateChatNode(this.el.getAttribute("id"), this.el); 
                    
                    
                }else{
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Current chat is full. Please try again later ' + "</pre>";
                }                             
            }
        });

        function chatLogUpdate(currenChatState, chat_id, element){
            switch (currenChatState){
                case "public":
                    chatLog.innerHTML = "";
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected to public chat ' + "</pre>";
                    publicChatIsActive = true;
                    chatLogPublicHistory.forEach((element)=> chatLog.innerHTML += "<pre>" + element + "</pre>");
                    stopPrivateMessageNode(chat_id);
                    sendMsgChatBtn.addEventListener("click",sendPublicMessage);
                    document.getElementById("public-chat-button").classList.add('mdc-tab--active');
                    document.getElementById("private-chat-button").classList.remove('mdc-tab--active');
                break;
                
                case "private":
                    chatLog.innerHTML = "";
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected to private chat \'' +  element.getAttribute("title") + '\' ' + "</pre>";
                    publicChatIsActive = false;
                    chatLogPrivateHistory.forEach((element)=> chatLog.innerHTML += "<pre>" + element + "</pre>");
                    sendMsgChatBtn.removeEventListener("click",sendPublicMessage);
                    startPrivateMessageNode(chat_id, element); 
                    document.getElementById("private-chat-button").classList.add('mdc-tab--active');
                    document.getElementById("public-chat-button").classList.remove('mdc-tab--active');
                break;
            }
        };

    }
});