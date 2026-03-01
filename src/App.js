import React, { useState, useEffect, useCallback, useRef } from 'react';

// 發電/用電類型配置
const POWER_TYPES = {
  // 來源（供電）
  taipower: { name: '台電', icon: '⚡', color: '#FFD700', type: 'source' },
  solar: { name: '太陽能', icon: '☀️', color: '#4CAF50', type: 'source' },
  allInOne: { name: '一體機', icon: '🔗', color: '#00BCD4', type: 'all-in-one' },
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
    hasAllInOne: false,
    description: '台電 + 太陽能發電系統',
  },
  {
    id: 'scheme2',
    name: '方案二：一體機',
    sources: ['taipower', 'allInOne'],
    loads: ['factory', 'office', 'equipment'],
    hasBattery: false,
    hasAllInOne: true,
    description: '台電 + 太陽能一體機(含儲能)',
  },
  {
    id: 'scheme3',
    name: '方案三：分體式',
    sources: ['taipower', 'solar', 'battery'],
    loads: ['factory', 'office', 'equipment'],
    hasBattery: true,
    hasAllInOne: false,
    description: '台電 + 太陽能 + 獨立儲能系統',
  },
];
const generatePowerData = (schemeId, manualData = null) => {
  // 如果有手動數據優先使用（未來 API 串接用）
  if (manualData) return manualData;
  
  const hour = new Date().getHours();
  const isDaytime = hour >= 6 && hour <= 18;
  
  // 基礎負載
  const baseLoad = 150 + Math.random() * 100;
  
  // 太陽能發電（白天較強）
  let solarPower = 0;
  if (isDaytime) {
    solarPower = Math.random() * 120 * (Math.sin((hour - 6) * Math.PI / 12));
    solarPower = Math.max(0, solarPower);
  }
  
  // 儲能充放電
  const batteryCapacity = 50;
  const batteryCharge = Math.random() * batteryCapacity;
  
  let taipowerPower = 0;
  let batteryPower = 0;
  let allInOnePower = 0;
  let solarToBattery = 0;
  let solarToLoad = 0;
  let batteryToLoad = 0;
  let taipowerToLoad = 0;
  
  if (schemeId === 'scheme1') {
    // 只有太陽能
    taipowerPower = Math.max(0, baseLoad - solarPower);
    solarToLoad = Math.min(solarPower, baseLoad);
  } else if (schemeId === 'scheme2') {
    // 一體機模式：太陽能→一體機→負載 或 直接供電
    const totalSolar = solarPower;
    
    // 太陽能優先供應負載
    if (totalSolar >= baseLoad) {
      // 太陽能過剩
      solarToLoad = baseLoad;
      solarToBattery = (totalSolar - baseLoad) * 0.8; // 80%充電
      allInOnePower = solarToBattery; // 一體機輸出
      taipowerPower = 0;
    } else {
      // 太陽能不足
      solarToLoad = totalSolar;
      const deficit = baseLoad - totalSolar;
      
      // 一體機放電
      const discharge = Math.min(deficit, batteryCharge * 0.9);
      allInOnePower = -discharge; // 負值=從儲能放電
      batteryToLoad = discharge;
      taipowerPower = deficit - discharge;
    }
  } else {
    // 分體式：太陽能與儲能分開
    if (solarPower >= baseLoad) {
      solarToLoad = baseLoad;
      solarToBattery = (solarPower - baseLoad) * 0.8;
      batteryPower = -solarToBattery; // 充電
      taipowerPower = 0;
    } else {
      solarToLoad = solarPower;
      const deficit = baseLoad - solarPower;
      const discharge = Math.min(deficit, batteryCharge * 0.9);
      batteryPower = discharge; // 放電
      batteryToLoad = discharge;
      taipowerPower = deficit - discharge;
    }
  }
  
  return {
    taipower: Math.round(taipowerPower * 10) / 10,
    solar: Math.round(solarPower * 10) / 10,
    battery: Math.round(batteryPower * 10) / 10,
    allInOne: Math.round(allInOnePower * 10) / 10,
    solarToBattery: Math.round(solarToBattery * 10) / 10,
    solarToLoad: Math.round(solarToLoad * 10) / 10,
    batteryToLoad: Math.round(batteryToLoad * 10) / 10,
    taipowerToLoad: Math.round(taipowerPower * 10) / 10,
    factory: Math.round(baseLoad * 10) / 10,
    office: Math.round(baseLoad * 0.3 * 10) / 10,
    equipment: Math.round(baseLoad * 0.5 * 10) / 10,
    timestamp: new Date().toISOString(),
  };
};

