import { Constants } from 'expo';

export const Colors = {
  Mimo: '#2eb2ff',
  LightMimo: '#abe0ff',
  DarkBlue: '#124766',
  White: 'white',
  Black: 'black',
  Gray: 'gray',
  LightGray: 'lightgray',
  VeryLightGray: '#eee',
  Orange: '#ff7b2e',
  Transparent: 'transparent',
  Overlay: 'rgba(0.0, 0.0, 0.0, 0.7)',
}

export const Heights = {
  TopBar: 60,
  CategoryBar: 60,
  BottomButton: 60,
  StatusBar: Constants.statusBarHeight,
  iOSTabBar: 48,
  AndroidTabBar: 48,
  TabBarIcon: 20,
}
/*
Recording Options for Audio Recording. See Expo Docs:
https://docs.expo.io/versions/latest/sdk/audio#recording-sounds

*/
export const RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Expo.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
    audioEncoder: Expo.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Expo.RECORDING_OPTION_IOS_AUDIO_QUALITY_MAX,
    outputFormat: Expo.Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
    sampleRate: 44100,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export const Auth = {
  Types: {
    Google: 'GOOGLE',
    Facebook: 'FACEBOOK',
    Email: 'EMAIL',
  },
};
