/* global OT */

class LocalAudioTrack {
  constructor(mediaStreamTrack) {
    this.mediaStreamTrack = mediaStreamTrack;
    this.id = mediaStreamTrack.id;
    this.name = mediaStreamTrack.id;
    this.kind = mediaStreamTrack.kind;
    this.audio;
  }
  attach() {
    const stream = new MediaStream();
    stream.addTrack(this.mediaStreamTrack);
    const audio = document.createElement('audio');
    this.audio = audio;
    audio.id = this.mediaStreamTrack.id;
    audio.src = URL.createObjectURL(this.mediaStreamTrack);
    audio.autoplay = true;
    audio.play();
    return audio;
  }
  detach() {
    const detachElements = document.querySelectorAll('audio');
    return detachElements;
  }

  disable() {
    this.mediaStreamTrack.enabled = false;
    publisher.publishAudio(false);
  }

  async enable() {
    publisher.publishAudio(true);
    if (this.audio) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioSource,
      });
      const tracks = stream.getTracks();
      this.mediaStreamTrack = tracks.find((track) => track.kind === 'audio');
      this.audio.src = stream;
      this.audio.autoplay = true;
      this.audio.play();
    }
  }
}

class LocalVideoTrack {
  constructor(mediaStreamTrack, width, height) {
    this.mediaStreamTrack = mediaStreamTrack;
    this.id = mediaStreamTrack.id;
    this.name = mediaStreamTrack.id;
    this.kind = mediaStreamTrack.kind;
    this.dimensions = { width, height };
    this.video;
  }
  attach() {
    const stream = new MediaStream();
    stream.addTrack(this.mediaStreamTrack);
    const video = document.createElement('video');
    this.video = video;
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      video.src = URL.createObjectURL(this.mediaStreamTrack);
    }
    video.autoplay = true;
    video.id = this.mediaStreamTrack.id;
    video.setAttribute('playsinline', '');
    video.width = this.dimensions.width;
    video.height = this.dimensions.height;
    video.play();
    return video;
  }
  detach() {
    const detachElements = document.querySelectorAll('video');
    return detachElements;
  }
  disable() {
    this.mediaStreamTrack.enabled = false;
    publisher.publishVideo(false);
  }
  async enable() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoSource,
    });
    const tracks = stream.getTracks();
    this.mediaStreamTrack = tracks.find((track) => track.kind === 'video');
    publisher.publishVideo(true);
    if ('srcObject' in this.video) {
      this.video.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      this.video.src = URL.createObjectURL(this.mediaStreamTrack);
    }
    this.video.autoplay = true;
    this.video.setAttribute('playsinline', '');
    this.video.width = this.dimensions.width;
    this.video.height = this.dimensions.height;
    this.video.play();
  }
}

class LocalTracks {
  constructor(stream) {
    const tracks = stream.getTracks();
    const audioTrack = tracks.find((track) => track.kind === 'audio');
    const videoTrack = tracks.find((track) => track.kind === 'video');
    return [new LocalAudioTrack(audioTrack), new LocalVideoTrack(videoTrack)];
  }
}

class LocalAudioTrackPublication {
  constructor(stream) {
    const tracks = stream.getTracks();
    const audioTrack = tracks.find((track) => track.kind === 'audio');
    return { kind: 'audio', track: new LocalAudioTrack(audioTrack) };
  }
}

class LocalVideoTrackPublication {
  constructor(stream, width, height) {
    const tracks = stream.getTracks();
    const videoTrack = tracks.find((track) => track.kind === 'video');
    return {
      kind: 'video',
      track: new LocalVideoTrack(videoTrack, width, height),
    };
  }
}

class EventEmitter {
  constructor() {
    this.eventsMap = new Map();
  }

  on(event, callback) {
    if (!this.eventsMap.has(event)) {
      this.eventsMap.set(event, []);
    }
    this.eventsMap.get(event).push(callback);
  }

  once(event, callback) {
    const self = this;
    function onceCallback(data) {
      self.off(event, callback);
      callback(data);
    }
    this.on(event, onceCallback);
  }

  off(event, callback) {
    if (this.eventsMap.has(event)) {
      const activeCallbacks = this.eventsMap
        .get(event)
        .filter((cb) => cb !== callback);
      this.eventsMap.set(event, activeCallbacks);
    }
  }

  emit(event, data) {
    if (this.eventsMap.has(event)) {
      this.eventsMap.get(event).forEach((callback) => {
        callback(data);
      });
    }
  }
}

class RemoteAudioTrack extends EventEmitter {
  constructor(mediaStreamTrack) {
    super();
    this.mediaStreamTrack = mediaStreamTrack;
    this.id = mediaStreamTrack.id;
    this.name = mediaStreamTrack.id;
    this.kind = mediaStreamTrack.kind;
    this.audio;
  }

