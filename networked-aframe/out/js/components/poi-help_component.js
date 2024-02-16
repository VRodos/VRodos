AFRAME.registerComponent('help-chat', {
    init: function () {
        let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
        let chatInput = document.getElementById('chatInput');
        let chatLog = document.getElementById('chat-messages');

        let roomOccupants;
        let connectedEntities = [];

        console.log("NAF.connection.getConnectedClients()");
        console.log(NAF.connection.getConnectedClients());

        this.el.setAttribute("isActive", "false");

        let elem = this.el;

        let entityConnected = false;
        let entitiesCount;

        let currentUsers = 0;
        let syncComplete = false;

        function isEqual(a, b) {
            // check if the lengths are equal
            if (a.length !== b.length) {
                return false;
            }
        
            let map = new Map();
            for (let elem of a) {
                // increment the frequency of each element
                map.set(elem, (map.get(elem) || 0) + 1);
            }
        
            for (let elem of b)
            {
                // if the element is not in the map, the arrays are not equal
                if (!map.has(elem)) {
                    return false;
                }
        
                // decrement the frequency of each element
                map.set(elem, map.get(elem) - 1);
        
                // if the frequency becomes negative, the arrays are not equal
                if (map.get(elem) < 0) {
                    return false;
                }
            }
        
            return true;
        }
                
        // document.body.addEventListener('entityCreated',evt => {
        //     console.log("NAF CONNECTED");
        //     console.log("NAF.connection.getConnectedClients()");
        //     console.log(NAF);
        //     console.log(Object.keys(NAF.connection.entities.entities).length);
        //     console.log(ObjectLength(NAF.connection.entities.entities));
        //     entitiesCount = Object.keys(NAF.connection.entities.entities).length;
        //     entityConnected = true;
        //     currentUsers++;
        //     //document.getElementById('cameraA').setAttribute('player-info', 'connectedUsers', elem.getAttribute("id"));
        //     document.getElementById('cameraA').setAttribute('player-info', 'connectedUsers', currentUsers);
            
        // }, false); 

        document.body.addEventListener('entityCreated',evt => {
            console.log("NAF ENTITY CREATED");
           
            if (!roomOccupants){
                roomOccupants = easyrtc.getRoomOccupantsAsArray('room26996');
            }
            connectedEntities.push(evt.detail.el.firstUpdateData.owner);
            console.log(evt.detail.el.firstUpdateData.owner);
            console.log(isEqual(roomOccupants,connectedEntities));

            if (connectedEntities.indexOf(evt.detail.el.firstUpdateData.owner) < 0){
                connectedEntities.push(evt.detail.el.firstUpdateData.owner);
            }

            if (roomOccupants.indexOf(evt.detail.el.firstUpdateData.owner) < 0){
                roomOccupants.push(evt.detail.el.firstUpdateData.owner);
            }

            if (isEqual(roomOccupants,connectedEntities)){
                let eventSyncComplete = new CustomEvent('chat-selected', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
                syncComplete = true;
            }
            
        }, false); 

        document.body.addEventListener('entityRemoved',evt => {
            console.log("NAF ENTITY REMOVED");
            if (!roomOccupants){
                roomOccupants = easyrtc.getRoomOccupantsAsArray('room26996');
            }
            if (!syncComplete){
                connectedEntities.push(evt.detail.el.firstUpdateData.owner);
                console.log(evt.detail.el.firstUpdateData.owner);
                console.log(isEqual(roomOccupants,connectedEntities));

                if (connectedEntities.indexOf(evt.detail.el.firstUpdateData.owner) > -1){
                    connectedEntities.splice(connectedEntities.indexOf(evt.detail.el.firstUpdateData.owner), 1);
                }

                if (roomOccupants.indexOf(evt.detail.el.firstUpdateData.owner) > -1){
                    roomOccupants.splice(roomOccupants.indexOf(evt.detail.el.firstUpdateData.owner), 1);
                }
    
    
    
                if (isEqual(roomOccupants,connectedEntities)){
                    let eventSyncComplete = new CustomEvent('chat-selected', {"detail": "success"});
                    document.dispatchEvent(eventSyncComplete);
                    syncComplete = true;
                }
            }

            if (isEqual(roomOccupants,connectedEntities)){
                let eventSyncComplete = new CustomEvent('chat-selected', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
                syncComplete = true;
            }
           
            
           
            
        }, false); 

       
        document.body.addEventListener('connected',evt => {
            console.log("NAF CONNECTED");
            console.log(NAF.connection.entities.entities);
            console.log(easyrtc);
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room26996');

            //connectedEntities = Object.keys(NAF.connection.connectedClients);
            connectedEntities.push(NAF.clientId);
            console.log(roomOccupants);
            console.log(connectedEntities);
            console.log(isEqual(roomOccupants,connectedEntities));
            // console.log(evt);

            for (let key in NAF.connection.entities.entities) {
                if (NAF.connection.entities.entities.hasOwnProperty(key)) {
                    if(NAF.connection.entities.entities[key].hasOwnProperty('firstUpdateData')){
                        console.log(key); // 'a'
                        console.log(NAF.connection.entities.entities[key]); // 'hello'
                        connectedEntities.push(NAF.connection.entities.entities[key].firstUpdateData.owner);
                    }
                        
                }
            }  
            //console.log(NAF.connection.entities.entities);
            console.log(Object.keys(NAF.entities).length);
            //console.log(Object.keys(easyrtc.printpeerconns()).length);
            //console.log(Object.keys(NAF.entities.entities).length);
            entitiesCount = Object.keys(NAF.entities).length;
            entityConnected = true;
            currentUsers--;
            //document.getElementById('cameraA').setAttribute('player-info', 'connectedUsers', elem.getAttribute("id"));
            document.getElementById('cameraA').setAttribute('player-info', 'connectedUsers', currentUsers);
            
        }, false); 
        

        if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "1")
            this.el.setAttribute("currentState", "public");
               
        let chatLogPrivateHistory = [];

        function addToAttribute(element, attributeName, subAttributeName, value) {
            element.setAttribute(
                attributeName, subAttributeName, 
                (element.getAttribute(attributeName, subAttributeName) || '') + value);
        }

        function ObjectLength( object ) {
            var length = 0;
            for( var key in object ) {
                if( object.hasOwnProperty(key) ) {
                    ++length;
                }
            }
            return length;
        };
                
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

            console.log(syncComplete);
            console.log(roomOccupants); 
            console.log(connectedEntities); 
           

            // let temp = document.getElementById('cameraA').getAttribute('player-info').fullChatTable;
            // console.log(temp);

            // if (ObjectLength(temp) == 0)
            //     document.getElementById('cameraA').setAttribute('player-info', 'fullChatTable', temp + "test" );
            // else
            //     document.getElementById('cameraA').setAttribute('player-info', 'fullChatTable', temp + "," + "test" );

            // console.log(document.getElementById('cameraA').getAttribute('player-info').fullChatTable);


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

                    //let fullChatTablesList = document.getElementById('cameraA').getAttribute('player-info', 'fullChatTables');
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', elem.getAttribute("id"));

                    // if (chatlist  === 1)
                    //     document.getElementById('cameraA').setAttribute('player-info', 'fullChatTable', elem.getAttribute("id"));
                

                    //document.getElementById('cameraA').setAttribute('player-info', 'fullChatTable', document.getElementById('cameraA').getAttribute('player-info', 'fullChatTable').push(elem.getAttribute("id")));

                    //addToAttribute(document.getElementById('cameraA'), 'player-info', 'fullChatTables', this.el.getAttribute("id"));
                    elem.setAttribute("isActive", "true");
                    document.getElementById('exit-help-btn').style.display = 'inline-block';

                    // let eventChatMembers = new CustomEvent('chat-selected', {"detail": "public"});
                    // document.dispatchEvent(event);

                    // this.el.emit('eventChatMembers', chatlist + 1, false);
                    elem.setAttribute("currentState", "private");

                    startPrivateMessageNode(elem.getAttribute("id"), this.el); 
                    startExitPrivateChatNode(elem.getAttribute("id"), this.el); 
                    
                    
                }else if (chatlist >= 2 && syncComplete){
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Current chat is full. Please try again later ' + "</pre>";
                }else if (!syncComplete) {
                    chatLog.innerHTML += "<pre>" +'<span style=" color: white">•</span> <span style="color: white">' +  ' Chat is loading. Please try again later ' + "</pre>";
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