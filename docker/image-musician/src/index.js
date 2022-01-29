import { v4 as uuidv4 } from 'uuid'

import dgram from 'dgram'
import protocol from './musician-protocol.js'

const s = dgram.createSocket("udp4")

let message = {
    uuid: uuidv4(),
    sound: protocol.INSTRUMENTS.get(process.argv[2])
};

let payload = JSON.stringify(message);

function sendSound() {
    s.send(payload, protocol.PROTOCOL_PORT, protocol.PROTOCOL_MULTICAST_ADDRESS, () => {
        console.log("Sending payload: " + payload + " via port " + s.address().port);
    });
}

setInterval(sendSound, protocol.INTERVAL)