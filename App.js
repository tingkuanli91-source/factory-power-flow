import React, { useState, useEffect } from 'react';

// 工廠用電功率流向卡 - Factory Power Flow Card

// 發電類型配置
const POWER_TYPES = {
  // 來源（供電）
  taipower: { name: '台電', icon: '⚡', color: '#FFD700', type: 'source' },
  solar: { name: '太陽能', icon: '☀️', color: '#4CAF50', type: 'source' },
  battery: { name: '儲能系統', icon: '🔋', color: '#2196F3', type: 'storage' },
  
  // 負載（用電）
  factory: { name: '工廠', icon: '🏭', color: '#FF5722', type: 'load' },
  office: { name: '辦公區', icon: '🏢', color: '#9C27B0', type: 'load' },
  equipment: { name: '設備', icon: '⚙️', color: '#607D8B', type: 'load' },
};

// 方案配置
const SCHEMES = [
  {
    id: 'scheme1',
    name: '方案一：太陽能',
    sources: ['taipower', 'solar'],
    loads: ['factory', 'office', 'equipment'],
    hasBattery: false,
    description: '台電 + 太陽能發電系統',
  },
  {
    id: 'scheme2',
    name: '方案二：一體機',
    sources: ['taipower', 'solar'],
    loads: ['factory', 'office', 'equipment'],
    hasBattery: true,
    batteryType: 'all-in-one',
    description: '台電 + 太陽能 + 儲能一體機',
  },
  {
    id: 'scheme3',
    name: '方案三：分體式',
    sources: ['taipower', 'solar'],
    loads: ['factory', 'office', 'equipment'],
    hasBattery: true,
    batteryType: 'separate',
    description: '台電 + 太陽能 + 獨立儲能系統',
  },
];

// 模擬數據
const generatePowerData = (schemeId) => {
  const baseLoad = 150 + Math.random() * 100; // 基本負載 150-250 kW
  const solarPower = Math.random() * 120; // 太陽能發電 0-120 kW
  const batteryCharge = Math.random() * 50; // 儲能充電 0-50 kW
  
  let taipowerPower = baseLoad - solarPower;
  let batteryPower = 0;
  
  if (schemeId === 'scheme1') {
    // 只有太陽能
    taipowerPower = Math.max(0, baseLoad - solarPower);
  } else {
    // 有儲能
    if (solarPower > baseLoad) {
      // 太陽能過剩，優先充電
      const excess = solarPower - baseLoad;
      const actualCharge = Math.min(excess, batteryCharge);
      batteryPower = -actualCharge; // 負值 = 充電
      taipowerPower = 0;
    } else {
      // 太陽能不足，放電
      const deficit = baseLoad - solarPower;
      const actualDischarge = Math.min(deficit, batteryCharge * 0.8);
      batteryPower = actualDischarge; // 正值 = 放電
      taipowerPower = deficit - actualDischarge;
    }
  }
  
  return {
    taipower: Math.round(taipowerPower * 10) / 10,
    solar: Math.round(solarPower * 10) / 10,
    battery: Math.round(batteryPower * 10) / 10,
    factory: Math.round(baseLoad * 10) / 10,
    office: Math.round(baseLoad * 0.3 * 10) / 10,
    equipment: Math.round(baseLoad * 0.5 * 10) / 10,
  };
};

// 功率圓形元件
const PowerCircle = ({ type, power, isCompact = false }) => {
  const config = POWER_TYPES[type];
  const isSource = config.type === 'source';
  const isStorage = config.type === 'storage';
  const isLoad = config.type === 'load';
  
  const isCharging = isStorage && power < 0;
  const displayPower = isCharging ? Math.abs(power) : power;
  
  return (
    <div style={{
      ...styles.circle,
      backgroundColor: isCompact ? 'rgba(255,255,255,0.1)' : config.color,
      borderColor: config.color,
      width: isCompact ? 80 : 120,
      height: isCompact ? 80 : 120,
    }}>
      <div style={{ fontSize: isCompact ? 24 : 36 }}>{config.icon}</div>
      <div style={{ 
        fontSize: isCompact ? 12 : 14, 
        fontWeight: 'bold',
        color: isCompact ? '#fff' : (config.type === 'load' ? '#fff' : '#333'),
        marginTop: 4 
      }}>
        {config.name}
      </div>
      <div style={{ 
        fontSize: isCompact ? 14 : 18, 
        fontWeight: 'bold',
        color: isCompact ? config.color : (config.type === 'load' ? '#fff' : '#333'),
      }}>
        {displayPower.toFixed(1)} <span style={{ fontSize: 10 }}>kW</span>
      </div>
      {isStorage && (
        <div style={{ 
          fontSize: 10, 
          color: isCompact ? '#aaa' : '#333,
        }}>
          {isCharging ? '⚡ 充電中' : power > 0 ? '🔓 放電中' : '待機'}
        </div>
      )}
    </div>
  );
};

