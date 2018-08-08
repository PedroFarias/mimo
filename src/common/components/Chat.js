import { ImagePickerm } from 'expo';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Animated,
  Buttn,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ViewPropTypes,
  View,
} from 'react-native';

import Expo from 'expo';

import {
  Bubble,
  Day,
  GiftedChat,
  Composer,
  Message
} from 'react-native-gifted-chat';

import TopBar from '../components/TopBar';
import { stateManager } from '../state/StateManager';
import { Colors, Heights } from '../util/Constants';
import Actions from './Actions';
import { logger } from '../util/Logger';
import {milliToSecondsAndMinutesFormat, generateUID} from '../util/Helpers.js'

import playIconRight from '../assets/icons/playRight.png';
import playIconLeft from '../assets/icons/playLeft.png';

import pauseIconRight from '../assets/icons/pauseRight.png';
import pauseIconLeft from '../assets/icons/pauseLeft.png';


import { FadeInView, BlinkingOpacity } from './Animations';



/**
 * The send button component. The code here is very similar to what is already
 * present in GiftedChat's Send, but we allow an icon to show up if the text
 * is empty (the second child to the Send object).
 */
class Send extends React.Component {
  _onSend = () => {
    this.props.onSend({ text: this.props.text.trim() }, true);
  }



  render() {
    const childIfText = this.props.children ? this.props.children[0] : null;
    const childIfEmpty = this.props.children ? this.props.children[1] : null;
    const canSend = this.props.text.trim().length > 0;

    const child = canSend ? childIfText : childIfEmpty;
    const label = canSend ?
      <Text style={[styles.send.text, this.props.textStyle]}>
        {this.props.label}
      </Text> : null;

    return (
      <TouchableOpacity
        style={[styles.send.container, this.props.containerStyle]}
        onPress={this._onSend}
        disabled={!canSend}
      >
        {child !== null ? child : label}
      </TouchableOpacity>
    );
  }
}

/**
 * Display a system message in the conversation.
 */
class SystemMessage extends React.Component {
  render() {
    const message = this.props.currentMessage;
    const title = message.title;
    const text = message.text;

    const titleView = title ?
      <Text style={[styles.system.title, this.props.titleStyle]}>
        {title}
      </Text>
      : null;

    return (
      <View style={[styles.system.container, this.props.containerStyle]}>
        <View style={[styles.system.wrapper, this.props.wrapperStyle]}>
          {titleView}
          <Text style={[styles.system.text, this.props.textStyle]}>{text}</Text>
        </View>
      </View>
    );
  }
}


/**
 * Custom actions show up when the user presses "+"; it allows access to the
 * camera and to the photo library.
 */
class CustomActions extends React.Component {
  /**
   * Callback triggered when an image is chosen from the library.
   */
  _onLibrary = (image) => this.props.onLibrary(image);

  /**
   * Callback triggered when an image is taken by the camera.
   */
  _onCamera = (image) => this.props.onCamera(image);



  onActionsPress = () => {
    const options = ['Camera', 'Choose From Library', 'Cancel'];
    const cancelButtonIndex = options.length - 1;

    this.context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex,
    },
      (buttonIndex) => {
        switch (buttonIndex) {
          case 0:
            this._showCamera();
            break;
          case 1:
            this._showLibrary();
            break;
          default:
            break;
        }
      });
  }

  /**
   * Callback triggered when user requests the library.
   */
  _showLibrary = async () => {

    let image = await ImagePicker.launchImageLibraryAsync({
      allowsEditting: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: true,
    });
    if (image != null && image.uri != null) {
      this._onLibrary(image.uri);
    }
  }

  /**
   * Callback triggered when user requests the camera.
   */
  _showCamera = async () => {
    let image = await ImagePicker.launchCameraAsync({
      allowsEditting: false,
      quality: 0.5,
      base64: true,
    });
    if (image != null && image.uri != null) {
      this._onCamera(image.uri);
    }
  }

  render() {
    if (Platform.OS === 'ios') {
      /*
       * By default icon is a circle with a "+" inside; if an icon is specified,
       * show it instead.
       */
      const icon = this.props.icon ? this.props.icon :
        <View style={[styles.wrapper, this.props.wrapperStyle]}>
          <Text style={[styles.iconText, this.props.iconTextStyle]}>
            +
          </Text>
        </View>;

      return (
        <TouchableOpacity
          style={[styles.container, this.props.containerStyle]}
          onPress={this.onActionsPress}
        >
          {icon}
        </TouchableOpacity>
      );
    }

    const options = {
      'Camera': () => { this._showCamera() },
      'Choose from Library': () => { this._showLibrary() },
      'Cancel': () => { },
    };

    return (
      <Actions {...this.props}
        options={options}
      />
    );
  }
}

