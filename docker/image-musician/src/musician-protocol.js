const entries = [
    ["piano", "ti-ta-ti"],
    ["trumpet", "pouet"],
    ["flute", "trulu"],
    ["violin", "gzi-gzi"],
    ["drum", "boum-boum"]
]

export default {
    PROTOCOL_MULTICAST_ADDRESS: "239.255.22.5",
    PROTOCOL_PORT: 9907,
    INTERVAL: 5000,
    INSTRUMENTS: new Map(entries)
}