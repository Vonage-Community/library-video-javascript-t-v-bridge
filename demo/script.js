const TWILIO_TOKEN = '';

const VONAGE_APPLICATION_ID = '';
const VONAGE_SESSION_ID = '';
const VONAGE_TOKEN = '';

let connect;
let createLocalTracks;

// check to see if Vonage Video library is loaded
if (window.OT) {
  connect = TVBridge.connect;
  createLocalTracks = TVBridge.createLocalTracks;
} else {
  const Video = Twilio.Video;
  connect = Video.connect;
  createLocalTracks = Video.createLocalTracks;
}

const roomNameInput = document.querySelector('#room-name');
const usernameInput = document.querySelector('#username');

const muteVideoBtn = document.querySelector('#mute-video');
const unmuteVideoBtn = document.querySelector('#unmute-video');

const muteAudioBtn = document.querySelector('#mute-audio');
const unmuteAudioBtn = document.querySelector('#unmute-audio');

const connectBtn = document.querySelector('#connect');
const leaveBtn = document.querySelector('#leave');

let roomId;

// device selection
const audioSelector = document.querySelector('#audio-source-select');
const videoSelector = document.querySelector('#video-source-select');
let audioDeviceValue;
let videoDeviceValue;

let screenTrack;

const loadAVSources = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log('enumerateDevices() not supported.');
    return;
  }

  try {
    // Need to ask permission in order to get access to the devices to be able to list them in the dropdowns.
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    stream.getTracks().forEach((track) => track.stop());
    let audioCount = 0;
    let videoCount = 0;
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.forEach(function (device) {
      if (device.kind.toLowerCase() === 'audioinput') {
        audioCount += 1;
        audioSelector.innerHTML += `<option value="${device.deviceId}">${
          device.label || device.kind + audioCount
        }</option>`;
      }
      if (device.kind.toLowerCase() === 'videoinput') {
        videoCount += 1;
        videoSelector.innerHTML += `<option value="${device.deviceId}">${
          device.label || device.kind + videoCount
        }</option>`;
      }
    });
    audioSelector.innerHTML += `<option value="">No audio</option>`;
    videoSelector.innerHTML += `<option value="">No video</option>`;
  } catch (error) {
    console.error('error loading AV sources: ', error);
  }
};

loadAVSources();

