import dgram from "dgram";
import protocol from "./musician-protocol.js"

const s = dgram.createSocket("udp4")
s.bind(protocol.PROTOCOL_PORT, function() {
    console.log("Joining multicast group")
    s.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS)
})

s.on('message', function(msg, source) {
	console.log("Data has arrived: " + msg + ". Source port: " + source.port);
});