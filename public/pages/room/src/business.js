class Business {
    constructor ({ room, media, view, socketBuilder, peerBuilder }) {
        this.room = room;
        this.media = media;
        this.view = view;

        this.socketBuilder = socketBuilder;
        this.peerBuilder = peerBuilder;

        this.currentStream = {};
        this.socket = {};
        this.currentPeer = {};
        this.peers = new Map();
    }

    static initialize(deps) {
        const instance = new Business(deps);
        return instance._init();
    }

    async _init() {
        this.currentStream = await this.media.getCamera(true);

        this.socket = await this.socketBuilder
            .setOnUserConnected(this.onUserConnected())                    
            .setOnUserDisconnected(this.onUserDisconnected())                    
            .build();

        this.currentPeer = await this.peerBuilder
             .setOnError(this.onPeerError())
             .setOnConnectionOpened(this.onPeerConnectionOpened())
             .setOnCallReceived(this.onPeerCallReceived())
             .setOnPeerStreamReceived(this.onPeerCallReceived())
             .build();

        this.addVideoStream('Carlos')
    }

    addVideoStream(userId, stream = this.currentStream) {
        const isCurrentId = false;
        this.view.renderVideo({
            userId,
            muted: false,
            stream,
            isCurrentId
        });
    }

    onUserConnected = function () {
        return userId => {
            console.log('user connected!', userId)
            this.currentPeer.call(userId, this.currentStream);
        }
    }
    onUserDisconnected = function () {
        return userId => {
            console.log('user disconnected!', userId)
        }
    }

    onPeerError = function () {
        return error => {
            console.error(`peer error ${error}`);
        }
    }
    onPeerConnectionOpened = function () {
        return peer => {
            const { id } = peer;
            this.socket.emit('join-room', this.room, id);   
            console.log(`peer connection ${id}`, peer);
        }
    }
    onPeerCallReceived = function () {
        return call => {
            console.log('answering call', call)
            call.answer(this.currentStream);
        }
    }

    onPeerCallReceived = function () {
        return (call, stream) => {
            const callerId = call.peer;
            this.addVideoStream(callerId, stream);
            this.peers.set(callerId, { call });

            this.view.setParticipants(this.peers.size);
        }
    }
}