import React from 'react';

export default function SignalBox({ signal, activePair, currentTick }) {
  if (!signal) {
    return (
      <div className="signal-box">
        <div className="signal-header">SCANNING MARKET</div>
        <div className="signal-title" style={{ color: 'var(--text-muted)' }}>M15 / H1</div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Analizando Order Blocks para {activePair}...
          <br/>Precio actual: {currentTick?.price || 'Loading...'}
        </p>
      </div>
    );
  }

  // Calculadora Matemática de Riesgo
  // Riesgo acordado: $12 (1% de la cuenta de $1200)
  const CAP_RISK = 12.0;

  // Calculamos la distancia del Stop Loss (Riesgo en Puntos)
  const pointRisk = Math.abs(signal.entry - signal.sl);
  
  // Lotaje = Dinero a arriesgar / Puntos en Contra
  // (Nota: Esta es la fórmula base para Boom/Crash 1 Lote = $1 x punto aprox)
  let calculatedLot = (CAP_RISK / (pointRisk || 1)).toFixed(2);
  
  // Restricciones de brocker (mínimo lotaje)
  if (calculatedLot < 0.20 && (activePair.includes('BOOM') || activePair.includes('CRASH'))) {
      if (activePair === 'BOOM500' || activePair === 'CRASH500' || activePair === 'BOOM1000' || activePair === 'CRASH1000') {
          calculatedLot = 0.20; // Lote mínimo standard
      }
  }

  return (
    <div className={`signal-box ${signal.type.toLowerCase()}`}>
      <div className="signal-header">ALERTA SMC VALIDADA</div>
      <h2 className="signal-title">{signal.type} {signal.asset}!</h2>
      
      <div className="signal-details">
        <div className="detail-row">
          <span className="detail-label">Entry Price</span>
          <span className="detail-value">{signal.entry.toFixed(3)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Stop Loss (SL)</span>
          <span className="detail-value" style={{ color: 'var(--neon-red)' }}>{signal.sl.toFixed(3)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Take Profit (TP)</span>
          <span className="detail-value" style={{ color: 'var(--neon-green)' }}>{signal.tp.toFixed(3)}</span>
        </div>
        
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
          <span className="detail-label" style={{ display: 'block', marginBottom: '0.5rem' }}>LOTAJE EXACTO (Riesgo $12)</span>
          <div className="lot-badge">{calculatedLot} Lotes</div>
        </div>
      </div>
    </div>
  );
}
