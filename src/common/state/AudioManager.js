import { binarySearch } from '../util/Helpers';
import { logger } from '../util/Logger';



export default class AudioManager {
    constructor() {
        logger.debug('Initializing Audio Manager')

        this.audioInstances = new Map()
        this.recording = false

    }


    registerSound = async(Uid,instance) => {
        this.audioInstances.set(Uid, instance)
        logger.debug('Sound registered')
        return;
    }

    unRegisterSound = (Uid) => {
        this.audioInstances.delete(Uid)
        logger.debug('Sound unregistered')

    }

    stopSounds = async() => {
        this.audioInstances.forEach(
            (value, key) => {
                try { value.pauseAsync() }
                catch (error) {
                    console.log('Error while stopping sound',error)
                }
            })

    }

    toggleRecordingStatus = () =>{
        this.recording = !this.recording
    }

    getRecordingStatus = () =>{
        return this.recording
    }


}