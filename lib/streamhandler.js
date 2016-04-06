var fetch = require('node-fetch');

module.exports = function StreamHandler(){

    var streamsEndpoint = "http://bbc.services.radiodan.net/services.json"

    this.fetchStationStream = function( stationName, callback ){

        fetch( streamsEndpoint )
            .then(function(res) {
                return res.json();
            }).then(function(j) {
                var streamAddr = null;
                services = j["services"];
                for (var i = services.length - 1; i >= 0; i--) {
                    var service = ( services[i] );
                    if(service["id"] == stationName) {
                        streamAddr = service["playlist"];
                        break;
                    }
                }
                if( callback ){
                    callback( streamAddr );
                }
            });
        console.log( "play", stationName );
    }

}