// 功率圓形元件
const PowerCircle = ({ type, power, isCompact = false, showStatus = '' }) => {
  const config = POWER_TYPES[type];
  if (!config) return null;
  
  const isSource = config.type === 'source';
  const isStorage = config.type === 'storage';
  const isAllInOne = config.type === 'all-in-one';
  const isLoad = config.type === 'load';
  
  const isCharging = isStorage && power < 0;
  const displayPower = Math.abs(power);
  
  // 一體機狀態
  let statusText = showStatus;
  if (isAllInOne && power !== 0) {
    statusText = power < 0 ? '⚡ 充電中' : '🔓 放電中';
  } else if (isStorage && power !== 0) {
    statusText = isCharging ? '⚡ 充電中' : '🔓 放電中';
  }
  
  return (
    <div style={{
      ...styles.circle,
      backgroundColor: isCompact ? 'rgba(255,255,255,0.1)' : config.color,
      borderColor: config.color,
      width: isCompact ? 70 : 100,
      height: isCompact ? 70 : 100,
    }}>
      <div style={{ fontSize: isCompact ? 20 : 28 }}>{config.icon}</div>
      <div style={{ 
        fontSize: isCompact ? 10 : 12, 
        fontWeight: 'bold',
        color: isCompact ? '#fff' : (isLoad || isAllInOne ? '#fff' : '#333'),
        marginTop: 2 
      }}>
        {config.name}
      </div>
      <div style={{ 
        fontSize: isCompact ? 12 : 16, 
        fontWeight: 'bold',
        color: isCompact ? config.color : (isLoad || isAllInOne ? '#fff' : '#333'),
      }}>
        {displayPower.toFixed(1)} <span style={{ fontSize: 8 }}>kW</span>
      </div>
      {statusText && (
        <div style={{ fontSize: 8, color: isCompact ? '#aaa' : (isLoad || isAllInOne ? '#ddd' : '#666') }}>
          {statusText}
        </div>
      )}
    </div>
  );
};

