import { useState, useEffect, useRef } from 'react';

const APP_ID = 1089;
const WS_URL = `wss://ws.binaryws.com/websockets/v3?app_id=${APP_ID}`;
const ALL_PAIRS = ['BOOM1000', 'BOOM500', 'BOOM300N', 'CRASH1000', 'CRASH500', 'CRASH300N'];

// Service variables (Singleton pattern for background analysis)
let globalWs = null;
let globalOrderBlocks = {
    'BOOM1000': [], 'BOOM500': [], 'BOOM300N': [],
    'CRASH1000': [], 'CRASH500': [], 'CRASH300N': []
};
let globalSignals = [];
let subscribers = [];

function notifySubscribers() {
    subscribers.forEach(sub => sub());
}

// Function to calculate Order Blocks mathematically
function calculateOrderBlocks(candleData, sym) {
    const obList = [];
    const bodies = candleData.map(c => Math.abs(c.close - c.open));
    const avgBody = bodies.reduce((a, b) => a + b, 0) / bodies.length;

    for (let i = 1; i < candleData.length; i++) {
        const c = candleData[i];
        const prev = candleData[i-1];
        const body = Math.abs(c.close - c.open);
        
        // Spike condition > 3x average
        if (body > avgBody * 3) {
            if (c.close > c.open && sym.includes('BOOM')) { 
                obList.push({ type: 'BUY', low: prev.low, high: prev.high, time: prev.time, used: false });
            } else if (c.close < c.open && sym.includes('CRASH')) {
                obList.push({ type: 'SELL', low: prev.low, high: prev.high, time: prev.time, used: false });
            }
        }
    }
    // Keep last 5 valid OBs
    globalOrderBlocks[sym] = obList.slice(-5);
    notifySubscribers();
}

// Check signals against live ticks for ALL pairs
function processLiveTick(price, sym) {
    let fired = false;
    const obs = globalOrderBlocks[sym];
    if(obs) {
        obs.forEach(ob => {
            if (!ob.used) {
                if (ob.type === 'BUY' && (Math.abs(price - ob.high) <= 1.5 || (price >= ob.low && price <= ob.high))) {
                    const newSignal = { type: 'BUY', asset: sym, entry: price, sl: ob.low - 2, tp: price + 15 };
                    globalSignals.unshift(newSignal);
                    ob.used = true;
                    fired = true;
                } else if (ob.type === 'SELL' && (Math.abs(price - ob.low) <= 1.5 || (price >= ob.low && price <= ob.high))) {
                    const newSignal = { type: 'SELL', asset: sym, entry: price, sl: ob.high + 2, tp: price - 15 };
                    globalSignals.unshift(newSignal);
                    ob.used = true;
                    fired = true;
                }
            }
        });
        // Keep only top 10 most recent signals across all pairs
        if (globalSignals.length > 10) globalSignals = globalSignals.slice(0, 10);
        if (fired) notifySubscribers();
    }
}

// Initialize the global WebSocket
export function initGlobalWSS() {
    if (globalWs) return;

    globalWs = new WebSocket(WS_URL);

    globalWs.onopen = () => {
        console.log("Global Deriv WSS Connected!");
        // Request history for ALL PAIRS
        ALL_PAIRS.forEach(sym => {
            globalWs.send(JSON.stringify({
                ticks_history: sym,
                adjust_start_time: 1,
                count: 300,
                start: 1,
                end: "latest",
                style: "candles",
                granularity: 60,
                subscribe: 1 // Subscribe to live ticks automatically
            }));
        });
    };

    globalWs.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.error) {
            console.error("DERIV API ERROR:", data.error.message);
            return;
        }

        // Handle History Candles (Once per pair)
        if (data.msg_type === 'candles' && data.candles) {
            const sym = data.echo_req.ticks_history;
            let formatted = data.candles.map(c => ({
                time: parseInt(c.epoch),
                open: parseFloat(c.open),
                high: parseFloat(c.high),
                low: parseFloat(c.low),
                close: parseFloat(c.close)
            })).sort((a,b) => a.time - b.time);
            
            // Remove exact duplicates
            formatted = formatted.filter((v,i,a)=>a.findIndex(v2=>(v2.time===v.time))===i);

            calculateOrderBlocks(formatted, sym);
            
            // Store raw history array for the active hook to consume
            window[`DERIV_HISTORY_${sym}`] = formatted;
            notifySubscribers();
        }

        // Handle Live Candles
        if (data.msg_type === 'ohlc' && data.ohlc) {
            const ohlc = data.ohlc;
            const sym = data.echo_req.ticks_history || data.ohlc.symbol;
            if(!sym) return;
            
            const tickPrice = parseFloat(ohlc.close);
            
            const newCandle = {
                time: parseInt(ohlc.open_time),
                open: parseFloat(ohlc.open),
                high: parseFloat(ohlc.high),
                low: parseFloat(ohlc.low),
                close: tickPrice
            };
            
            // Save to window for specific pair fetching
            window[`DERIV_LIVE_${sym}`] = newCandle;
            
            processLiveTick(tickPrice, sym);
            notifySubscribers(); // Triggers React re-render for consumers
        }
    };
}


// React Hook to consume the Global WebSocket logic
export function useDeriv(activeSymbol) {
    const [candles, setCandles] = useState([]);
    const [liveCandle, setLiveCandle] = useState(null);
    const [currentTick, setCurrentTick] = useState(null);
    const [, setTick] = useState(0); // Forcing re-renders

    useEffect(() => {
        initGlobalWSS();

        const handleUpdate = () => {
            if (window[`DERIV_HISTORY_${activeSymbol}`]) {
                setCandles(window[`DERIV_HISTORY_${activeSymbol}`]);
            }
            if (window[`DERIV_LIVE_${activeSymbol}`]) {
                const lc = window[`DERIV_LIVE_${activeSymbol}`];
                setLiveCandle(lc);
                setCurrentTick({ time: lc.time, price: lc.close });
            }
            // Trigger a dummy state to re-render App whenever new signals come in
            setTick(prev => prev + 1); 
        };

        subscribers.push(handleUpdate);
        
        // Initial fetch if already loaded
        handleUpdate();

        return () => {
            subscribers = subscribers.filter(s => s !== handleUpdate);
        };
    }, [activeSymbol]);

    return { 
        candles, 
        liveCandle, 
        currentTick, 
        signals: globalSignals, 
        orderBlocks: globalOrderBlocks[activeSymbol] || [],
        allOrderBlocks: globalOrderBlocks 
    };
}
