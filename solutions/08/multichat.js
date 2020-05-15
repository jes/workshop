var hyperswarm = require('hyperswarm')
var hypercore = require('hypercore')
var multifeed = require('multifeed')
var crypto = require('crypto')
var pump = require('pump')

if (process.argv.length !== 3) {
  console.log('USAGE: "node multifeed.js 1" or "node multifeed.js 2"')
  process.exit(1)
  return
}
var num = process.argv[2]

// Creating topic
const topicHex = crypto.createHash('sha256')
		       .update('foobar-123')
		       .digest()

var multi = multifeed(hypercore, './multichat_' + num, {
  valueEncoding: 'json'
})

multi.writer('local', function (err, feed) {
  startSwarm(topicHex)

  process.stdin.on('data', function (data) {
    feed.append({
      type: 'chat-message',
      nickname: 'cat-lover',
      text: data.toString(),
      timestamp: new Date().toISOString()
    })
  })
})

function startSwarm (topic) {
  var swarm = hyperswarm()
  swarm.join(topic, {
    lookup: true, // find & connect to peers
    announce: true // optional- announce self as a connection target
  })
  swarm.on('connection', function (connection, info) {
    console.log('(New peer connected!)')
    pump(connection, multi.replicate(info.client, { live: true }), connection)
  })
}
