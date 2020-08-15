import React, {Component} from 'react';
import {
  Text,
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import mqtt from './node_modules/mqtt/dist/mqtt';
import DeviceInfo from 'react-native-device-info';

const MessageView = (props) => {
  return (
    <View style={props.left ? msgStyles.float_left : msgStyles.float_right}>
      <View style={msgStyles.content_box}>
        <Text
          style={
            props.left ? msgStyles.msg_text_left : msgStyles.msg_text_right
          }>
          {props.text}
        </Text>
      </View>
    </View>
  );
};

const msgStyles = StyleSheet.create({
  float_left: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  float_right: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  content_box: {
    // backgroundColor: 'yellow',
    maxWidth: '80%',
  },
  msg_text_left: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 8,
    fontSize: 15,
    fontWeight: '700',
  },
  msg_text_right: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 8,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '700',
  },
});

const TOPIC = 'hcmiuiot/chat';
export default class App extends Component {
  state = {
    msgInput:
      'Example input',
    msgList: [
      {text: 'Aliquam a turpis sagittis', float: 'left'},
      {
        text:
          'Donec vitae malesuada nulla. Proin fringilla mauris odio, vel commodo mi convallis',
        float: 'right',
      },
    ],
  };

  constructor(props) {
    super(props);

    this.deviceId = DeviceInfo.getUniqueId();

    ////////////// MQTT SECTION ///////////////////////////////
    this.client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt');

    this.client.on('connect', () => {
      console.log('MQTT connected');

      this.client.subscribe(TOPIC, function (err) {
        if (!err) {
          console.log('SUBSCRIBED OK!');
        }
      });
    });

    // Handle incoming message
    this.client.on('message', (topic, message) => {
      // message is Buffer
      console.log(`[${topic}] ${message.toString()}`);

      let msgObj = JSON.parse(message); //parse to object
      if (!msgObj || !msgObj.deviceId || !msgObj.text) return; // skip if failed validation
      else {
        // add msg to state.msgList
        this.setState({
          msgList: [
            ...this.state.msgList,
            {
              text: msgObj.text,
              float: msgObj.deviceId == this.deviceId ? 'right' : 'left',
            },
          ],
        });
      }
    });

    ////////////// MQTT SECTION ///////////////////////////////
  }

  // will be triggered when click send button
  onSendMsg = () => {
    let text = this.state.msgInput;
    this.client.publish(TOPIC, JSON.stringify({deviceId: this.deviceId, text}));
    this.setState({msgInput: ""});
  };

  render() {
    return (
      // main screen
      <View style={styles.container}>
        {/* message view area */}
        <ScrollView
          style={styles.message_view}
          ref={(ref) => {
            this.scrollView = ref;
          }}
          // auto scroll to bottom
          onContentSizeChange={() =>
            this.scrollView.scrollToEnd({animated: true})
          }>

          {/* render all messages in state */}
          {this.state.msgList.map((msgObj, key) => (
            <MessageView
              key={key}
              text={msgObj.text}
              left={msgObj.float == 'left'}
            />
          ))}

        </ScrollView>

        {/* area for textinput and send button */}
        <View style={styles.input_box}>
          <TextInput
            value={this.state.msgInput}
            onChangeText={(msgInput) => this.setState({msgInput})}
            style={styles.input_text}>
          </TextInput>
          {/* send button */}
          <TouchableOpacity style={styles.send_btn} onPress={this.onSendMsg}>
            {/* icon here */}
            <Icon
              name="send"
              color="#ff5947"
              size={35}
              style={styles.send_icon}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#ff4781',
    paddingTop: 10,
  },
  message_view: {
    flex: 1,
    paddingHorizontal: 10,
  },
  input_box: {
    backgroundColor: '#ffffffdd',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    height: 70,
    padding: 10,
  },
  input_text: {
    borderWidth: 3,
    borderColor: 'green',
    flex: 3,
    borderRadius: 20,
    fontSize: 18,
    paddingLeft: 10,
    paddingRight: 10,
    fontFamily: 'Baloo Tamma 2',
    fontWeight: '600',
    paddingTop: 5,
  },
  send_btn: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
});