/*
 * Recording action when user presses the microphone icon. 
 * The component handle long-press tap, the creation of the audio file and the sending of it.
 *
 */

class Microphone extends React.Component {

  componentWillMount() {
    this.isRecording = false;
    this.recordingUI = false;
    this.durationString = '0:00'
  }

  _toggleRecordingUI = () =>{
    //Set the state manager to notify that there is a recording in the app.
    this.recordingUI=  !this.recordingUI
    this.forceUpdate()
    this.props.prepareRecordingUI()

  }


  _askRecordingPermissions = async () => {
    const { Permissions } = Expo;
    const { status } = await Permissions.getAsync(Permissions.AUDIO_RECORDING)
    logger.debug('Microphone permisiion', status)
    if (status === 'denied') {
      alert('É preciso ativar as permissões de microfone pare utilizar esse recurso.')
    }
    if (status != 'granted') {
      try {
        await Permissions.askAsync(Permissions.AUDIO_RECORDING)
      }
      catch (error) {
        console.log(error)
      }
    }


  }

  _onPressIn = async () => {
    logger.debug('Pressing Microphone In')

    //Check if the user has granted permissions, if not we ask him.

    this._toggleRecordingUI()

    await this._askRecordingPermissions()
    
    
    const mode = {
      interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true, allowsRecordingIOS: true, shouldDuckAndroid: true,
      interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    }
    //We need to set Audio Mode before Recording (not written in documentation)
    await stateManager.stopSounds()
    await Expo.Audio.setAudioModeAsync(mode)


    /*
    Recording Options for Audio Recording. See Expo Docs:
    https://docs.expo.io/versions/latest/sdk/audio#recording-sounds

    */
    const RecordingOptions = {
      android: {
        extension: '.m4a',
        outputFormat: Expo.Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_AAC_ADTS,
        audioEncoder: Expo.Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
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

    this.recordingInstance = new Expo.Audio.Recording();

    //Event listener for Recording Instance Status
    this.recordingInstance.setOnRecordingStatusUpdate((recordingStatus) => {

      this.status = recordingStatus
      if (recordingStatus.isRecording){
        //Recording Time to be displayed
        this.durationString = milliToSecondsAndMinutesFormat(recordingStatus.durationMillis)
      }


      if (recordingStatus.isRecording && !this.isRecording) {
        //Call onRecording() chat method for setting Recording and updating the UI. See Chat class.
        this.isRecording = true
        this.forceUpdate()

        return
      }
      if (!recordingStatus.isRecording && this.isRecording) {
        //Call onRecording() chat method for setting Recording and updating the UI. See Chat class.
        this.isRecording = false
        this.forceUpdate()
        return
      }
      this.forceUpdate()
      return

    })
    try {
      await this.recordingInstance.prepareToRecordAsync(RecordingOptions)
      await this.recordingInstance.startAsync()

      logger.log('Recording')

    }
    catch (error) {
      console.log(error)
    }



  }


  _onPressOut = async () => {

    console.log('on press out')
    logger.debug('Pressing Microphone out')
    if (this.recordingInstance && this.status.isRecording) {
      try {
        await this.recordingInstance.stopAndUnloadAsync()
        logger.log('Recording Stopped')
      }
      catch (error) {
        console.log(error)
      }
      await Expo.Audio.setAudioModeAsync({
        interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true, allowsRecordingIOS: false, shouldDuckAndroid: true,
        interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
      })
      const uri = this.recordingInstance.getURI()


      //Check if the audio duration is at least superior than 1s.
      if (this.status.durationMillis > 1500 && this.status.isDoneRecording) {
        try {

          //await this._sendAudio(uri)

          return;
        }
        catch (error) {
          console.log(error)
        }

      }
    }
  }



  _cancelRecording = async() =>{
    
    if(this.recordingInstance){
      await this.recordingInstance.stopAndUnloadAsync()
      this._toggleRecordingUI()
      this.durationString = "0:00"
    }

  }

  _onSendRecording = async() =>{
    console.log('on press out')
    logger.debug('Pressing Microphone out')
    if (this.recordingInstance && this.status.isRecording) {
      try {
        await this.recordingInstance.stopAndUnloadAsync()
        logger.log('Recording Stopped')
      }
      catch (error) {
        console.log(error)
      }
      await Expo.Audio.setAudioModeAsync({
        interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true, allowsRecordingIOS: false, shouldDuckAndroid: true,
        interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
      })
      const uri = this.recordingInstance.getURI()


      //Check if the audio duration is at least superior than 1s.
      if (this.status.durationMillis > 1500 && this.status.isDoneRecording) {
        try {
          logger.debug('Sending Audio Recording')
          await this._sendAudio(uri)

        }
        catch (error) {
          console.log(error)
        }

      }
      this._toggleRecordingUI()
    }
  }

  _sendAudio = async (uri) => {
    //Prepare the message object to the State Manager Action
    content = { audio: uri };
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
      timestamp: stateManager.getTimestamp(),
    }
    stateManager.sendMessage(this.props.cUid, message);

  }

  componentDidMount() {

  }

  render() {
    if (this.recordingUI){
    return (
      <View style={this.recordingUI && {backgroundColor:'white', flex:1, alignContent:'center',alignItems:'center', flexDirection: 'row',  marginLeft:30, height:44}}>
      

      <TouchableOpacity style={styles.microphone.sendButton} onPress={this._onSendRecording} >
        <Text style={styles.microphone.sendText}> Enviar </Text>
      </TouchableOpacity>
      
        <TouchableOpacity onPress={this._cancelRecording} hitSlop={{top:5,left:5,bottom:5,right:5}} style={{flex:1, alignItems:'center'}}>
      <Text style={styles.microphone.cancelText}> Cancelar </Text>
        </TouchableOpacity>
        <View style={{minWidth:50, marginLeft:10, alignItems:'flex-end', justifyContent:'flex-end'}}>
        {Platform.OS === 'ios' ? 
                <BlinkingOpacity duration={2000} initialOpacity={0.8} finalOpacity={0.2}>
                  <Text style={styles.microphone.recordingDuration} > {this.durationString} </Text>
                </BlinkingOpacity>   
                :
        <Text style={styles.microphone.recordingDuration} > {(this.durationString)} </Text>

      }

        </View>

      <View  style={{flex:1, alignItems: 'center'}}    >
        <View style={styles.microphone.iconWrapperOnRecording}>
          <Image source={require('../assets/icons/microphoneWhite.png')} style={styles.microphone.iconOnRecording}></Image>
        </View>
      </View>
      </View>

    )
  }
  return(
    <TouchableOpacity onLongPress={this._onLongPress} onPressIn={this._onPressIn}  hitSlop={{ top: 5, left: 5, bottom: 5, right: 5 }}   >
    <Image source={require('../assets/icons/microphone.png')} style={styles.microphone.icon}></Image>
  </TouchableOpacity>

  )


  }


}
class MessageAudio extends React.Component {


