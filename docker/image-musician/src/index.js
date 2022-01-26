import { v4 as uuidv4 } from 'uuid'

import dgram from 'dgram'
import protocol from './musician-protocol.js'

let instruments = new Map();
instruments.set("piano", "ti-ta-ti")
instruments.set("trumpet", "pouet")
instruments.set("flute", "trulu")
instruments.set("violin", "gzi-gzi")
instruments.set("drum", "boum-boum")

const s = dgram.createSocket("udp4")

let message = {
    uuid: uuidv4(),
    sound: instruments.get(process.argv[2])
};

let payload = JSON.stringify(message);

function sendSound() {
    s.send(payload, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, function(err, bytes) {
        console.log("Sending payload: " + payload + " via port " + s.address().port);
    });
}


setInterval(sendSound, 1000)
