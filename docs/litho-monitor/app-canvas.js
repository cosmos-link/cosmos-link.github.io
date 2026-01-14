/**
 * 光刻机监控系统 - 原生Canvas版本
 * 完全参照 data-collector.js 实现
 */

const socket = io();

const config = {
    maxDataPoints: 60,
    chartUpdateInterval: 1000
};

const state = {
    connected: false,
    activeChart: 'temperature',
    dataHistory: {
        timestamps: [],
        temperature: [],
        vibration: [],
        dose: [],
        overlay: []
    },
    chartIntervals: {}
};

// ============================================================================
// 页面加载和初始化
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 应用初始化...');
    initChartTabs();
    initCharts();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
});

// ============================================================================
// Socket.IO 事件处理
// ============================================================================
socket.on('connect', () => {
    console.log('✅ WebSocket 连接成功');
    state.connected = true;
    updateConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('❌ WebSocket 连接断开');
    state.connected = false;
    updateConnectionStatus(false);
});

socket.on('initial_data', (data) => {
    console.log('📦 收到初始数据', data);
    
    if (data.history && data.history.data) {
        const history = data.history.data;
        state.dataHistory.timestamps = data.history.timestamps || [];
        state.dataHistory.temperature = history.Temperature || [];
        state.dataHistory.vibration = history.StageVibration || [];
        state.dataHistory.dose = history.DoseError || [];
        state.dataHistory.overlay = history.OverlayPrecision || [];
    }
    
    // 初始化图表数据
    initCharts();
    
    if (data.latest) {
        updateMetrics(data.latest);
        addDataPoint(data.latest);
    }
    
    if (data.alarms) {
        updateAlarms(data.alarms);
    }
});

socket.on('data_update', (data) => {
    if (data.latest) {
        updateMetrics(data.latest);
        addDataPoint(data.latest);
    }
    
    if (data.alarms) {
        updateAlarms(data.alarms);
    }
});

// ============================================================================
// UI更新函数
// ============================================================================
function updateConnectionStatus(connected) {
    const indicator = document.getElementById('connection-status');
    if (!indicator) return;
    
    const dot = indicator.querySelector('.dot');
    const text = indicator.querySelector('.text');
    
    if (connected) {
        dot.className = 'dot connected';
        text.textContent = '已连接';
    } else {
        dot.className = 'dot disconnected';
        text.textContent = '未连接';
    }
}

function updateCurrentTime() {
    const element = document.getElementById('current-time');
    if (element) {
        element.textContent = new Date().toLocaleString('zh-CN');
    }
}

function updateMetrics(data) {
    // 机器状态
    if ('MachineStatus' in data) {
        const element = document.getElementById('metric-status');
        if (element) {
            element.textContent = data.MachineStatus;
        }
    }
    
    // 晶圆数量
    if ('WaferCount' in data) {
        const element = document.getElementById('metric-wafer');
        if (element) {
            element.textContent = Math.floor(data.WaferCount);
        }
    }
    
    // 温度
    if ('Temperature' in data) {
        const element = document.getElementById('metric-temperature');
        if (element) {
            element.textContent = data.Temperature.toFixed(2);
        }
    }
    
    // 振动
    if ('StageVibration' in data) {
        const element = document.getElementById('metric-vibration');
        if (element) {
            element.textContent = data.StageVibration.toFixed(3);
        }
    }
    
    // 剂量误差
    if ('DoseError' in data) {
        const element = document.getElementById('metric-dose');
        if (element) {
            element.textContent = data.DoseError.toFixed(2);
        }
    }
    
    // 套刻精度
    if ('OverlayPrecision' in data) {
        const element = document.getElementById('metric-overlay');
        if (element) {
            element.textContent = data.OverlayPrecision.toFixed(2);
        }
    }
}

function addDataPoint(data) {
    const now = new Date().toLocaleTimeString();
    
    // 添加到历史数据
    if (state.dataHistory.timestamps.length >= config.maxDataPoints) {
        state.dataHistory.timestamps.shift();
        state.dataHistory.temperature.shift();
        state.dataHistory.vibration.shift();
        state.dataHistory.dose.shift();
        state.dataHistory.overlay.shift();
    }
    
    state.dataHistory.timestamps.push(now);
    state.dataHistory.temperature.push(data.Temperature || 0);
    state.dataHistory.vibration.push(data.StageVibration || 0);
    state.dataHistory.dose.push(data.DoseError || 0);
    state.dataHistory.overlay.push(data.OverlayPrecision || 0);
    
    // 重绘当前活动的图表
    drawActiveChart();
}

// ============================================================================
// 图表标签切换
// ============================================================================
function initChartTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const chartId = tab.getAttribute('data-chart');
            switchChart(chartId);
        });
    });
}

function switchChart(chartId) {
    console.log(`切换到图表: ${chartId}`);
    state.activeChart = chartId;
    
    // 隐藏所有canvas
    document.querySelectorAll('.chart-canvas').forEach(canvas => {
        canvas.classList.remove('active');
    });
    
    // 显示选中的canvas
    const activeCanvas = document.getElementById(`chart-${chartId}`);
    if (activeCanvas) {
        activeCanvas.classList.add('active');
        
        // 重新初始化canvas尺寸（因为隐藏时尺寸为0）
        const ctx = activeCanvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = activeCanvas.getBoundingClientRect();
        
        activeCanvas.width = rect.width * dpr;
        activeCanvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        console.log(`✅ 重新初始化图表: ${chartId}, 尺寸: ${rect.width}x${rect.height}`);
        
        drawActiveChart();
    }
}