  componentWillMount() {
    this.isPlaying = false;
    this.soundLoaded = false;

    //Generate  a simple Uid for the audio manager.
    this.audioManagerUid = generateUID()

  }


  _onPress = async () => {
    //We check if there isn't a recording going on somewhere in the app.
    if(!stateManager.getRecordingStatus()){

    const mode = {
      interruptionModeIOS: Expo.Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
      playsInSilentModeIOS: true, allowsRecordingIOS: false, shouldDuckAndroid: true,
      interruptionModeAndroid: Expo.Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX
    }

    Expo.Audio.setAudioModeAsync(mode)

    //Wait until the audio file is downloaded. 
    const soundLoaded = await this.soundLoaded
    //Evaluate button status: if paused, play the audio, else pause the audio.
    if (this.isPlaying === false) {
      try {
        stateManager.stopSounds()
        console.log('play Sound Instance')
        await this.soundInstance.playAsync();
        return
      }
      catch (error) {
        console.log(error)
      }
    }
    else {
      status = await this.soundInstance.getStatusAsync()
      console.log(status)
      await this.soundInstance.pauseAsync().then();
      return

    }

  }
  }
  /*
  *
  *
  */
  async componentDidMount() {



    this.soundInstance = new Expo.Audio.Sound();

    //Mount sound instance and load Sound

    //Playback Status Listener for changes
    this.soundInstance.setOnPlaybackStatusUpdate((playbackStatus) => {
      if (playbackStatus.isPlaying && !this.isPlaying) {
        this.isPlaying = true
        //Register the sound Instance to the Audio Manager so we know the Sound Instances that 
        //are currently playing
        stateManager.registerSound(this.audioManagerUid,this.soundInstance)
        this.forceUpdate()
        console.log('updating playing=true')
        return
      }
      if (!playbackStatus.isPlaying && this.isPlaying) {
        this.isPlaying = false
        //Unregister the Sound from the Audio Manager State.
        stateManager.unRegisterSound(this.audioManagerUid,this.soundInstance)
        this.forceUpdate()
        return
      }

    })

    try {
      this.soundLoaded = this.soundInstance.loadAsync({ uri: this.props.audioSource }).then(() => true)
      await this.soundLoaded
      const status = await this.soundInstance.getStatusAsync()
      //Playback duration in Seconds
      
      this.playbackDurationString = milliToSecondsAndMinutesFormat(status.durationMillis)
      this.forceUpdate()

    }
    catch (error) {
      console.log(error)
    }
  }


