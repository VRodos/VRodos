AFRAME.registerComponent('chat-poi', {
    schema: {
        scene_id: {type: "string", default: "false" },
        num_participants: {type: "string", default: "2" }
    },
    init: function () {
        let sendMsgChatBtn = document.getElementById('send-msg-chat-btn');
        let chatInput = document.getElementById('chatInput');
        let chatLog = document.getElementById('chat-messages');
        let roomOccupants;
        let connectedEntities = [];
        let room_id = this.data.scene_id;
        let maxParticipants = Number(this.data.num_participants);
        this.el.setAttribute("isActive", "false");
        let elem = this.el;
        let currentUsers = 0;
        let syncComplete = false;

        if (maxParticipants ===  -1) {
            maxParticipants = Number.MAX_SAFE_INTEGER;
        } else if (!Number.isFinite(maxParticipants) || maxParticipants < 1) {
            maxParticipants = 2;
        }

        let private_button_label = document.getElementById('private-chat-button-label') || document.getElementById('private-chat-button');
        if (private_button_label) {
            private_button_label.innerHTML = this.el.getAttribute("title") || "Private";
        }

        const setPrivateChatButtonVisibility = function (isVisible) {
            const button = document.getElementById("private-chat-button");
            if (!button) {
                return;
            }

            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.setButtonVisible === 'function') {
                window.VRODOSMasterUI.setButtonVisible(button, isVisible);
            } else {
                button.style.visibility = isVisible ? 'visible' : 'hidden';
            }
        };

        const setChatTabState = function (activeTab) {
            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.applyChatTabs === 'function') {
                return window.VRODOSMasterUI.applyChatTabs(activeTab);
            }

            if (window.VRODOSMasterUI && typeof window.VRODOSMasterUI.setChatTabState === 'function') {
                window.VRODOSMasterUI.setChatTabState(activeTab);
                // Also ensure the active tab is visible if it was hidden
                const activeBtn = document.getElementById(activeTab + "-chat-button");
                if (activeBtn) {
                    activeBtn.classList.remove('tw-hidden');
                }
                return;
            }

            const publicButton = document.getElementById("public-chat-button");
            const privateButton = document.getElementById("private-chat-button");

            if (publicButton) {
                publicButton.classList.toggle('tw-btn-active', activeTab === 'public');
                publicButton.classList.toggle('tw-btn-primary', activeTab === 'public');
                publicButton.classList.toggle('tw-btn-ghost', activeTab !== 'public');
            }

            if (privateButton) {
                privateButton.classList.toggle('tw-btn-active', activeTab === 'private');
                privateButton.classList.toggle('tw-btn-primary', activeTab === 'private');
                privateButton.classList.toggle('tw-btn-ghost', activeTab !== 'private');
                if (activeTab === 'private') {
                    privateButton.classList.remove('tw-hidden');
                }
            }
        };

        const getPlayerInfoData = function (playerEl) {
            if (!playerEl || !playerEl.components || !playerEl.components['player-info']) {
                return null;
            }

            return playerEl.components['player-info'].data || null;
        };

        const getPrivateChatOccupancy = function (chatId) {
            return [...document.querySelectorAll('[player-info]')].filter(function (playerEl) {
                let playerInfo = getPlayerInfoData(playerEl);
                return playerInfo && playerInfo.currentPrivateChat == chatId;
            }).length;
        };

        const isNetworkReady = function () {
            return typeof NAF !== 'undefined' && NAF.connection && typeof NAF.connection.broadcastData === 'function';
        };

        const emitAvailabilityChange = function () {
            let occupancy = getPrivateChatOccupancy(elem.getAttribute("id"));
            let isFull = maxParticipants !== Number.MAX_SAFE_INTEGER && occupancy >= maxParticipants;
            elem.emit('chat-availability-change', isFull ? "full" : "available", false);
            document.dispatchEvent(new CustomEvent('chat-occupancy-changed', {
                detail: {
                    chatId: elem.getAttribute("id"),
                    occupancy: occupancy,
                    maxParticipants: maxParticipants,
                    isFull: isFull
                }
            }));
        };

        const setSelectedPrivateChatLabel = function () {
            let privateButtonLabel = document.getElementById('private-chat-button-label') || document.getElementById('private-chat-button');
            if (privateButtonLabel) {
                privateButtonLabel.innerHTML = elem.getAttribute("title") || "Private";
            }
        };

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
        }

        function isEqual(a, b) {
            if (!a || !b) {
                return false;
            }
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
        document.addEventListener('entityCreated',evt => {
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id) || [];
            if(evt.detail.el.id == "cameraA"){
                console.log("Local User loaded");
                if (connectedEntities.indexOf(NAF.clientId) < 0) {
                    connectedEntities.push(NAF.clientId);
                }
            }
            else{
                let networked = evt.detail.el.getAttribute('networked');
                let ownerId = networked ? networked.owner : null;
                if (ownerId && connectedEntities.indexOf(ownerId) < 0){
                    connectedEntities.push(ownerId);
                }
            }

            if (isEqual(roomOccupants, connectedEntities)){
                console.log("Sync complete via entityCreated");
                syncComplete = true;
                let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
            }
        }, false);

        // Check for existing entities if we joined late
        const checkExistingEntities = () => {
            if (typeof NAF === 'undefined' || !NAF.connection || !NAF.connection.entities) return;
            
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id) || [];
            if (NAF.clientId && connectedEntities.indexOf(NAF.clientId) < 0) {
                connectedEntities.push(NAF.clientId);
            }
            
            for (let id in NAF.connection.entities.entities) {
                let owner = NAF.connection.entities.entities[id].getAttribute('networked').owner;
                if (owner && connectedEntities.indexOf(owner) < 0) {
                    connectedEntities.push(owner);
                }
            }

            if (isEqual(roomOccupants, connectedEntities)) {
                console.log("Sync complete via checkExistingEntities");
                syncComplete = true;
                let eventSyncComplete = new CustomEvent('chat-ready', {"detail": "success"});
                document.dispatchEvent(eventSyncComplete);
            } else {
                setTimeout(checkExistingEntities, 1000);
            }
        };
        setTimeout(checkExistingEntities, 1000);
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
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room'+ room_id) || [];
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
            roomOccupants = easyrtc.getRoomOccupantsAsArray('room' + room_id) || [];
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

        const isPublicChatEnabled = () => document.getElementById("aframe-scene-container")?.getAttribute("scene-settings")?.public_chat == "1";
        
        if(isPublicChatEnabled()) {
            this.el.setAttribute("currentState", "public");
        } else {
            this.el.setAttribute("currentState", "private");
            setChatTabState('private');
        }
        let chatLogPrivateHistory = [];
        const onPrivateMessageStepIndex = function sendPrivateMessage(chat_id, element){
            {
                return function executeOnEvent (event) {
                    let player_object = document.getElementById('cameraA').getAttribute('player-info', 'name');
                    let dateString = getChatCurrentTimeString();
                    chatLog.innerHTML += '<span>' + dateString + ' Me: </span><span>' + chatInput.value + '</span><br>';
                    chatLogPrivateHistory.push(dateString + ' Me: ' + chatInput.value);
                    NAF.connection.broadcastData(chat_id, {txt: chatInput.value, player: player_object })
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'chat_private_msg_dispatched');
                    }
                }
            }
        };
        const onExitPrivateChatStepIndex = function exitPrivateChat(chat_id, element){
            {
                return function actualOnStepIndex (event) {
                    NAF.connection.unsubscribeToDataChannel(chat_id);
                    stopPrivateMessageNode(chat_id);
                    document.getElementById('exit-private-chat-btn').style.display = 'none';
                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', '');
                    element.setAttribute("isActive", "false");
                    element.emit('chat-availability-change', "available", false);
                    document.dispatchEvent(new CustomEvent('chat-occupancy-changed', {
                        detail: {
                            chatId: element.getAttribute("id")
                        }
                    }));
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Exiting Private Chat <br>';
                    stopExitPrivateChatNode(chat_id);

                    if(document.getElementById("aframe-scene-container").getAttribute("scene-settings").public_chat == "0") {
                        document.getElementById("chat-wrapper-el").style.visibility = 'hidden';
                        setChatTabState('private');
                    }
                    else{
                        chatLog.innerHTML = "";
                        chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected to public chat <br>';
                        publicChatIsActive = true;
                        chatLogPublicHistory.forEach((element)=> chatLog.innerHTML += "<span>" + element + "</span>");
                        sendMsgChatBtn.addEventListener("click", sendPublicMessage);
                        setChatTabState('public');
                    }
                }
            }
        };
        const startPrivateMessageNode = (stepIndex, element) => {
            NAF.connection.subscribeToDataChannel(element.getAttribute("id"), (senderId, dataType, data, targetId) => {
                let dateString = getChatCurrentTimeString();
                if (element.getAttribute("currentState") == "private")
                    chatLog.innerHTML += '<span style=" color: ' + data.player.color + '">•</span> <span style="color: white">' + dateString + ' ' + data.player.name + ": </span><span>" + data.txt + '</span> <br>';
                chatLogPrivateHistory.push(dateString + ' ' + data.player.name + ": " + data.txt);
            } );
            sendMsgChatBtn.addEventListener("click", privateMessageHandlers[stepIndex] = onPrivateMessageStepIndex(stepIndex, element), true);
        };
        const stopPrivateMessageNode = (stepIndex) => {
            sendMsgChatBtn.removeEventListener("click", privateMessageHandlers[stepIndex], true);
        };
        const privateMessageHandlers = [];
        const exitPrivateChatHandlers = [];
        const startExitPrivateChatNode = (stepIndex, element) => {
            document.getElementById('exit-private-chat-btn').addEventListener("click", exitPrivateChatHandlers[stepIndex] = onExitPrivateChatStepIndex(stepIndex, element), true);
        };
        const stopExitPrivateChatNode = (stepIndex) => {
            document.getElementById('exit-private-chat-btn').removeEventListener("click", exitPrivateChatHandlers[stepIndex], true);
            setPrivateChatButtonVisibility(false);
            chatLogPrivateHistory = [];
        };
        document.addEventListener("chat-selected", (evt) =>{
            if (this.el.getAttribute("isActive") == "true"){
                if (this.el.getAttribute("currentState") == evt.detail){
                }
                else{
                    if (evt.detail === 'public' && !isPublicChatEnabled()) {
                        console.warn("Public chat is disabled for this scene.");
                        return;
                    }
                    this.el.setAttribute("currentState", evt.detail)
                    setChatTabState(evt.detail);
                }
                chatLogUpdate(evt.detail, this.el.getAttribute("id"), this.el);
            }
        });
        elem.addEventListener("click", evt => {
            console.log("Chat POI Clicked", elem.id);
            if (evt.detail && evt.detail.originalEvent && evt.detail.originalEvent.button !== undefined) {
                if (evt.detail.originalEvent.button !== 0) return;
            }
            console.log("Opening chat wrapper");
            const wrapper = document.getElementById("chat-wrapper-el");
            if (!wrapper) {
                return;
            }
            setSelectedPrivateChatLabel();
            wrapper.style.visibility = 'visible';
            wrapper.style.display = 'flex'; // Ensure it's not display:none
            wrapper.classList.remove('tw-hidden');
            console.log("Wrapper style after changes:", wrapper.style.visibility, wrapper.style.display, wrapper.classList.contains('tw-hidden'));
            setChatTabState('private');
            const publicChatButton = document.getElementById("public-chat-button");
            if (publicChatButton) {
                publicChatButton.disabled = !isPublicChatEnabled();
            }
            setPrivateChatButtonVisibility(true);
            publicChatIsActive = false;

            if (typeof window.gtag === 'function') {
                window.gtag('event', 'chat_initiation');
            }

            if (document.getElementById('cameraA').getAttribute('player-info').currentPrivateChat){
                // Silence already in chat message as requested
            }else{
                sendMsgChatBtn.removeEventListener("click",sendPublicMessage);
                chatLog.innerHTML = "";
                let chatlist = getPrivateChatOccupancy(elem.getAttribute("id"));
                chatLog.innerHTML +='<span style=" color: white">•</span> <span style="color: white">' +  ' Connecting to private chat \'' + elem.getAttribute("title") + '\'' +"</span><br>" ;

                if (!isNetworkReady()) {
                    chatLog.innerHTML += '<span style=" color: white">&bull;</span> <span style="color: white">' +  ' Chat is still synchronizing. Please wait a moment and click again... ' + "</span><br>";
                } else if (chatlist < maxParticipants){
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected. Press X to leave ' + "</span><br>";
                    if (typeof window.gtag === 'function') {
                        window.gtag('event', 'chat_join');
                    }

                    document.getElementById('cameraA').setAttribute('player-info', 'currentPrivateChat', elem.getAttribute("id"));
                    emitAvailabilityChange();
                    elem.setAttribute("isActive", "true");
                    document.getElementById('exit-private-chat-btn').style.display = 'inline-block';
                    elem.setAttribute("currentState", "private");

                    startPrivateMessageNode(elem.getAttribute("id"), elem);
                    startExitPrivateChatNode(elem.getAttribute("id"), elem);
                    setChatTabState('private');

                }else if (chatlist >= maxParticipants){
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Current chat is full. Please try again later ' + "</span> <br>";
                    setPrivateChatButtonVisibility(false);
                    
                    if (isPublicChatEnabled()) {
                        chatLogUpdate("public", elem.getAttribute("id"), elem, "Current chat is full. Returning to public chat");
                    } else {
                        // If public chat is disabled, just inform and maybe close the drawer after a delay
                        setTimeout(() => {
                            if (elem.getAttribute("isActive") == "false") {
                                document.getElementById("chat-wrapper-el").style.visibility = 'hidden';
                            }
                        }, 3000);
                    }

                } else {
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Chat is still synchronizing. Please wait a moment and click again... ' + "</span><br>";
                }

            }
        });

        function chatLogUpdate(currenChatState, chat_id, element, chatLogMessage = 'Connected to public chat'){
            switch (currenChatState){
                case "public":
                    chatLog.innerHTML = "";
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  chatLogMessage + "</span>";
                    publicChatIsActive = true;
                    chatLogPublicHistory.forEach((element)=> chatLog.innerHTML += "<span>" + element + "</span><br>");
                    stopPrivateMessageNode(chat_id);
                    sendMsgChatBtn.addEventListener("click",sendPublicMessage);
                    setChatTabState('public');
                    break;

                case "private":
                    chatLog.innerHTML = "";
                    chatLog.innerHTML += '<span style=" color: white">•</span> <span style="color: white">' +  ' Connected to private chat \'' +  element.getAttribute("title") + '\' ' + "</span><br>";
                    publicChatIsActive = false;
                    chatLogPrivateHistory.forEach((element)=> chatLog.innerHTML += "<span>" + element + "</span><br>");
                    sendMsgChatBtn.removeEventListener("click",sendPublicMessage);
                    startPrivateMessageNode(chat_id, element);
                    setChatTabState('private');
                    break;
            }
        }
    }
});
