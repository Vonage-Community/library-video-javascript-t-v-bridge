# T to V Bridge

Since Twilio announced sunsetting their [Programmable Video](https://www.twilio.com/en-us/changelog/programmable-video-eol-notice), I wanted to create something that would help the transition of developers moving over to Vonage Video easier.

This library aims to allow developers to keep their Twilio code intact while using the Vonage [Video API](https://developer.vonage.com/en/video/overview).

It tries to cover the following functionalities:

- stream user's camera
- stream user's microphone
- mute/unmute user's camera
- mute/unmute user's microphone
- load remote user when they join
- unload remote user when they leave

## Installation

```bash
npm i @vonage/t-v-bridge
```

## Usage

### import from node modules

```html
<script type="module">
  import '@vonage/t-v-bridge/index.js';
</script>
```

### OR using a CDN

```html
<script type="module" src="https://unpkg.com/@vonage/t-v-bridge@latest/index.js?module"></script>

```

You'll need a Vonage [account](https://dashboard.nexmo.com/) and the Video API library:

```html
<script src="https://unpkg.com/@vonage/client-sdk-video@latest/dist/js/opentok.js "></script>
```

The `token` will now be a the token generated from the server using a Vonage SDK.

In the `connectOptions` Object, you will need to add `applicationId` and `sessionId` values.

That's it!

## Sample Application

I created a [sample application](https://github.com/Vonage-Community/library-video-javascript-t-v-bridge/blob/main/demo) that can be quickly deployed to StackBlitz to test out the bridge library.