  async componentWillUnmount() {
    status = await this.soundInstance.getStatusAsync()
    if (status.isPlaying) {
      this.soundInstance.unloadAsync()
    }

    //Unregister component in case we may have forgotten
    stateManager.unRegisterSound(this.audioManagerUid,this.soundInstance)

  }

  render() {
    console.log('Duration string',stateManager.getRecordingStatus())

    if (this.isPlaying){
    return (
        <TouchableOpacity style={styles.messageAudio.wrapper} onPress={ this._onPress}  >
          <Image source={this.props.position === 'right' ? pauseIconRight : pauseIconLeft} style={styles.messageAudio.icon}></Image>
          <Text style={{ color: this.props.position==='right' ? "rgb(243,243,243)":"rgb(0,0,0)" , fontSize: 8 }}>{this.playbackDurationString}</Text>
        </TouchableOpacity>
    )
  }
  else{
    return (
      <TouchableOpacity style={styles.messageAudio.wrapper} onPress={this._onPress}  >
        <Image source={this.props.position === 'right' ? playIconRight : playIconLeft} style={styles.messageAudio.icon}></Image>
        <Text style={{ color: this.props.position==='right' ? "rgb(243,243,243)":"rgb(0,0,0)" , fontSize: 8 }}>{this.playbackDurationString}</Text>

      </TouchableOpacity>
  )

  }

  }

}

export default class Chat extends React.Component {

  componentWillMount() {
    this.recording = false
  }

  /**
   * TODO: FIXME: This is a hack.
   */
  onSend = (messages) => {
    content = { text: messages[0].text };
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
    }

    stateManager.sendMessage(this.props.cUid, message);
  }

  /**
   * Callback triggered when an image is chosen from the library.
   */
  _onLibrary = async (uri) => {
    content = { image: uri };
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
      timestamp: stateManager.getTimestamp(),
    }

