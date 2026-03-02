import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 預設數據
const DEFAULT_DATA = {
  solar: { power: 498.0, unit: 'kW', label: '太陽能發電' },
  load: { power: 598.620, unit: 'kW', label: '工廠負載' },
  ess: { power: 39.620, unit: 'kW', label: '儲能系統', soc: 40 },
  grid: { power: 100.620, unit: 'kW', label: '市電' }
};

// 發光效果的SVG濾鏡
const GlowFilter = () => (
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="coloredBlur" />
      <feMerge>
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="coloredBlur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#00D9FF" stopOpacity="0" />
      <stop offset="50%" stopColor="#00D9FF" stopOpacity="1" />
      <stop offset="100%" stopColor="#00D9FF" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="solarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFD700" />
      <stop offset="100%" stopColor="#FFA500" />
    </linearGradient>
    <linearGradient id="essGradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stopColor="#00D9FF" />
      <stop offset="100%" stopColor="#0099CC" />
    </linearGradient>
  </defs>
);

// 等距太陽能面板圖示
const SolarIcon = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* 支架 */}
    <rect x="15" y="55" width="4" height="20" fill="#445566" />
    <rect x="41" y="55" width="4" height="20" fill="#445566" />
    {/* 面板主體 */}
    <rect x="5" y="10" width="50" height="45" rx="3" fill="#1a2332" stroke="#00D9FF" strokeWidth="1.5" />
    {/* 格子線 */}
    <line x1="5" y1="23" x2="55" y2="23" stroke="#00D9FF" strokeWidth="0.5" opacity="0.5" />
    <line x1="5" y1="36" x2="55" y2="36" stroke="#00D9FF" strokeWidth="0.5" opacity="0.5" />
    <line x1="22" y1="10" x2="22" y2="55" stroke="#00D9FF" strokeWidth="0.5" opacity="0.5" />
    <line x1="38" y1="10" x2="38" y2="55" stroke="#00D9FF" strokeWidth="0.5" opacity="0.5" />
    {/* 太陽 */}
    <circle cx="55" cy="5" r="8" fill="url(#solarGradient)" filter="url(#glow)">
      <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite" />
    </circle>
    {/* 光線 */}
    <g stroke="#FFD700" strokeWidth="1" opacity="0.6">
      <line x1="50" y1="0" x2="45" y2="-5" />
      <line x1="55" y1="-2" x2="55" y2="-8" />
      <line x1="60" y1="0" x2="65" y2="-5" />
    </g>
  </g>
);

// 等距工廠圖示
const FactoryIcon = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* 建築主體 */}
    <polygon points="30,10 55,25 55,65 30,80 5,65 5,25" fill="#1a2332" stroke="#00D9FF" strokeWidth="1.5" />
    {/* 屋頂 */}
    <polygon points="30,5 58,22 52,22 30,10 8,22 2,22" fill="#2a3a4a" stroke="#00D9FF" strokeWidth="1" />
    {/* 窗户 */}
    <rect x="12" y="30" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    <rect x="26" y="30" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    <rect x="40" y="30" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    <rect x="12" y="45" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    <rect x="26" y="45" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    <rect x="40" y="45" width="8" height="10" fill="#00D9FF" opacity="0.3" />
    {/* 煙囪 */}
    <rect x="15" y="0" width="6" height="12" fill="#445566" />
    <ellipse cx="18" cy="0" rx="3" ry="1" fill="#00D9FF" opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite" />
    </ellipse>
    {/* 地面 */}
    <rect x="0" y="70" width="60" height="5" fill="#445566" rx="1" />
  </g>
);

