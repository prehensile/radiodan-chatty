var express = require('express'),
  client = require('radiodan-client');

console.log('Hello');

/*
  Web
  This makes a web server available at
  localhost on the specified port, the
  default is 5000 so going to
  http://localhost:5000/ in a web browser
  will load `index.html` in ./static.
*/
var web = express(),
  port = process.env.WEB_PORT || process.env.PORT || 5000;

// Use the radiodan middleware to enable
// the web pages to send commands to this
// radio
web.use('/radiodan',
  client.middleware({
    crossOrigin: true
  })
);

// Make all files in ./static available to web
// pages
web.use(express.static(__dirname + '/static'));
web.listen(port);

console.log('Listening on port ' + port);

var radiodan = client.create();

// Get the player object called `main`
// as specified in ./config/radiodan-config.json
var player = radiodan.player.get('main');

// Listen for updates to the music database
// to make sure that we've loaded any
// audio files in `./audio` before we try
// and play them
player.on('database.update.start', function() {
  console.log('database.update.start');
});
player.on('database.update.end', function() {
  console.log('database.update.end');
  init();
});
player.on('database.modified', function() {
  console.log('database.update.modified');
});


// Tell the player to update it's database, discovering
// any audio files in the music directory specified in
// the config file.
player
  .updateDatabase();

/*
  General helper function to play a file or
  stream
*/
function play(fileOrStream) {
  console.log( "play:", fileOrStream )
  player.clear();
  player
    .add({
      playlist: [fileOrStream]
    })
    .then(player.play);
}

// Get the button and RGBLED called 'power'
// Defined in ./config/radiodan-pcb.json
var powerButton = radiodan.button.get('power');
var powerLED = radiodan.RGBLED.get('power');
var magicButton = radiodan.button.get('magic');
var magicLED = radiodan.RGBLED.get('magic');

// When the button is released, play the crowd
// and flash the LED green
powerButton.on('release', function() {
  // console.log('button was released');
  // play('crowd.mp3');
  // powerLED.emit({
  //   colour: [0, 255, 0],
  //   yoyo: true
  // });
});

// When the player stops playing then turn the
// LED off
player.on('player', function(player) {
  console.log('Player has changed', player);
  // if (player.state === 'play') {
  //   powerLED.emit({
  //     colour: [0, 255, 0]
  //   });
  // } else {
  //   powerLED.emit({
  //     colour: [255, 255, 255]
  //   });
  // }
});

// handler for bbc radio streams
var StreamHandler = require('./lib/streamhandler');
var streamHandler = new StreamHandler();

// handler for wit daemon
var WIT_TOKEN = "IQ77NWUPUMNBYEUEKRTWU3VDR5YSLHTA";
var WitdHandler = require('./lib/witdhandler');
var witdHandler = new WitdHandler( WIT_TOKEN );

// states
var _STATE = {
  "undefined" : "undefined",
  "starting"  : "starting", 
  "waiting"   : "waiting",  
  "prompting" : "prompting",
  "playing"   : "playing" 
}
var state = _STATE.undefined;

function changeState( newState ){

  console.log( "Change state: ", newState );

  if( newState == _STATE.starting ){
    
    // startup state!
    powerLED.emit({
      colour: [255, 0, 0]
    });
    magicLED.emit({
      colour: [255, 0, 0]
    });
    play( "i_live.mp3" );
  
  }
  else if( newState == _STATE.waiting ){

    // waiting state
    powerLED.emit({
      colour: [128, 128, 128]
    });
    magicLED.emit({
      colour: [0, 255, 0]
    });
  
  }
  else if( newState == _STATE.prompting ){

    play( "prompt.mp3" );
    magicLED.emit({
      colour: [0, 255, 0],
      yoyo: true
    });

    witdHandler.listenForIntent( function(intent){
      console.log( intent );
    });

  }

  // update state
  state = newState;

}

/* 
  handle player events. probably used to change state
*/
player.on('player', function(player) {
  
  if( player.state == 'stop') {
    
    if( state == _STATE.starting ) {
      changeState( _STATE.waiting );
    }

  }

});


/*
  handle button events. also used to change state
*/
magicButton.on('release', function() {
  
  if( state == _STATE.waiting ) {
    changeState( _STATE.prompting );  
  }

});


/* main startup */
function init(){
  changeState( _STATE.starting );
}

// streamHandler.fetchStationStream( "radio1", function(streamAddr){
//   console.log( streamAddr );
// });