    stateManager.sendMessage(this.props.cUid, message);
  }

  /**
   * Callback triggered when an image is chosen from the camera.
   */
  _onCamera = async (uri) => {
    content = { image: uri };
    let readBy = {};
    readBy[stateManager.getUser().uid] = true;

    const message = {
      content: content,
      sender: stateManager.getUser().uid,
      readBy: readBy,
      timestamp: stateManager.getTimestamp(),
    }

    stateManager.sendMessage(this.props.cUid, message);
  }



  _prepareRecordingUI = () => {
    if (this.recording) {
      this.recording = false
    }
    else {
      this.recording = true
    }
    stateManager.toggleRecordingStatus()

    this.forceUpdate()
  }

  /**
   * Renders the custom actions: if we are on iOS, we use the CustomActions
   * component above; otherwise, we just use Android's Actions.
   */
  renderCustomActions = (props) => {
    if(this.recording){
      return(
        <View style={{ flexDirection: 'row' }}>
        <Microphone cUid={this.props.cUid} prepareRecordingUI={this._prepareRecordingUI} />
        </View>


      )
    }
    return (
      <View style={{ flexDirection: 'row' }}>
        <Microphone cUid={this.props.cUid} prepareRecordingUI={this._prepareRecordingUI}  />
        <CustomActions
          {...props}
          onCamera={this._onCamera}
          onLibrary={this._onLibrary}
        />

      </View>

    );
  }

  renderCustomView = (props) => {
    const { currentMessage,position, isRecording } = props
    if (currentMessage.audio) {
      logger.debug('Returning audio')
      return (
        <MessageAudio audioSource={currentMessage.audio} isRecording={isRecording} position={position} />
      )
    }
  }
  /**
   * Renders message bubbles.
   */
  renderBubble = (props) => {
    return <Bubble {...props} wrapperStyle={styles.bubble} />;
  }

  render

  /**
   * Renders the day the message was received, if appropriate.
   */
  renderDay = (props) => {
    return <Day {...props} textStyle={styles.day.text} />;
  }

  /**
   * Renders the send button, with the desired images.
   */
  renderSend = (props) => {
    return (
      <Send {...props}>
        <Image
          source={require('../assets/icons/send.png')}
          style={styles.send.icon}
        />
        <Image
          source={require('../assets/icons/sendGray.png')}
          style={styles.send.icon}
        />
      </Send>
    );
  }

  /**
   * Renders a system message, usually a notification that a new mimo has been
   * added to the conversation.
   */
  renderSystemMessage = (props) => {
    return (
      <SystemMessage {...props} />
    );
  }







  render() {
    let offset = Platform.OS == 'ios' ? Heights.iOSTabBar :
      Heights.androidTabBar;

    // This comparison function leaves invalid timestamps as the very last
    // messages; this is expected in case we can't connect to the server,
    // for instance.
    const cmpFunc = (a, b) => {
      return isNaN(b.createdAt) ? 1 : a.createdAt > b.createdAt;
    };

    // Converts the messages from the state manager to whatever the GiftedChat
    // module expects. Annoying, but I really don't want to tie the StateManager
    // to GiftedChat by any means.


    const giftMessages = this.props.messages.map((message) => {

      const createdAt = message.timestamp;
      const formattedMessage = {
        _id: message.uid,
        createdAt: createdAt,
        text: message.content.text,
        image: message.content.image,
        title: message.content.title,
        audio: message.content.audio,
      };

      // Add either system or user information.
      if (message.sender == 'system') {
        formattedMessage.system = true;
      } else {
        formattedMessage.user = {
          _id: message.sender,
        };
      }

      return formattedMessage;
    }
    ).sort(cmpFunc).reverse();
    return (
        <GiftedChat
          messages={giftMessages}
          onSend={this.onSend}
          onReceive={this.onReceive}

          user={{ _id: stateManager.getUser().uid }}
          renderMessage={this.renderMessage}
          renderBubble={this.renderBubble}
          renderSystemMessage={this.renderSystemMessage}
          renderDay={this.renderDay}
          renderActions={this.renderCustomActions}
          renderSend={this.recording ? null : this.renderSend}
          renderAvatar={null}
          renderCustomView={this.renderCustomView}
          renderComposer={(props) => {
            if (this.recording) {
              return (
                null

              )
            }
            else {
              return (

                  <Composer {...props} />

              )

            }

          }}
          imageStyle={{ resizeMode: 'cover' }}
          lightboxProps={{ springConfig: { speed: 80, overshootClamping: true } }}

          forceGetKeyboardHeight={true}
          bottomOffset={0}
          autoCapitalize='none'
          autoComplete={false}
          isRecording = {this.recording}
        />
    );
  }
}

