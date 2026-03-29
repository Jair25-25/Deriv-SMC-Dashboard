import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, ColorType } from 'lightweight-charts';

export default function ChartComponent({ candles, liveCandle, orderBlocks }) {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const dataLoadedRef = useRef(false);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    let chart;
    try {
        if (!chartRef.current) {
            chart = createChart(chartContainerRef.current, {
              layout: {
                textColor: '#94a3b8',
                background: { type: ColorType.Solid, color: 'transparent' }
              },
              timeScale: {
                timeVisible: true,
                secondsVisible: false,
              }
            });

            const candlestickSeries = chart.addSeries(CandlestickSeries, {
              upColor: '#10b981',
              downColor: '#ef4444',
              borderVisible: false,
              wickUpColor: '#10b981',
              wickDownColor: '#ef4444',
            });

            chartRef.current = chart;
            candlestickSeriesRef.current = candlestickSeries;

            const handleResize = () => {
              if (chartContainerRef.current) {
                  chart.applyOptions({ width: chartContainerRef.current.clientWidth });
              }
            };
            window.addEventListener('resize', handleResize);
            
            return () => {
              window.removeEventListener('resize', handleResize);
              try {
                  chart.remove();
              } catch(e) {}
              chartRef.current = null;
              candlestickSeriesRef.current = null;
              dataLoadedRef.current = false;
            };
        }
    } catch (error) {
        console.error("FATAL ERROR CREATING CHART:", error);
    }
  }, []);

  // 1. Initial Set Data
  useEffect(() => {
    if (candlestickSeriesRef.current && candles.length > 0 && !dataLoadedRef.current) {
      try {
          candlestickSeriesRef.current.setData(candles);
          chartRef.current.timeScale().fitContent(); // Center camera immediately
          dataLoadedRef.current = true;
      } catch (e) {
          console.error("Error setting initial chart data:", e);
      }
    }
  }, [candles]);

  // 2. Live update on new tick data
  useEffect(() => {
    if (candlestickSeriesRef.current && liveCandle && dataLoadedRef.current) {
      try {
         // Lightweight charts throws an error if we update a time OLDER than the history
         const lastHistoryTime = candles[candles.length - 1]?.time || 0;
         if (liveCandle.time >= lastHistoryTime) {
             candlestickSeriesRef.current.update(liveCandle);
         }
      } catch (e) {
         console.warn("Error updating chart live candle:", e);
      }
    }
  }, [liveCandle, candles]);

  // 3. Mark SMC zones on the chart (Order Blocks)
  useEffect(() => {
     if (candlestickSeriesRef.current && orderBlocks && dataLoadedRef.current) {
         try {
             // Create markers for unmitigated order blocks
             const markers = [];
             orderBlocks.forEach(ob => {
                if (!ob.used) {
                    markers.push({
                        time: ob.time,
                        position: ob.type === 'BUY' ? 'belowBar' : 'aboveBar',
                        color: ob.type === 'BUY' ? '#10b981' : '#ef4444',
                        shape: ob.type === 'BUY' ? 'arrowUp' : 'arrowDown',
                        text: ob.type === 'BUY' ? 'DEMAND (BUY)' : 'SUPPLY (SELL)',
                        size: 2
                    });
                }
             });
             // Lightweight charts requires markers to be sorted by time
             markers.sort((a,b) => a.time - b.time);
             candlestickSeriesRef.current.setMarkers(markers);
         } catch (e) {
             console.warn("Error drawing markers:", e);
         }
     }
  }, [orderBlocks, candles]);

  // Reset when symbol changes
  useEffect(() => {
     dataLoadedRef.current = false;
  }, [candles]);

  return <div ref={chartContainerRef} className="tv-chart" />;
}