// ============================================================================
// 原生Canvas绘图 - 完全参照 data-collector.js
// ============================================================================
function initCharts() {
    const chartIds = ['temperature', 'vibration', 'dose', 'overlay'];
    
    chartIds.forEach(chartId => {
        const canvas = document.getElementById(`chart-${chartId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // 设置canvas实际大小
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
        
        console.log(`✅ 初始化图表: ${chartId}, 尺寸: ${rect.width}x${rect.height}`);
    });
    
    // 绘制初始活动图表
    drawActiveChart();
}

function drawActiveChart() {
    const chartId = state.activeChart;
    const canvas = document.getElementById(`chart-${chartId}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    let data, color, label, range;
    
    switch(chartId) {
        case 'temperature':
            data = state.dataHistory.temperature;
            color = '#FF5722';
            label = '温度 (°C)';
            range = { min: 21, max: 25 };
            break;
        case 'vibration':
            data = state.dataHistory.vibration;
            color = '#2196F3';
            label = '振动 (μm)';
            range = { min: 0, max: 0.1 };
            break;
        case 'dose':
            data = state.dataHistory.dose;
            color = '#4CAF50';
            label = '剂量误差 (%)';
            range = { min: 0, max: 2 };
            break;
        case 'overlay':
            data = state.dataHistory.overlay;
            color = '#FFC107';
            label = '套刻精度 (nm)';
            range = { min: 0.5, max: 2 };
            break;
        default:
            data = [];
    }
    
    drawChart(ctx, rect.width, rect.height, data, color, label, range);
}

function drawChart(ctx, width, height, data, color, label, range) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const paddingBottom = 50; // X轴标签需要更多空间
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding - paddingBottom;
    
    // 绘制背景网格
    ctx.strokeStyle = 'rgba(0, 136, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // 横向网格线
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // 纵向网格线
    for (let i = 0; i <= 10; i++) {
        const x = padding + (chartWidth / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - paddingBottom);
        ctx.stroke();
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - paddingBottom);
    ctx.lineTo(width - padding, height - paddingBottom);
    ctx.stroke();
    
    // 绘制Y轴刻度标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    const rangeSpan = range.max - range.min;
    for (let i = 0; i <= 5; i++) {
        const value = range.max - (rangeSpan / 5) * i;
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(value.toFixed(1), padding - 10, y + 4);
    }
    
    // 绘制X轴时间刻度标签
    ctx.textAlign = 'center';
    ctx.font = '10px Arial';
    const timestamps = state.dataHistory.timestamps;
    if (timestamps.length > 0) {
        // 显示5个时间点
        const step = Math.max(1, Math.floor(timestamps.length / 5));
        for (let i = 0; i < 5; i++) {
            const index = Math.min(i * step, timestamps.length - 1);
            const timestamp = timestamps[index];
            const x = padding + (chartWidth / (timestamps.length - 1)) * index;
            
            // 只显示时:分:秒，去掉日期部分
            const timeStr = timestamp.length > 8 ? timestamp : timestamp;
            ctx.fillText(timeStr, x, height - paddingBottom + 20);
        }
    }
    
    // 绘制数据曲线
    if (data.length > 1) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const xStep = chartWidth / (data.length - 1);
        
        data.forEach((value, index) => {
            const x = padding + index * xStep;
            // 将值映射到y坐标
            const normalizedValue = (value - range.min) / rangeSpan;
            const y = height - paddingBottom - normalizedValue * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制填充区域
        ctx.lineTo(width - padding, height - paddingBottom);
        ctx.lineTo(padding, height - paddingBottom);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, padding, 0, height - paddingBottom);
        gradient.addColorStop(0, color + '4D'); // 30% opacity
        gradient.addColorStop(1, color + '0D'); // 5% opacity
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制最新数据点
        const lastValue = data[data.length - 1];
        const lastX = width - padding;
        const lastY = height - paddingBottom - ((lastValue - range.min) / rangeSpan) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// ============================================================================
// 告警更新
// ============================================================================
function updateAlarms(alarms) {
    const alarmList = document.getElementById('alarm-list');
    if (!alarmList) return;
    
    // 更新告警计数
    const alarmCount = document.getElementById('alarm-count');
    if (alarmCount) {
        alarmCount.textContent = alarms ? alarms.length : 0;
    }
    
    if (!alarms || alarms.length === 0) {
        alarmList.innerHTML = '<div class="empty-state"><span>✅ 暂无告警信息</span></div>';
        return;
    }
    
    alarmList.innerHTML = '';
    alarms.forEach((alarm, index) => {
        const alarmItem = document.createElement('div');
        alarmItem.className = 'alarm-item';
        if (alarm.level === 'critical') {
            alarmItem.classList.add('critical');
        }
        
        alarmItem.innerHTML = `
            <div class="alarm-time">${alarm.timestamp || new Date().toLocaleTimeString()}</div>
            <div class="alarm-message">
                <strong>${alarm.type || '告警'}</strong>: ${alarm.message || '-'}
            </div>
            <div class="alarm-value">${alarm.value || ''}</div>
        `;
        
        alarmList.appendChild(alarmItem);
    });
}

// ============================================================================
// 窗口大小调整
// ============================================================================
window.addEventListener('resize', () => {
    console.log('窗口大小调整，重新初始化图表');
    initCharts();
});

console.log('✅ app-canvas.js 加载完成');