// 等距儲能圖示
const ESSIcon = ({ x, y, scale = 1, soc = 40 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* 儲能貨櫃主體 */}
    <rect x="5" y="15" width="50" height="50" rx="3" fill="#1a2332" stroke="#00D9FF" strokeWidth="1.5" />
    {/* 電量顯示 */}
    <rect x="10" y="20" width="30" height="35" fill="#0a1520" rx="2" />
    <rect x="10" y={20 + 35 - (35 * soc / 100)} width="30" height={35 * soc / 100} fill="url(#essGradient)" rx="2">
      <animate attributeName="height" values={`${35 * soc / 100};${35 * (soc + 5) / 100};${35 * soc / 100}`} dur="3s" repeatCount="indefinite" />
    </rect>
    {/* 閃電標誌 */}
    <path d="M25,8 L28,18 L22,18 L27,35 L20,20 L26,20 Z" fill="#00D9FF" filter="url(#glow)" />
    {/* 百分比 */}
    <text x="30" y="48" textAnchor="middle" fill="#00D9FF" fontSize="10" fontFamily="monospace">{soc}%</text>
    {/* 底部輪子 */}
    <rect x="8" y="65" width="6" height="4" fill="#445566" rx="1" />
    <rect x="26" y="65" width="6" height="4" fill="#445566" rx="1" />
    <rect x="44" y="65" width="6" height="4" fill="#445566" rx="1" />
  </g>
);