// 流向線元件
const FlowLine = ({ from, to, power, color, isActive = true }) => {
  if (!isActive || power <= 0) return null;
  
  const flowWidth = Math.min(Math.max(power / 50, 2), 12);
  
  return (
    <div style={{
      ...styles.flowLine,
      backgroundColor: color,
      width: flowWidth,
    }}>
      <div style={{
        ...styles.flowDot,
        backgroundColor: color,
        animationDuration: `${Math.max(6 - power / 30, 2)}s`,
      }} />
    </div>
  );
};

// 方案選擇卡片
const SchemeCard = ({ scheme, isSelected, onClick, powerData }) => {
  const hasSolar = scheme.sources.includes('solar');
  const hasBattery = scheme.hasBattery;
  
  return (
    <div 
      onClick={onClick}
      style={{
        ...styles.schemeCard,
        borderColor: isSelected ? '#FFD700' : '#333',
        backgroundColor: isSelected ? 'rgba(255,215,0,0.1)' : 'rgba(255,255,255,0.05)',
      }}
    >
      <div style={styles.schemeName}>{scheme.name}</div>
      <div style={styles.schemeDesc}>{scheme.description}</div>
      
      <div style={styles.schemeIcons}>
        <span style={{ fontSize: 24 }}>⚡ 台電</span>
        {hasSolar && <span style={{ fontSize: 24 }}>☀️ 太陽能</span>}
        {hasBattery && <span style={{ fontSize: 24 }}>🔋 儲能</span>}
        <span style={{ fontSize: 24 }}>🏭 工廠</span>
      </div>
      
      {powerData && isSelected && (
        <div style={styles.schemePower}>
          <div>台電: {powerData.taipower} kW</div>
          {hasSolar && <div>太陽能: {powerData.solar} kW</div>}
          {hasBattery && <div>儲能: {powerData.battery} kW</div>}
        </div>
      )}
    </div>
  );
};