// 電力流向線元件
const FlowLine = ({ from, to, power, color, flowType = 'normal', fromPos = 'left', toPos = 'right' }) => {
  if (power === null || power === undefined || power <= 0) return null;
  
  const thickness = Math.min(Math.max(power / 30, 2), 10);
  
  // 不同流向類型
  let dashStyle = 'none';
  let animationDuration = '2s';
  if (flowType === 'solar') {
    animationDuration = '1.5s'; // 太陽能比較快
  } else if (flowType === 'battery') {
    animationDuration = '2.5s'; // 儲能比較慢
  }
  
  // 水平流向樣式
  const isHorizontal = fromPos === 'left' || fromPos === 'right';
  
  const lineStyle = {
    position: 'absolute',
    backgroundColor: color,
    opacity: 0.8,
    borderRadius: thickness / 2,
  };
  
  // 動畫點
  const dotStyle = {
    position: 'absolute',
    width: Math.max(thickness * 1.5, 6),
    height: Math.max(thickness * 1.5, 6),
    backgroundColor: color,
    borderRadius: '50%',
    boxShadow: `0 0 8px ${color}`,
    animation: `flowMove ${animationDuration} infinite linear`,
  };
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
      {/* 主線 */}
      <div style={{
        ...lineStyle,
        top: '50%',
        left: fromPos === 'left' ? '15%' : '35%',
        right: toPos === 'right' ? '15%' : '35%',
        height: thickness,
        transform: 'translateY(-50%)',
      }}>
        {/* 流動動畫點 */}
        <div style={{
          ...dotStyle,
          left: '10%',
          animationDelay: '0s',
        }} />
        <div style={{
          ...dotStyle,
          left: '40%',
          animationDelay: '0.5s',
        }} />
        <div style={{
          ...dotStyle,
          left: '70%',
          animationDelay: '1s',
        }} />
      </div>
      
      {/* 功率標籤 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '2px 8px',
        borderRadius: '10px',
        fontSize: '11px',
        fontWeight: 'bold',
        color: color,
        whiteSpace: 'nowrap',
      }}>
        {power.toFixed(1)} kW
      </div>
    </div>
  );
};

// 垂直流向線（太陽能→一體機）
const VerticalFlowLine = ({ power, color, direction = 'down' }) => {
  if (!power || power <= 0) return null;
  
  const thickness = Math.min(Math.max(power / 20, 2), 8);
  
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      top: direction === 'down' ? 'calc(100% + 5px)' : 'auto',
      bottom: direction === 'down' ? 'auto' : 'calc(100% + 5px)',
      width: thickness,
      height: '40px',
      backgroundColor: color,
      opacity: 0.8,
      borderRadius: thickness / 2,
    }}>
      {/* 動畫點 */}
      <div style={{
        position: 'absolute',
        width: Math.max(thickness * 1.5, 5),
        height: Math.max(thickness * 1.5, 5),
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 6px ${color}`,
        left: '50%',
        top: direction === 'down' ? '20%' : '60%',
        transform: 'translateX(-50%)',
        animation: direction === 'down' ? 'flowDown 1.5s infinite linear' : 'flowUp 1.5s infinite linear',
      }} />
      <div style={{
        position: 'absolute',
        width: Math.max(thickness * 1.5, 5),
        height: Math.max(thickness * 1.5, 5),
        backgroundColor: color,
        borderRadius: '50%',
        boxShadow: `0 0 6px ${color}`,
        left: '50%',
        top: direction === 'down' ? '60%' : '20%',
        transform: 'translateX(-50%)',
        animation: direction === 'down' ? 'flowDown 1.5s infinite linear' : 'flowUp 1.5s infinite linear',
        animationDelay: '0.7s',
      }} />
    </div>
  );
};

// 方案選擇卡片
const SchemeCard = ({ scheme, isSelected, onClick, powerData }) => {
  const hasSolar = scheme.sources.includes('solar') || scheme.hasAllInOne;
  const hasBattery = scheme.hasBattery || scheme.hasAllInOne;
  const hasAllInOne = scheme.hasAllInOne;
  
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
      
      {powerData && isSelected && (
        <div style={styles.schemePower}>
          <div>台電: {powerData.taipower} kW</div>
          {hasSolar && <div>太陽能: {powerData.solar} kW</div>}
          {hasAllInOne && <div>一體機: {powerData.allInOne} kW</div>}
          {hasBattery && !hasAllInOne && <div>儲能: {powerData.battery} kW</div>}
        </div>
      )}
    </div>
  );
};

// API 配置（未來串接用）
const API_CONFIG = {
  enabled: false, // 目前為模擬模式
  endpoints: {
    taipower: 'https://api.taipower.com.tw/power', // 範例
    solar: 'https://api.solar-monitor.com/power',
    battery: 'https://api.battery-system.com/status',
    load: 'https://api.factory-meter.com/load',
  },
  pollingInterval: 5000, // 毫秒
};

// 主應用
export default function FactoryPowerFlow() {
  const [selectedScheme, setSelectedScheme] = useState('scheme2');
  const [powerData, setPowerData] = useState(() => generatePowerData('scheme2'));
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [apiStatus, setApiStatus] = useState({ connected: false, lastUpdate: null });
  
  const intervalRef = useRef(null);
  
  // 獲取數據（未來可串接 API）
  const fetchPowerData = useCallback(async () => {
    // 未來串接 API 範例：
    // if (API_CONFIG.enabled) {
    //   try {
    //     const [taipower, solar, battery, load] = await Promise.all([
    //       fetch(API_CONFIG.endpoints.taipower).then(r => r.json()),
    //       fetch(API_CONFIG.endpoints.solar).then(r => r.json()),
    //       fetch(API_CONFIG.endpoints.battery).then(r => r.json()),
    //       fetch(API_CONFIG.endpoints.load).then(r => r.json()),
    //     ]);
    //     return { taipower, solar, battery, load, ... };
    //   } catch (e) {
    //     console.error('API Error:', e);
    //   }
    // }
    
    // 目前使用模擬數據
    return generatePowerData(selectedScheme);
  }, [selectedScheme]);
  
  // 自動更新功率數據
  useEffect(() => {
    if (!autoUpdate) return;
    
    intervalRef.current = setInterval(async () => {
      const newData = await fetchPowerData();
      setPowerData(newData);
      setApiStatus({ connected: API_CONFIG.enabled, lastUpdate: new Date() });
    }, API_CONFIG.pollingInterval);
    
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoUpdate, fetchPowerData]);
  
  const currentScheme = SCHEMES.find(s => s.id === selectedScheme);
  
  // 計算總用電
  const totalLoad = powerData.factory + powerData.office + powerData.equipment;
  const totalSupply = powerData.taipower + powerData.solar + (powerData.allInOne > 0 ? powerData.allInOne : 0) + (powerData.battery > 0 ? powerData.battery : 0);
  const solarUsage = powerData.solar > 0 ? ((powerData.solar / (totalLoad || 1)) * 100).toFixed(1) : 0;
  const selfConsumption = powerData.solar > 0 && powerData.taipower === 0 ? '100%' : 
    powerData.solar > 0 ? ((powerData.solar / (totalLoad || 1)) * 100).toFixed(1) + '%' : '0%';
  
  // 獲取一體機狀態
  const getAllInOneStatus = () => {
    if (!currentScheme.hasAllInOne) return '';
    if (powerData.allInOne < 0) return '⚡ 儲能中';
    if (powerData.allInOne > 0) return '🔓 供電中';
    return '';
  };
  
  return (
    <div style={styles.container}>
      <style>{`
        @keyframes flowMove {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0.3; }
        }
        @keyframes flowDown {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(30px); opacity: 0.3; }
        }
        @keyframes flowUp {
          0% { transform: translateX(-50%) translateY(0); opacity: 1; }
          100% { transform: translateX(-50%) translateY(-30px); opacity: 0.3; }
        }
      `}</style>
      
      <div style={styles.header}>
        <h1 style={styles.title}>🏭 工廠用電功率流向圖</h1>
        <p style={styles.subtitle}>Factory Power Flow Monitoring</p>
      </div>
      
      {/* API 狀態 */}
      <div style={styles.apiStatus}>
        <span style={{ color: apiStatus.connected ? '#4CAF50' : '#666' }}>
          {apiStatus.connected ? '🟢 API 已連接' : '🔴 模擬模式'}
        </span>
        {apiStatus.lastUpdate && (
          <span style={{ marginLeft: 10, fontSize: 10, color: '#888' }}>
            更新: {apiStatus.lastUpdate.toLocaleTimeString()}
          </span>
        )}
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
      
      {/* 功率流向圖 - 優化版 */}
      <div style={styles.flowDiagram}>
        {/* 左側：太陽能 */}
        {currentScheme.hasAllInOne && (
          <div style={styles.solarSection}>
            <PowerCircle type="solar" power={powerData.solar} />
            {powerData.solarToLoad > 0 && (
              <div style={styles.solarArrow}>
                <span>→</span>
              </div>
            )}
          </div>
        )}
        
        {/* 中間：供電單元區域 */}
        <div style={styles.middleSection}>
          {/* 台電在上方 */}
          <div style={styles.taipowerSection}>
 type="taipower" power={powerData.taipower} />
          </div>
          
          {/* 一體機在中間（方案二） */}
          {current            <PowerCircleScheme.hasAllInOne && (
            <div style={styles.allInOneSection}>
              <PowerCircle type="allInOne" power={powerData.allInOne} showStatus={getAllInOneStatus()} />
              {/* 太陽能連接到一體機 */}
              {powerData.solarToBattery > 0 && (
                <div style={styles.verticalFlow}>
                  <VerticalFlowLine power={powerData.solarToBattery} color="#4CAF50" direction="down" />
                  <div style={styles.verticalLabel}>{powerData.solarToBattery.toFixed(1)} kW</div>
                </div>
              )}
            </div>
          )}
          
          {/* 分離式儲能在方案三 */}
          {currentScheme.hasBattery && !currentScheme.hasAllInOne && (
            <div style={styles.batterySection}>
              <PowerCircle type="battery" power={powerData.battery} />
            </div>
          )}
        </div>
        
        {/* 電力流向線（台電/一體機 → 負載） */}
        <div style={styles.flowLines}>
          {/* 台電流向 */}
          {powerData.taipowerToLoad > 0 && (
            <FlowLine 
              from="taipower" 
              to="load" 
              power={powerData.taipowerToLoad} 
              color="#FFD700" 
              fromPos="left" 
              toPos="right"
            />
          )}
          
          {/* 一體機/太陽能流向 */}
          {(powerData.solarToLoad > 0 || powerData.allInOne > 0) && (
            <FlowLine 
              from="solar/allInOne" 
              to="load" 
              power={powerData.solarToLoad + (powerData.allInOne > 0 ? powerData.allInOne : 0)} 
              color="#00BCD4" 
              fromPos="left" 
              toPos="right"
            />
          )}
          
          {/* 儲能流向（方案三） */}
          {currentScheme.hasBattery && !currentScheme.hasAllInOne && powerData.batteryToLoad > 0 && (
            <FlowLine 
              from="battery" 
              to="load" 
              power={powerData.batteryToLoad} 
              color="#2196F3" 
              fromPos="left" 
              toPos="right"
            />
          )}
        </div>
        
        {/* 底部：負載區域 */}
        <div style={styles.loadSection}>
          <PowerCircle type="factory" power={powerData.factory} />
          <PowerCircle type="office" power={powerData.office} />
          <PowerCircle type="equipment" power={powerData.equipment} />
        </div>
        
        {/* 負載總計 */}
        <div style={styles.totalLoad}>
          <div style={styles.totalLoadLabel}>總負載</div>
          <div style={styles.totalLoadValue}>{totalLoad.toFixed(1)} kW</div>
        </div>
      </div>
      
      {/* 統計資訊 */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚡</div>
          <div style={styles.statValue}>{totalLoad.toFixed(1)}</div>
          <div style={styles.statLabel}>總用電(kW)</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>☀️</div>
          <div style={styles.statValue}>{solarUsage}%</div>
          <div style={styles.statLabel}>太陽能佔比</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🏠</div>
          <div style={styles.statValue}>{selfConsumption}</div>
          <div style={styles.statLabel}>自發自用</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statValue}>{(totalLoad * 4 * 24 / 1000).toFixed(1)}</div>
          <div style={styles.statLabel}>每日度數</div>
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
          自動更新 ({API_CONFIG.pollingInterval/1000}秒)
        </label>
        <button 
          style={styles.refreshBtn}
          onClick={() => fetchPowerData().then(setPowerData)}
        >
          🔄 重新整理
        </button>
      </div>
      
      {/* 說明 */}
      <div style={styles.info}>
        <h3 style={styles.infoTitle}>💡 方案說明</h3>
        <div style={styles.infoContent}>
          <p><strong>方案一：太陽能</strong> - 只安裝太陽能板，白天發電可供工廠使用，多餘賣回台電</p>
          <p><strong>方案二：一體機</strong> - 太陽能→一體機(含儲能)→負載，可智能調度電力</p>
          <p><strong>方案三：分體式</strong> - 獨立太陽能與儲能系統，可彈性擴充容量</p>
        </div>
        <h4 style={{...styles.infoTitle, marginTop: 15}}>🔌 未來 API 串接</h4>
        <div style={styles.apiInfo}>
          <p>系統預留 API 串接介面，可連接：</p>
          <ul style={{ margin: '5px 0', paddingLeft: 20 }}>
            <li>台電智慧電表 API (Taiwan Power Company)</li>
            <li>太陽能逆變器監控 API</li>
            <li>儲能系統 BMS API</li>
            <li>工廠用電監測 API</li>
          </ul>
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
    padding: '15px',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '8px',
    background: 'linear-gradient(90deg, #FFD700, #FFA500)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#888',
    fontSize: '12px',
  },
  apiStatus: {
    textAlign: 'center',
    fontSize: '12px',
    marginBottom: '15px',
    padding: '5px 10px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '20px',
    display: 'inline-block',
  },
  schemeSelector: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  schemeCard: {
    padding: '12px 15px',
    borderRadius: '10px',
    border: '2px solid #333',
    cursor: 'pointer',
    transition: 'all 0.3s',
    minWidth: '160px',
  },
  schemeName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '3px',
  },
  schemeDesc: {
    fontSize: '10px',
    color: '#aaa',
  },
  schemePower: {
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px solid #333',
    fontSize: '10px',
    color: '#4CAF50',
  },
  flowDiagram: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '20px',
    position: 'relative',
    minHeight: '380px',
  },
  solarSection: {
    position: 'absolute',
    left: '5%',
    top: '15%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  solarArrow: {
    marginTop: '10px',
    fontSize: '20px',
    color: '#4CAF50',
  },
  middleSection: {
    position: 'absolute',
    left: '50%',
    top: '10%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  taipowerSection: {
    marginBottom: '10px',
  },
  allInOneSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
  },
  batterySection: {
    marginTop: '10px',
  },
  verticalFlow: {
    position: 'relative',
    height: '45px',
    marginTop: '5px',
  },
  verticalLabel: {
    position: 'absolute',
    bottom: '-18px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: '1px 6px',
    borderRadius: '8px',
    fontSize: '9px',
    color: '#4CAF50',
    whiteSpace: 'nowrap',
  },
  flowLines: {
    position: 'absolute',
    left: '20%',
    right: '20%',
    top: '45%',
    height: '20px',
  },
  loadSection: {
    position: 'absolute',
    bottom: '8%',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '20px',
  },
  totalLoad: {
    position: 'absolute',
    bottom: '2%',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
  },
  totalLoadLabel: {
    fontSize: '10px',
    color: '#888',
  },
  totalLoadValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  circle: {
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '3px solid',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  statsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  statCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '12px 18px',
    textAlign: 'center',
    minWidth: '80px',
  },
  statIcon: {
    fontSize: '18px',
    marginBottom: '3px',
  },
  statValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#FFD700',
  },
  statLabel: {
    fontSize: '10px',
    color: '#aaa',
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '20px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: '12px',
  },
  refreshBtn: {
    padding: '6px 15px',
    backgroundColor: '#2196F3',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '12px',
  },
  info: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '15px',
  },
  infoTitle: {
    color: '#FFD700',
    marginBottom: '10px',
    fontSize: '14px',
  },
  infoContent: {
    fontSize: '12px',
    lineHeight: '1.6',
    color: '#aaa',
  },
  apiInfo: {
    fontSize: '11px',
    color: '#888',
    marginTop: '5px',
  },
};