connectBtn.addEventListener('click', async () => {
  const roomName = roomNameInput.value
    ? roomNameInput.value
    : `my-room-name-${Date.now()}`;

  console.log('roomName: ', roomName);

  const identity = usernameInput.value
    ? usernameInput.value
    : `Alice-${Date.now()}`;

  console.log('identity: ', identity);

  audioDeviceValue =
    audioSelector.value === '' ? false : { deviceId: audioSelector.value };
  videoDeviceValue =
    videoSelector.value === '' ? false : { deviceId: videoSelector.value };

  console.log('audioDeviceId: ', audioDeviceValue);
  console.log('videoDeviceId: ', videoDeviceValue);

  // Fetch an AccessToken to join the Room.
  let token;
  let connectOptions;

  if (!window.OT) {
    const response = await fetch(`/token?identity=${identity}`);

    token = TWILIO_TOKEN;

    connectOptions = {
      audio: { deviceId: audioDeviceValue },
      name: roomName,
      video: { deviceId: videoDeviceValue, width: 300, height: 300 },
      networkQuality: {
        local: 1, // LocalParticipant's Network Quality verbosity [1 - 3]
        remote: 2, // RemoteParticipants' Network Quality verbosity [0 - 3]
      },
    };
  } else {
    token = VONAGE_TOKEN;

    connectOptions = {
      applicationId: VONAGE_APPLICATION_ID,
      sessionId: VONAGE_SESSION_ID,
      identity,
      audio: { deviceId: audioDeviceValue },
      name: roomName,
      video: { deviceId: videoDeviceValue, width: 300, height: 300 },
      networkQuality: {
        local: 1, // LocalParticipant's Network Quality verbosity [1 - 3]
        remote: 2, // RemoteParticipants' Network Quality verbosity [0 - 3]
      },
    };
  }

  connect(token, connectOptions).then((room) => {
    console.log(`Connected to Room: ${room.name}`);

    roomId = room.sid;

    // Log your Client's LocalParticipant in the Room
    const localParticipant = room.localParticipant;

    // attach local video and audio
    let localVideoTrack = Array.from(
      room.localParticipant.videoTracks.values()
    )[0].track;

    const localMediaContainer = document.getElementById('local-media');
    localMediaContainer.appendChild(localVideoTrack.attach());

    // ****** from GitHub library repo ******
    room.participants.forEach(participantConnected);
    room.on('participantConnected', participantConnected);
    room.on('participantDisconnected', participantDisconnected);
    room.once('disconnected', (error) =>
      room.participants.forEach(participantDisconnected)
    );

    // ******* from Getting Started Guide ******
    // Removing local participant tracks and element
    room.on('disconnected', (room) => {
      // Detach the local media elements
      room.localParticipant.tracks.forEach((publication) => {
        const attachedElements = publication.track.detach();
        attachedElements.forEach((element) => element.remove());
      });
    });

    leaveBtn.addEventListener('click', async () => {
      room.disconnect();
    });

    // ****** from Getting Started Guide *****
    // muting local video and audio
    muteVideoBtn.addEventListener('click', async () => {
      room.localParticipant.videoTracks.forEach((publication) => {
        publication.track.disable();
      });
    });

    muteAudioBtn.addEventListener('click', async () => {
      room.localParticipant.audioTracks.forEach((publication) => {
        publication.track.disable();
      });
    });

    // unmuting local video and audio
    unmuteVideoBtn.addEventListener('click', async () => {
      room.localParticipant.videoTracks.forEach((publication) => {
        publication.track.enable();
      });
    });

    unmuteAudioBtn.addEventListener('click', async () => {
      room.localParticipant.audioTracks.forEach((publication) => {
        publication.track.enable();
      });
    });
  });

  // ****** from GitHub library repo ******
  function participantConnected(participant) {
    console.log('participantConnected');
    console.log('paricipant: ', participant);

    const div = document.createElement('div');
    div.id = participant.sid;
    div.innerText = participant.identity;

    participant.on('trackSubscribed', (track) => trackSubscribed(div, track));
    participant.on('trackUnsubscribed', trackUnsubscribed);

    participant.tracks.forEach((publication) => {
      // console.log("publication: ", publication);
      if (publication.isSubscribed) {
        trackSubscribed(div, publication.track);
        handleTrackDisabled(publication.track); // from handle remote media mute events in Getting Started
        handleTrackEnabled(publication.track);
      }
      publication.on('unsubscribed', handleTrackDisabled); // from handle remote media mute events in Getting Started
      publication.on('subscribed', handleTrackEnabled);
    });

    // appends to the end of the page
    // document.body.appendChild(div);

    // appends to a specific container
    document.getElementById('remote-media-div').appendChild(div);
  }

  function participantDisconnected(participant) {
    console.log('participantDisconnected', participant);
    // console.log('Participant "%s" disconnected', participant.identity);
    document.getElementById(participant.sid).remove();
  }

  function trackSubscribed(div, track) {
    console.log('trackSubscribed track: ', track);
    div.appendChild(track.attach());
  }

  function trackUnsubscribed(track) {
    track.detach().forEach((element) => element.remove());
  }

  // ****** from Getting Started Guide ******
  function handleTrackDisabled(track) {
    console.log('handleTrackDisabled track: ', track);
    track.on('disabled', (event) => {
      console.log('track disabled!', event);
      /* Hide the associated <video> element and show an avatar image. */
    });
  }

  function handleTrackEnabled(track) {
    console.log('handleTrackEnabled track: ', track);
    track.on('enabled', () => {
      console.log('track enabled!');
      /* Hide the avatar image and show the associated <video> element. */
    });
  }
});