// 等距電塔圖示
const GridIcon = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`}>
    {/* 電塔主體 */}
    <line x1="30" y1="70" x2="30" y2="15" stroke="#00D9FF" strokeWidth="2" />
    <line x1="15" y1="30" x2="45" y2="30" stroke="#00D9FF" strokeWidth="1.5" />
    <line x1="20" y1="45" x2="40" y2="45" stroke="#00D9FF" strokeWidth="1.5" />
    <line x1="10" y1="20" x2="25" y2="30" stroke="#00D9FF" strokeWidth="1" />
    <line x1="50" y1="20" x2="35" y2="30" stroke="#00D9FF" strokeWidth="1" />
    <line x1="10" y1="20" x2="10" y2="70" stroke="#00D9FF" strokeWidth="1.5" />
    <line x1="50" y1="20" x2="50" y2="70" stroke="#00D9FF" strokeWidth="1.5" />
    {/* 絕緣體 */}
    <circle cx="30" cy="15" r="4" fill="#1a2332" stroke="#00D9FF" strokeWidth="1" />
    {/* 閃電符號 */}
    <path d="M26,0 L32,10 L27,10 L30,20 L23,9 L28,9 Z" fill="#FFD700" filter="url(#glow)" />
    {/* 地面 */}
    <line x1="5" y1="70" x2="55" y2="70" stroke="#445566" strokeWidth="2" />
  </g>
);

// 流動動畫路徑
const FlowLine = ({ startX, startY, endX, endY, color = "#00D9FF" }) => {
  const midX = (startX + endX) / 2;
  const midY = (startY + endY) / 2;
  
  return (
    <g>
      {/* 基礎路徑 */}
      <path
        d={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeOpacity="0.3"
        strokeDasharray="5,5"
      />
      {/* 流動的脈衝點 */}
      <circle r="4" fill={color} filter="url(#strongGlow)">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          path={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        />
      </circle>
      {/* 第二個脈衝點（延遲） */}
      <circle r="3" fill={color} filter="url(#glow)">
        <animateMotion
          dur="2s"
          repeatCount="indefinite"
          begin="1s"
          path={`M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`}
        />
      </circle>
    </g>
  );
};

// 數值顯示元件
const PowerDisplay = ({ x, y, value, unit, label, color = "#00D9FF" }) => (
  <g transform={`translate(${x}, ${y})`}>
    <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#0a1520" stroke={color} strokeWidth="1" opacity="0.8" />
    <text textAnchor="middle" y="4" fill={color} fontSize="14" fontFamily="monospace" fontWeight="bold" filter="url(#glow)">
      {value.toFixed(1)} {unit}
    </text>
    <text textAnchor="middle" y="22" fill={color} fontSize="8" opacity="0.7">{label}</text>
  </g>
);

// 主元件
const PowerFlowCard = ({ data = DEFAULT_DATA, width = 400, height = 350 }) => {
  const [displayData, setDisplayData] = useState(data);
  const [isAnimating, setIsAnimating] = useState(true);

  // 模擬數據更新
  useEffect(() => {
    if (!isAnimating) return;
    
    const interval = setInterval(() => {
      setDisplayData(prev => ({
        solar: { ...prev.solar, power: prev.solar.power + (Math.random() - 0.5) * 10 },
        load: { ...prev.load, power: prev.load.power + (Math.random() - 0.5) * 20 },
        ess: { ...prev.ess, power: prev.ess.power + (Math.random() - 0.5) * 5, soc: Math.min(100, Math.max(0, prev.ess.soc + (Math.random() - 0.5) * 2)) },
        grid: { ...prev.grid, power: Math.max(0, prev.grid.power + (Math.random() - 0.5) * 10) }
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isAnimating]);

  // 計算位置（等距佈局）
  const centerX = width / 2;
  const centerY = height / 2;
  const solarPos = { x: centerX - 30, y: 45 };
  const factoryPos = { x: centerX - 30, y: centerY + 20 };
  const essPos = { x: 45, y: centerY + 80 };
  const gridPos = { x: width - 85, y: centerY + 80 };

  return (
    <div style={{ 
      background: '#050A19', 
      borderRadius: '12px', 
      padding: '20px',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 0 40px rgba(0, 217, 255, 0.1)'
    }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <GlowFilter />
        
        {/* 標題 */}
        <text x={centerX} y="25" textAnchor="middle" fill="#00D9FF" fontSize="16" fontWeight="bold" filter="url(#glow)">
          微電網能源看板
        </text>
        
        {/* 連接線 - 太陽能到工廠 */}
        <FlowLine 
          startX={solarPos.x + 30} 
          startY={solarPos.y + 55} 
          endX={factoryPos.x + 30} 
          endY={factoryPos.y - 20} 
          color="#FFD700"
        />
        
        {/* 連接線 - 儲能到工廠 */}
        <FlowLine 
          startX={essPos.x + 30} 
          startY={essPos.y + 15} 
          endX={factoryPos.x + 30} 
          endY={factoryPos.y - 20} 
          color="#00D9FF"
        />
        
        {/* 連接線 - 市電到工廠 */}
        <FlowLine 
          startX={gridPos.x + 30} 
          startY={gridPos.y + 15} 
          endX={factoryPos.x + 30} 
          endY={factoryPos.y - 20} 
          color="#00D9FF"
        />
        
        {/* 太陽能 */}
        <SolarIcon x={solarPos.x} y={solarPos.y} />
        <PowerDisplay 
          x={solarPos.x + 30} 
          y={solarPos.y + 85} 
          value={displayData.solar.power} 
          unit={displayData.solar.unit} 
          label={displayData.solar.label}
          color="#FFD700"
        />
        
        {/* 工廠（中央） */}
        <FactoryIcon x={factoryPos.x} y={factoryPos.y} />
        <PowerDisplay 
          x={factoryPos.x + 30} 
          y={factoryPos.y + 95} 
          value={displayData.load.power} 
          unit={displayData.load.unit} 
          label={displayData.load.label}
          color="#FF5722"
        />
        
        {/* 儲能系統 */}
        <ESSIcon x={essPos.x} y={essPos.y} scale={0.9} soc={displayData.ess.soc} />
        <PowerDisplay 
          x={essPos.x + 30} 
          y={essPos.y + 85} 
          value={displayData.ess.power} 
          unit={displayData.ess.unit} 
          label={displayData.ess.label}
        />
        
        {/* 市電 */}
        <GridIcon x={gridPos.x} y={gridPos.y} scale={0.9} />
        <PowerDisplay 
          x={gridPos.x + 30} 
          y={gridPos.y + 85} 
          value={displayData.grid.power} 
          unit={displayData.grid.unit} 
          label={displayData.grid.label}
        />
      </svg>
      
      {/* 控制按鈕 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
        <button 
          onClick={() => setIsAnimating(!isAnimating)}
          style={{
            background: isAnimating ? '#00D9FF' : '#445566',
            color: '#050A19',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {isAnimating ? '⏸ 暫停更新' : '▶ 開始更新'}
        </button>
      </div>
    </div>
  );
};

export default PowerFlowCard;
