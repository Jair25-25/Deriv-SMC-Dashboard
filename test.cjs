const WebSocket = require('ws');
const ws = new WebSocket("wss://ws.binaryws.com/websockets/v3?app_id=1089");
ws.on('open', () => {
  ws.send(JSON.stringify({
    ticks_history: "BOOM500",
    adjust_start_time: 1,
    count: 2,
    end: "latest",
    start: 1,
    style: "candles",
    granularity: 60,
    subscribe: 1
  }));
});
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  console.log(JSON.stringify(msg, null, 2));
  process.exit(0);
});
