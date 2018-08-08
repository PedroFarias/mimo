import React  from 'react';
import {Animated} from 'react-native';

export class FadeInView extends React.Component {
  state = {
    fadeAnim: new Animated.Value(this.props.visible ? 1 : 0),
    visible: true,  // Initial value for opacity: 0
  }

  componentDidMount() {
    Animated.timing(                  // Animate over time
      this.state.fadeAnim,            // The animated value to drive
      {
        toValue: this.props.visible ? 0 : 1,        // Animate to opacity: 1 (opaque)
        duration: 600,
        useNativeDriver: true              // Make it take a while
      }
    ).start(()=>{
      if (this.props.visible){
      this.setState({visible: false})
      }
    });                        // Starts the animation
  }

  render() {
    let { fadeAnim } = this.state;

    return (
      <Animated.View                 // Special animatable View
        style={{
          ...this.props.style,
          opacity: fadeAnim,         // Bind opacity to animated value
        }}
      >
        {this.state.visible ? this.props.children : null}
      </Animated.View>
    );
  }
}




export class BlinkingOpacity extends React.Component {
  state = {
    fadeAnim: new Animated.Value(this.props.initialOpacity),
    looping: false
  }

  componentDidMount(){
    this.setState({looping:false})
  }

  componentDidUpdate(){
    if(this.state.looping === false){
      this.loopAnimation()
    }
  }

  loopAnimation=()=> {
    this.setState({looping:true})
    Animated.timing(                  // Animate over time
      this.state.fadeAnim,            // The animated value to drive
      {
        toValue: this.props.finalOpacity,        
        duration: this.props.duration,
        useNativeDriver: true              
      }
    ).start(()=>{
      Animated.timing(                  
        this.state.fadeAnim,            
        {
          toValue: this.props.initalOpacity,        
          duration: this.props.duration,
          useNativeDriver: true              
        }
      ).start(()=> this.setState({looping: false}))
  })
}

  render() {
    let { fadeAnim } = this.state;

    return (
      <Animated.View                 // Special animatable View
        style={{
          ...this.props.style,
          opacity: fadeAnim,         // Bind opacity to animated value
        }}
      >
        {this.props.children }
      </Animated.View>
    );
  }
}