const styles = {
  bubble: StyleSheet.create({
    left: {
      backgroundColor: Colors.VeryLightGray,
      padding: 2,
    },
    right: {
      backgroundColor: Colors.Mimo,
      padding: 2,
    },
  }),
  day: StyleSheet.create({
    text: {
      color: Colors.Black,
    }
  }),
  footerContainer: {
    marginTop: 5,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 14,
    color: '#aaa',
  },
  container: {
    width: 26,
    height: 26,
    marginLeft: 10,
    marginBottom: 10,
  },
  wrapper: {
    borderRadius: 13,
    borderColor: '#b2b2b2',
    borderWidth: 2,
    flex: 1,
  },
  iconText: {
    color: '#b2b2b2',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'transparent',
    textAlign: 'center',
  },
  send: StyleSheet.create({
    container: {
      height: 44,
      justifyContent: 'flex-end',
    },
    text: {
      color: '#0084ff',
      fontWeight: '600',
      fontSize: 17,
      backgroundColor: 'transparent',
      marginBottom: 12,
      marginLeft: 10,
      marginRight: 10,
    },
    icon: {
      width: 26,
      height: 26,
      resizeMode: 'center',
      marginRight: 10,
      marginBottom: 10,
    },
  }),
  modal: StyleSheet.create({
    container: {
      flex: 1,
      marginTop: Heights.StatusBar,
    },
    topBar: {
      shadowRadius: 0,
      shadowColor: Colors.White,
    },
    done: {
      width: 40,
      height: 20,
    },
    middleViewContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'josefin-sans-bold',
      fontSize: 18,
      color: Colors.Mimo,
    },
  }),
  microphone: StyleSheet.create({
    icon: {
      width: 26,
      height: 26,
      marginLeft: 8,
      marginRight: 0,
      marginBottom: 5,
    },
    iconOnRecording:{
      width: 26,
      height: 26,
    },
    iconWrapperOnRecording:{
      backgroundColor: 'rgba(240,30,10,0.8)',
      opacity: 0.8,
      borderRadius:40,
      alignContent: 'center',
      padding: '3%'
    },
    sendButton:{
      flex:1,
      backgroundColor:Colors.Mimo,
      paddingVertical: '2.5%',
      paddingHorizontal: 0,
      borderRadius: 30,  
    },
    sendText:{
      fontFamily:'josefin-sans-bold',
      textAlign: 'center', // <-- the magic
      color: 'white',
      fontSize: 12,
      marginTop:3,
    },
    cancelText:{
      fontSize: 12,
      color:'rgb(180,180,180)'

    },
    recordingDuration:{
      textAlign:'center',
      color:'grey',
      

    }
  }),
  messageAudio: StyleSheet.create({
    wrapper: {
      marginTop: 8,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 5,
      flexDirection: 'row'

    },
    icon: {
      width: 26,
      height: 26,
    },
  }),
  footer: StyleSheet.create({
    recordingText: {
      color: Colors.White
    },
    recordingContainer: {
      alignItems: 'center',
      backgroundColor: 'rgba(244, 244, 243, 0.8)',
      padding: 50,
    },
  }),
  system: StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      marginTop: 5,
      marginBottom: 10,
    },
    wrapper: {
      padding: 10,
      backgroundColor: Colors.DarkBlue,
      borderRadius: 5,
    },
    title: {
      color: Colors.White,
      fontSize: 12,
      marginBottom: 3,
      fontWeight: '900',
      textAlign: 'center',
    },
    text: {
      color: Colors.White,
      fontSize: 12,
      textAlign: 'center',
    },
  }),
}



CustomActions.contextTypes = {
  actionSheet: PropTypes.func,
};

CustomActions.defaultProps = {
  onSend: () => { },
  options: {},
  icon: null,
  containerStyle: {},
  wrapperStyle: {},
  iconTextStyle: {},
};

CustomActions.propTypes = {
  onSend: PropTypes.func,
  options: PropTypes.object,
  icon: PropTypes.func,
  containerStyle: ViewPropTypes.style,
  wrapperStyle: ViewPropTypes.style,
  iconTextStyle: Text.propTypes.style,
};
