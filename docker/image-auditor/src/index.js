import dgram from "dgram";
import protocol from "./musician-protocol.js"
import net from "net"

const socket = dgram.createSocket("udp4")
let musicians = new Map()

socket.bind(protocol.PROTOCOL_PORT, () => {
    console.log("Joining multicast group")
    socket.addMembership(protocol.PROTOCOL_MULTICAST_ADDRESS)
})

socket.on('message', function(msg, source) {
    const {uuid, sound} = JSON.parse(msg)

    let instrument = protocol.INSTRUMENTS.get(sound)
    let date = Date.now()

    if(!musicians.has(uuid)) {
        musicians.set(uuid, {uuid: uuid, instrument: instrument, activeSince: date, lastActive: date})
    } else {
        musicians.set(uuid, {uuid: uuid, instrument: instrument, activeSince: musicians.get(uuid).activeSince, lastActive: date})
    }

    console.log("Data has arrived " + msg + " Source port: " + source.port)
});

const server = net.createServer()
const PORT = 2205

server.listen(PORT, () => {
    console.log("TCP server is running on port " + PORT)
}).on('connection', (conn) => {
    console.log("CONNECTED: " + conn.remoteAddress + ":" + conn.remotePort)
    
    const now = Date.now()
    const res = Array.from(musicians.entries()).filter(([uuid, musician]) => {
        console.log("DELTA : ")
        console.log(now - musician.lastActive)
        let removed = now - musician.lastActive > protocol.PROTOCOL_TIMEOUT
        if(removed) {
            musicians.delete(uuid)
        }
        return !removed
    }).map(([uuid, musician]) => ({
        uuid,
        instrument: musician.instrument,
        activeSince: new Date(musician.activeSince) 
    }))
   
    conn.write(JSON.stringify(res))
    
    conn.end()
}).on('error', (conn) => {
    console.log;
});