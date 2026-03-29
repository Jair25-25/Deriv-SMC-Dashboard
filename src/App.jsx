import React, { useState } from 'react';
import './index.css';
import ChartComponent from './Chart';
import SignalBox from './SignalBox';
import { useDeriv } from './useDeriv';

const PAIRS = ['BOOM1000', 'BOOM500', 'BOOM300N', 'CRASH1000', 'CRASH500', 'CRASH300N'];

function TradingPlanTab() {
  return (
    <div style={{ padding: '2rem', color: '#e2e8f0', overflowY: 'auto', height: '100%' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--neon-green)' }}>📖 Plan de Trading Institucional SMC</h2>
      <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>1. Gestión de Capital</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
          <li><strong>Capital:</strong> $1,200 USD</li>
          <li><strong>Riesgo por Operación:</strong> 1% a 2% ($12 a $24 USD). Nunca más de esto en un solo Stop Loss.</li>
          <li><strong>Riesgo Máximo Total:</strong> 20% (Límite donde debes dejar de operar).</li>
        </ul>
      </div>

      <div style={{ background: 'var(--bg-panel)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>2. Smart Money Concepts</h3>
        <ul style={{ marginLeft: '1.5rem', lineHeight: '1.6' }}>
          <li><strong>Índices Boom:</strong> Operamos solo compras. Buscamos retrocesos lentos hacia bloques de órdenes (OB) alcistas que fueron creados por un Spike previo.</li>
          <li><strong>Índices Crash:</strong> Operamos solo ventas. Buscamos retrocesos lentos al alza hacia bloques de órdenes (OB) bajistas.</li>
          <li><strong>Confirmación:</strong> Nunca entrar a ciegas si el bloque de órdenes es de H1 o M15. Bajar a M1 y buscar un Cambio de Carácter (CHoCH) antes de presionar el gatillo.</li>
        </ul>
      </div>
    </div>
  );
}

function CalculatorTab() {
  const [balance, setBalance] = useState(1200);
  const [riskPercent, setRiskPercent] = useState(1);
  const [entry, setEntry] = useState('');
  const [stopLoss, setStopLoss] = useState('');

  const pointRisk = Math.abs(parseFloat(entry) - parseFloat(stopLoss)) || 0;
  const moneyRisk = balance * (riskPercent / 100);
  const lotSize = pointRisk > 0 ? (moneyRisk / pointRisk).toFixed(3) : 0;

  return (
    <div style={{ padding: '2rem', height: '100%', color: '#e2e8f0' }}>
      <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>🧮 Calculadora de Lotaje (Sintéticos)</h2>
      <div style={{ background: 'var(--bg-panel)', padding: '2rem', borderRadius: '8px', border: '1px solid var(--border-color)', maxWidth: '500px' }}>
        
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Capital de la Cuenta ($ USD):</label>
          <input type="number" value={balance} onChange={e=>setBalance(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>% de Riesgo a Asumir:</label>
          <input type="number" value={riskPercent} onChange={e=>setRiskPercent(e.target.value)} style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
          <small style={{ color: 'var(--neon-green)', marginTop: '0.2rem', display: 'block' }}>Arriesgando: ${moneyRisk} USD</small>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Precio de Entrada (Entry):</label>
          <input type="number" value={entry} onChange={e=>setEntry(e.target.value)} placeholder="Ej: 5275.500" style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Precio Stop Loss (SL):</label>
          <input type="number" value={stopLoss} onChange={e=>setStopLoss(e.target.value)} placeholder="Ej: 5265.500" style={{ width: '100%', padding: '0.8rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', color: '#fff' }} />
        </div>

        <div style={{ padding: '1.5rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--accent-blue)', borderRadius: '8px', textAlign: 'center' }}>
          <span style={{ display: 'block', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.5rem' }}>Lota Recomendado:</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{lotSize}</span>
        </div>

      </div>
    </div>
  )
}


function App() {
  const [activeTab, setActiveTab] = useState('GRÁFICOS'); // GRÁFICOS, PLAN, CALCULADORA
  const [activePair, setActivePair] = useState(PAIRS[1]); // Default BOOM500
  const { candles, liveCandle, currentTick, signals, orderBlocks } = useDeriv(activePair);

  const currentSignal = signals.find(s => s.asset === activePair);

  return (
    <div className="dashboard-container" style={{ gridTemplateRows: '70px 1fr' }}>
      {/* Header with Navigation */}
      <header className="header" style={{ display: 'grid', gridTemplateColumns: '250px 1fr 350px', gap: '1rem', padding: '0', background: 'transparent', border: 'none' }}>
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', padding: '0 1.5rem' }}>
            <h1 style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>Deriv SMC</h1>
        </div>
        
        {/* TAB Navigation */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '0 1rem' }}>
            {['GRÁFICOS', 'PLAN', 'CALCULADORA'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'none', border: 'none', color: activeTab === tab ? '#fff' : 'var(--text-muted)',
                  fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-blue)' : '2px solid transparent',
                  padding: '1rem 0'
                }}
              >
                {tab}
              </button>
            ))}
        </div>

        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 1.5rem' }}>
            {activeTab === 'GRÁFICOS' ? (
                <>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>Precio:</span>
                <span style={{ fontWeight: 600, color: 'var(--neon-green)' }}>{currentTick?.price || '...'}</span>
                </>
            ) : <span style={{ color: 'var(--text-muted)' }}>Panel Auxiliar</span>}
        </div>
      </header>

      {/* Conditional Rendering based on Tabs */}
      {activeTab === 'GRÁFICOS' && (
        <>
          {/* Sidebar - Pairs */}
          <aside className="sidebar glass-panel" style={{ gridColumn: '1 / 2' }}>
            <div style={{ paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              MERCADOS
            </div>
            {PAIRS.map(pair => (
              <button 
                key={pair}
                className={`pair-button ${activePair === pair ? 'active' : ''}`}
                onClick={() => setActivePair(pair)}
              >
                {pair}
              </button>
            ))}
          </aside>

          {/* Main Chart Area */}
          <main className="chart-area glass-panel" style={{ gridColumn: '2 / 3' }}>
            {candles.length === 0 ? (
              <div className="loading">Cargando datos institucionales WSS...</div>
            ) : (
              <ChartComponent candles={candles} liveCandle={liveCandle} />
            )}
          </main>

          {/* Right Sidebar - Signals */}
          <aside className="signal-area glass-panel" style={{ gridColumn: '3 / 4' }}>
             <div>
                 <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>SMC Hub</h2>
                 <SignalBox signal={currentSignal} activePair={activePair} currentTick={currentTick} />
             </div>

             <div style={{ marginTop: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                 <p><strong>Estrategia:</strong> Smart Money Concepts</p>
                 <p><strong>Riesgo Base:</strong> $12.00 por lote algorítmico.</p>
             </div>
          </aside>
        </>
      )}

      {activeTab === 'PLAN' && (
         <main className="glass-panel" style={{ gridColumn: '1 / -1' }}>
            <TradingPlanTab />
         </main>
      )}

      {activeTab === 'CALCULADORA' && (
         <main className="glass-panel" style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'center' }}>
            <CalculatorTab />
         </main>
      )}
      
    </div>
  );
}

export default App;
