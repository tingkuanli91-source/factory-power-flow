import React from 'react';
import PowerFlowCard from './PowerFlowCard';

function App() {
  // 可通過 API 傳入的數據範例
  const apiData = {
    solar: { power: 498.0, unit: 'kW', label: '太陽能發電' },
    load: { power: 598.620, unit: 'kW', label: '工廠負載' },
    ess: { power: 39.620, unit: 'kW', label: '儲能系統', soc: 40 },
    grid: { power: 100.620, unit: 'kW', label: '市電' }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050A19',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{
        color: '#00D9FF',
        marginBottom: '30px',
        textAlign: 'center',
        textShadow: '0 0 20px rgba(0, 217, 255, 0.5)'
      }}>
        微電網功率流向卡
      </h1>
      
      <PowerFlowCard 
        data={apiData} 
        width={420} 
        height={380}
      />
      
      <div style={{
        marginTop: '30px',
        color: '#667788',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        <p>✅ 深藍黑色背景 (#050A19) + 科技青色強調色 (Cyan)</p>
        <p>✅ 等距視角 (Isometric) 3D 圖示</p>
        <p>✅ 流動動畫效果 + 數據更新感</p>
        <p>✅ SVG 整合 React 元件，可透過 API 傳入數值</p>
      </div>
    </div>
  );
}

export default App;