  attach() {
    const stream = new MediaStream();
    stream.addTrack(this.mediaStreamTrack);
    const audio = document.createElement('audio');
    this.audio = audio;
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.play();
    return audio;
  }

  disable() {
    this.mediaStreamTrack.enabled = false;
    publisher.publishAudio(false);
  }

  async enable() {
    publisher.publishAudio(true);
    if (this.audio) {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioSource,
      });
      const tracks = stream.getTracks();
      this.mediaStreamTrack = tracks.find((track) => track.kind === 'audio');
      this.audio.src = stream;
      this.audio.autoplay = true;
      this.audio.play();
    }
  }
}

class RemoteVideoTrack extends EventEmitter {
  constructor(videoElement, mediaStreamTrack, width, height) {
    super();
    this.mediaStreamTrack = mediaStreamTrack;
    this.id = mediaStreamTrack.id;
    this.name = mediaStreamTrack.id;
    this.kind = mediaStreamTrack.kind;
    this.dimensions = { width, height };
    this.video;
    this.videoElement = videoElement;
  }

  attach() {
    const stream = new MediaStream();
    stream.addTrack(this.mediaStreamTrack);
    const video = document.createElement('video');
    this.video = video;
    if ('srcObject' in video) {
      video.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      video.src = URL.createObjectURL(this.mediaStreamTrack);
    }
    video.autoplay = true;
    video.setAttribute('playsinline', '');
    video.width = this.dimensions.width;
    video.height = this.dimensions.height;
    video.play();
    video.loop = true;
    this.videoElement.width = this.dimensions.width;
    this.videoElement.height = this.dimensions.height;
    return this.videoElement;
  }

  disable() {
    this.mediaStreamTrack.enabled = false;
  }

  async enable() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoSource,
    });
    const tracks = stream.getTracks();
    this.mediaStreamTrack = tracks.find((track) => track.kind === 'video');
    if ('srcObject' in this.video) {
      this.video.srcObject = stream;
    } else {
      // Avoid using this in new browsers, as it is going away.
      this.video.src = URL.createObjectURL(this.mediaStreamTrack);
    }
    this.video.autoplay = true;
    this.video.setAttribute('playsinline', '');
    this.video.width = this.dimensions.width;
    this.video.height = this.dimensions.height;
    this.video.play();
  }
}

class RemoteTracks extends EventEmitter {
  constructor(stream) {
    super();
    const tracks = stream.getTracks();
    const audioTrack = tracks.find((track) => track.kind === 'audio');
    const videoTrack = tracks.find((track) => track.kind === 'video');
    return [new RemoteAudioTrack(audioTrack), new RemoteVideoTrack(videoTrack)];
  }
}

class RemoteAudioTrackPublication extends EventEmitter {
  constructor(stream) {
    super();
    const tracks = stream.getTracks();
    const audioTrack = tracks.find((track) => track.kind === 'audio');
    this.isSubscribed = true;
    this.kind = 'audio';
    this.track = new RemoteAudioTrack(audioTrack);
  }
}

class RemoteVideoTrackPublication extends EventEmitter {
  constructor(videoElement, stream, width, height) {
    super();
    const tracks = stream.getTracks();
    const videoTrack = tracks.find((track) => track.kind === 'video');
    this.isSubscribed = true;
    this.kind = 'video';
    this.track = new RemoteVideoTrack(videoElement, videoTrack, width, height);
  }
}

class Participant extends EventEmitter {
  constructor(video) {
    super();
    this.identity = video.target.stream.name;
    this.sid = video.target.stream.id;
    const stream = video.element.srcObject;
    this.audioTracks = new Map();
    const remoteAudioTrackPublication = new RemoteAudioTrackPublication(stream);
    this.audioTracks.set(
      remoteAudioTrackPublication.track.id,
      remoteAudioTrackPublication
    );
    this.videoTracks = new Map();
    const remoteVideoTrackPublication = new RemoteVideoTrackPublication(
      video.element,
      stream,
      videoWidth,
      videoHeight
    );
    this.videoTracks.set(
      remoteVideoTrackPublication.track.id,
      remoteVideoTrackPublication
    );
    this.tracks = new Map();
    this.tracks.set(
      remoteAudioTrackPublication.track.id,
      remoteAudioTrackPublication
    );
    this.tracks.set(
      remoteVideoTrackPublication.track.id,
      remoteVideoTrackPublication
    );
  }
}

class RemovedParticipant extends EventEmitter {
  constructor(event) {
    super();
    this.identity = event.stream.name;
    this.sid = event.stream.id;
  }
}