// 主應用
export default function FactoryPowerFlow() {
  const [selectedScheme, setSelectedScheme] = useState('scheme1');
  const [powerData, setPowerData] = useState(generatePowerData('scheme1'));
  const [autoUpdate, setAutoUpdate] = useState(true);
  
  // 自動更新功率數據
  useEffect(() => {
    if (!autoUpdate) return;
    
    const interval = setInterval(() => {
      setPowerData(generatePowerData(selectedScheme));
    }, 3000);
    
    return () => clearInterval(interval);
  }, [selectedScheme, autoUpdate]);
  
  const currentScheme = SCHEMES.find(s => s.id === selectedScheme);
  
  // 計算總用電
  const totalLoad = powerData.factory + powerData.office + powerData.equipment;
  const totalSupply = powerData.taipower + powerData.solar + (powerData.battery > 0 ? powerData.battery : 0);
  const solarUsage = powerData.solar > 0 ? ((powerData.solar / totalLoad) * 100).toFixed(1) : 0;
  const selfConsumption = powerData.solar > 0 && powerData.taipower === 0 ? '100%' : 
    powerData.solar > 0 ? ((powerData.solar / totalLoad) * 100).toFixed(1) + '%' : '0%';
  
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🏭 工廠用電功率流向圖</h1>
        <p style={styles.subtitle}>Factory Power Flow Monitoring</p>
      </div>
      
      {/* 方案選擇 */}
      <div style={styles.schemeSelector}>
        {SCHEMES.map(scheme => (
          <SchemeCard
            key={scheme.id}
            scheme={scheme}
            isSelected={selectedScheme === scheme.id}
            onClick={() => setSelectedScheme(scheme.id)}
            powerData={selectedScheme === scheme.id ? powerData : null}
          />
        ))}
      </div>
      
      {/* 功率流向圖 */}
      <div style={styles.flowDiagram}>
        {/* 頂部：供電來源 */}
        <div style={styles.topRow}>
          {/* 台電 */}
          <div style={styles.sourceGroup}>
            <PowerCircle type="taipower" power={powerData.taipower} />
            {powerData.taipower > 0 && (
              <div style={styles.flowArrow}>
                <span style={styles.flowArrowText}>供電中</span>
                <div style={styles.flowArrowLine} />
              </div>
            )}
          </div>
          
          {/* 太陽能 */}
          {currentScheme.sources.includes('solar') && (
            <div style={styles.sourceGroup}>
              <PowerCircle type="solar" power={powerData.solar} />
              {powerData.solar > 0 && (
                <div style={styles.flowArrow}>
                  <span style={styles.flowArrowText}>發電中</span>
                  <div style={styles.flowArrowLine} />
                </div>
              )}
            </div>
          )}
          
          {/* 儲能系統 */}
          {currentScheme.hasBattery && (
            <div style={styles.sourceGroup}>
              <PowerCircle type="battery" power={powerData.battery} />
              {powerData.battery !== 0 && (
                <div style={styles.flowArrow}>
                  <span style={styles.flowArrowText}>{powerData.battery < 0 ? '充电中' : '放電中'}</span>
                  <div style={styles.flowArrowLine} />
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* 中間：流向指示 */}
        <div style={styles.middleSection}>
          <div style={styles.flowIndicator}>
            <div style={styles.flowArrowDown}>⬇️ 電力流向</div>
          </div>
        </div>
        
        {/* 底部：負載 */}
        <div style={styles.bottomRow}>
          <PowerCircle type="factory" power={powerData.factory} />
          <PowerCircle type="office" power={powerData.office} />
          <PowerCircle type="equipment" power={powerData.equipment} />
        </div>
      </div>
      
      {/* 統計資訊 */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statValue}>{totalLoad.toFixed(1)} kW</div>
          <div style={styles.statLabel}>總用電功率</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>☀️</div>
          <div style={styles.statValue}>{solarUsage}%</div>
          <div style={styles.statLabel}>太陽能佔比</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏠</div>
          <div style={styles.statValue}>{selfConsumption}</div>
          <div style={styles.statLabel}>自發自用率</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue}>{(totalLoad * 4 * 24 / 1000).toFixed(1)}</div>
          <div style={styles.statLabel}>每日預估度數</div>
        </div>
      </div>
      
      {/* 控制項 */}
      <div style={styles.controls}>
        <label style={styles.checkbox}>
          <input 
            type="checkbox" 
            checked={autoUpdate} 
            onChange={(e) => setAutoUpdate(e.target.checked)}
          />
          自動更新數據 (3秒)
        </label>
        <button 
          style={styles.refreshBtn}
          onClick={() => setPowerData(generatePowerData(selectedScheme))}
        >
          🔄 重新整理
        </button>
      </div>
      
      {/* 說明 */}
      <div style={styles.info}>
        <h3 style={styles.infoTitle}>💡 方案說明</h3>
        <div style={styles.infoContent}>
          <p><strong>方案一：太陽能</strong> - 只安裝太陽能板，白天發電可供工廠使用，多餘賣回台電</p>
          <p><strong>方案二：一體機</strong> - 太陽能+儲能整合系統，白天發電儲存，晚上放電使用</p>
          <p><strong>方案三：分體式</strong> - 獨立太陽能與儲能系統，可彈性擴充容量</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0a0a0f',
    fontFamily: "'Microsoft JhengHei', 'Noto Sans TC', Arial, sans-serif",
    padding: '20px',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    marginBottom: '10px',
    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
  },
  schemeSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  schemeCard: {
    padding: '15px 20px',
    borderRadius: '12px',
    border: '2px solid #333',
    cursor: 'pointer',
    transition: 'all 0.3s',
    minWidth: '200px',
  },
  schemeName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '5px',
  },
  schemeDesc: {
    fontSize: '12px',
    color: '#aaa',
    marginBottom: '10px',
  },
  schemeIcons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  schemePower: {
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #333',
    fontSize: '12px',
    color: '#4CAF50',
  },
  flowDiagram: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    position: 'relative',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    flexWrap: 'wrap',
  },
  sourceGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  middleSection: {
    padding: '20px 0',
    textAlign: 'center',
  },
  flowIndicator: {
    color: '#666',
    fontSize: '12px',
  },
  flowArrow: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '10px',
  },
  flowArrowText: {
    fontSize: '10px',
    color: '#4CAF50',
    marginBottom: '5px',
  },
  flowArrowLine: {
    width: '2px',
    height: '20px',
    backgroundColor: '#4CAF50',
  },
  bottomRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    flexWrap: 'wrap',
  },
  circle: {
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  flowLine: {
    position: 'absolute',
    height: '4px',
    borderRadius: '2px',
  },
  flowDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    position: 'absolute',
    animation: 'flow 2s infinite linear',
  },
  statsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '15px',
    justifyContent: 'center',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '15px 25px',
    textAlign: 'center',
    minWidth: '120px',
  },
  statIcon: {
    fontSize: '24px',
    marginBottom: '5px',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: '12px',
    color: '#aaa',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#aaa',
    cursor: 'pointer',
  },
  refreshBtn: {
    padding: '8px 20px',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '8px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  info: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '12px',
    padding: '20px',
  },
  infoTitle: {
    color: '#FFD700',
    marginBottom: '15px',
  },
  infoContent: {
    fontSize: '14px',
    lineHeight: '1.8',
    color: '#aaa',
  },
};
