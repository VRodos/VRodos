AFRAME.registerComponent('help-chat', {
    schema: { type: "string", default: "" },
    init: function () {
        let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
        let chatInput = document.getElementById('chatInput');
        let chatLog = document.getElementById('chat-messages');
        let roomOccupants;
        let connectedEntities = [];
        let room_id = this.data;
        this.el.setAttribute("isActive", "false");
        let elem = this.el;
        let currentUsers = 0;
        let syncComplete = false;

        const getUniqueNumbers = (arr1, arr2) => {
            let uniqueOfBoth = arr1.filter((ele) => {
              return arr2.indexOf(ele) !== -1
            })
          
            let uniqueOfList1 = arr1.filter((ele) => {
              return arr2.indexOf(ele) == -1
            })
          
            let uniqueOfList2 = arr2.filter((ele) => {
              return arr1.indexOf(ele) == -1
            })
          
            return uniqueOfList2;
        }

        function ObjectLength( object ) {
            let length = 0;
            for( let key in object ) {
                if( object.hasOwnProperty(key) ) {
                    ++length;
                }
            }
            return length;
        };
        function isEqual(a, b) {
            if (a.length !== b.length) {
                return false;
            }
            let map = new Map();
            for (let elem of a) {
                map.set(elem, (map.get(elem) || 0) + 1);
            }
            for (let elem of b)
            {
                if (!map.has(elem)) {
                    return false;
                }
                map.set(elem, map.get(elem) - 1);
                if (map.get(elem) < 0) {
                    return false;
                }
            }
            return true;
        }

        document.querySelector('a-scene').addEventListener('enter-vr', ()=>{
            elem.classList.remove("raycastable");
        });
        document.querySelector('a-scene').addEventListener('exit-vr', ()=>{
            elem.classList.add("raycastable");
        });
        document.body.addEventListener('entityCreated',evt => {
            if (!roomOccupants){
                roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id);
            }
            connectedEntities.push(evt.detail.el.firstUpdateData.owner);
            if (connectedEntities.indexOf(evt.detail.el.firstUpdateData.owner) < 0){
                connectedEntities.push(evt.detail.el.firstUpdateData.owner);
            }
            if (roomOccupants.indexOf(evt.detail.el.firstUpdateData.owner) < 0){
                roomOccupants.push(evt.detail.el.firstUpdateData.owner);
            }
            if (isEqual(roomOccupants,connectedEntities)){
                let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
                syncComplete = true;
            }
            
        }, false); 
        // document.body.addEventListener('clientConnected',evt => {
        //     console.log('clientConnected');
        //     console.log(evt.detail);
        // }, false);
        document.body.addEventListener('entityRemoved',evt => {
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id);
            let result = getUniqueNumbers(roomOccupants, connectedEntities);
            let i = 0;
            
            while (i < result.length) {
                let index = connectedEntities.indexOf(result[i]);
                if (index > -1) { 
                    connectedEntities.splice(index, 1); 
                }
                i++;
            }
        }, false);
        document.body.addEventListener('clientDisconnected',evt => {
            if (!roomOccupants){
                roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id);
            }
            if (!syncComplete){
                if (connectedEntities.indexOf(evt.detail.clientId) > -1){
                    connectedEntities.splice(connectedEntities.indexOf(evt.detail.clientId), 1);
                    console.log(connectedEntities.indexOf(evt.detail.clientId));
                    
                }
                if (roomOccupants.indexOf(evt.detail.clientId) > -1){
                    roomOccupants.splice(roomOccupants.indexOf(evt.detail.clientId), 1);
                    console.log(connectedEntities.indexOf(evt.detail.clientId));
                }
                if (isEqual(roomOccupants,connectedEntities)){
                    let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                    document.dispatchEvent(eventSyncComplete);
                    syncComplete = true;
                }
            }
            if (isEqual(roomOccupants,connectedEntities)){
                let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
                syncComplete = true;
            }
        }, false);  
        document.body.addEventListener('connected',evt => {
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room' + room_id);
            connectedEntities.push(NAF.clientId);
            if (isEqual(roomOccupants,connectedEntities)){
                let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
                syncComplete = true;
            }
            for (let key in NAF.connection.entities.entities) {
                if (NAF.connection.entities.entities.hasOwnProperty(key)) {
                    if(NAF.connection.entities.entities[key].hasOwnProperty('firstUpdateData')){
                        connectedEntities.push(NAF.connection.entities.entities[key].firstUpdateData.owner);
                    }
                }
            }  
        }, false); 
        
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
        elem.addEventListener("click", evt => {
            document.getElementById("chat-wrapper-el").style.visibility = 'visible';           
            document.getElementById("public-chat-button").classList.remove('mdc-tab--active');
            document.getElementById("public-chat-button").disabled = false;
            document.getElementById("private-chat-button").style.visibility = 'visible';
            document.getElementById("private-chat-button").classList.add('mdc-tab--active');
            publicChatIsActive = false;
            
            if (document.getElementById('cameraA').getAttribute('player-info').currentPrivateChat){
                chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' You are already in a private chat ' + "</pre>";
            }else{
                sendMsgChatBtn.removeEventListener("click",sendPublicMessage);
                chatLog.innerHTML = "";
                let  chatlist = [...document.querySelectorAll('[player-info]')].map((el) => el.components['player-info'].data.currentPrivateChat).filter(function(x){return x== elem.getAttribute("id")}).length;
                chatLog.innerHTML +="<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connecting to private chat \'' + elem.getAttribute("title") + '\'' +"</pre>" ;
               
                if (chatlist < 2 && syncComplete){
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected. Press X to leave ' + "</pre>"; 
                    
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', elem.getAttribute("id"));
                    elem.setAttribute("isActive", "true");
                    document.getElementById('exit-help-btn').style.display = 'inline-block';
                    elem.setAttribute("currentState", "private");

                    startPrivateMessageNode(elem.getAttribute("id"), elem); 
                    startExitPrivateChatNode(elem.getAttribute("id"), elem); 
                                                
                }else if (chatlist >= 2 && syncComplete){
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Current chat is full. Please try again later ' + "</pre>";
                    document.getElementById("private-chat-button").style.visibility = 'hidden';
                    chatLogUpdate("public",elem.getAttribute("id"),elem, "Current chat is full. Returning to public chat");
                    document.getElementById("public-chat-button").disabled = false;
                    
                }else if (!syncComplete) {
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Chat is loading. Please try again later ' + "</pre>";
                    document.getElementById("private-chat-button").style.visibility = 'hidden';
                    chatLogUpdate("public",elem.getAttribute("id"),elem, "Chat is loading. Please try again later");
                }
                                             
            }
        });
              
        function chatLogUpdate(currenChatState, chat_id, element, chatLogMessage = 'Connected to public chat'){
            switch (currenChatState){
                case "public":
                    chatLog.innerHTML = "";
                    chatLog.innerHTML += "<pre>" + '<span style=" color: white">•</span> <span style="color: white">' +  chatLogMessage + "</pre>";
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