class Room extends EventEmitter {
  constructor(
    name,
    sid,
    localParticipant,
    participants,
    session,
    tracks,
    preJoinStreamCreatedEvents
  ) {
    super();
    this.name = name;
    this.sid = sid;
    this.localParticipant = localParticipant;
    this.participants = participants;
    this.session = session;
    this.tracks = tracks;

    // loop through preJoinStreamCreatedEvents and basically do what this.session.on("streamCreated") is doing.
    preJoinStreamCreatedEvents.forEach((event) => {
      const subscriberOptions = {
        insertDefaultUI: false,
        width: '100%',
        height: '100%',
      };
      const subscriber = session.subscribe(
        event.stream,
        subscriberOptions,
        handleError
      );

      subscriber.on('videoElementCreated', (video) => {
        const participant = new Participant(video);
        this.participants.set(participant.sid, participant);
        this.emit('participantConnected', participant);
      });

      subscriber.on('videoDisabled', (event) => {
        // console.log("subscriber videoDisabled: ", event);
      });
    });

    this.session.on('streamCreated', (event) => {
      const subscriberOptions = {
        insertDefaultUI: false,
        width: '100%',
        height: '100%',
      };
      const subscriber = session.subscribe(
        event.stream,
        subscriberOptions,
        handleError
      );

      subscriber.on('videoElementCreated', (video) => {
        const participant = new Participant(video);
        this.participants.set(participant.sid, participant);
        this.emit('participantConnected', participant);
      });

      subscriber.on('videoDisabled', (event) => {
        // console.log("subscriber videoDisabled: ", event);
      });
    });

    this.session.on('sessionDisconnected', (event) => {
      // console.log("sessionDisconnected: ", event);
    });

    this.session.on('streamDestroyed', (event) => {
      const removedParticipant = new RemovedParticipant(event);
      this.participants.delete(removedParticipant.sid);
      this.emit('participantDisconnected', removedParticipant);
    });
  }

  disconnect() {
    this.session.disconnect();
    this.emit('disconnected', this);
  }
}

let session;
let publisher;
let audioSource;
let videoSource;
let videoWidth;
let videoHeight;
const participants = new Map();

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

async function initializeSession(token, options) {
  return new Promise((resolve) => {
    if (window.OT) {
      session = OT.initSession(options.applicationId, options.sessionId);
      let preJoinStreamCreatedEvents = [];
      audioSource =
        typeof options.audio === 'string'
          ? options.audio
          : options.audio.deviceId;
      videoSource =
        typeof options.video === 'string'
          ? options.video
          : options.video.deviceId;

      videoHeight =
        options.video.height !== undefined ? options.video.height : '100%';
      videoWidth =
        options.video.width !== undefined ? options.video.width : '100%';

      // Subscribe to a newly created stream
      session.on('streamCreated', (event) => {
        preJoinStreamCreatedEvents.push(event);
      });

      session.on('sessionDisconnected', (event) => {
        // console.log('You were disconnected from the session.', event.reason);
      });

      // initialize the publisher
      const publisherOptions = {
        // insertMode: 'append',
        width: videoWidth,
        height: videoHeight,
        // resolution: '1280x720',
        audioSource: audioSource,
        videoSource: videoSource,
        insertDefaultUI: false,
        name: options.identity,
      };
      publisher = OT.initPublisher(
        // 'publisher',
        publisherOptions,
        handleError
      );

      // Connect to the session
      session.connect(token, (error) => {
        if (error) {
          console.error('this.session.connect error: ', error);
          handleError(error);
        } else {
          // If the connection is successful, publish the publisher to the session
          session.publish(publisher, handleError);
        }
      });

      publisher.on('streamCreated', (streamEvent) => {
        // console.log('publisher streamCreated: ', streamEvent);
      });

      publisher.on('videoElementCreated', (video) => {
        const stream = video.element.srcObject;
        const audioTracks = new Map();
        const localAudioTrackPublication = new LocalAudioTrackPublication(
          stream
        );
        audioTracks.set(audioSource.deviceId, localAudioTrackPublication);
        const videoTracks = new Map();
        const videoAudioTrackPublication = new LocalVideoTrackPublication(
          stream,
          videoWidth,
          videoHeight
        );
        videoTracks.set(videoSource.deviceId, videoAudioTrackPublication);
        const tracks = new Map();
        tracks.set(audioSource.deviceId, localAudioTrackPublication);
        tracks.set(videoSource.deviceId, videoAudioTrackPublication);

        const name = options.name;
        const sid = session.id;

        const localParticipant = {
          identity: options.identity,
          audioTracks: audioTracks,
          videoTracks: videoTracks,
          tracks: tracks,
        };
        resolve(
          new Room(
            name,
            sid,
            localParticipant,
            participants,
            session,
            tracks,
            preJoinStreamCreatedEvents
          )
        );
      });
    } else {
      console.error('Please load Vonage Video Client SDK');
    }
  });
}

async function createLocalTracks({ audio, video }) {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });
  return new LocalTracks(stream);
}
export { initializeSession as connect, createLocalTracks };
