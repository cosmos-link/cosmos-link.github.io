/**
 * 光刻机监控系统 - API轮询版本
 * 使用HTTP API替代Socket.IO实现数据获取
 */

const config = {
    maxDataPoints: 60,
    chartUpdateInterval: 2000, // 2秒轮询一次
    apiUrls: {
        latest: '/api/data/latest',
        history: '/api/data/history', 
        alarms: '/api/alarms',
        health: '/api/health'
    }
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
    chartIntervals: {},
    pollingInterval: null
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
    
    // 开始数据轮询
    startPolling();
    
    // 初始化时获取历史数据
    fetchInitialData();
});

// ============================================================================
// API 请求函数
// ============================================================================
async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`API请求失败 ${url}:`, error);
        return null;
    }
}

async function fetchLatestData() {
    const result = await fetchData(config.apiUrls.latest);
    if (result && result.status === 'ok') {
        updateMetrics(result.data);
        addDataPoint(result.data);
        updateConnectionStatus(true);
        return result.data;
    } else {
        updateConnectionStatus(false);
        return null;
    }
}

async function fetchAlarms() {
    const result = await fetchData(config.apiUrls.alarms);
    if (result && result.status === 'ok') {
        updateAlarms(result.alarms);
        return result.alarms;
    }
    return [];
}

async function fetchInitialData() {
    console.log('📦 获取初始历史数据...');
    const result = await fetchData(config.apiUrls.history);
    if (result && result.status === 'ok' && result.data) {
        const history = result.data;
        state.dataHistory.timestamps = history.timestamps || [];
        state.dataHistory.temperature = history.data.Temperature || [];
        state.dataHistory.vibration = history.data.StageVibration || [];
        state.dataHistory.dose = history.data.DoseError || [];
        state.dataHistory.overlay = history.data.OverlayPrecision || [];
        
        // 重新初始化图表
        initCharts();
        console.log('📊 历史数据加载完成');
    }
}

async function checkHealth() {
    const result = await fetchData(config.apiUrls.health);
    if (result && result.status === 'ok') {
        updateConnectionStatus(result.opc_connected);
        return result;
    } else {
        updateConnectionStatus(false);
        return null;
    }
}

// ============================================================================
// 轮询控制
// ============================================================================
function startPolling() {
    console.log('🔄 开始数据轮询...');
    
    // 立即执行一次
    pollData();
    
    // 设置定时轮询
    state.pollingInterval = setInterval(pollData, config.chartUpdateInterval);
}

function stopPolling() {
    if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
        state.pollingInterval = null;
        console.log('⏹️ 停止数据轮询');
    }
}

async function pollData() {
    try {
        // 并行获取最新数据和告警信息
        const [latestData, alarms] = await Promise.all([
            fetchLatestData(),
            fetchAlarms()
        ]);
        
        // 定期检查健康状态
        if (Math.random() < 0.1) { // 10%概率检查健康状态
            checkHealth();
        }
        
    } catch (error) {
        console.error('轮询数据时出错:', error);
        updateConnectionStatus(false);
    }
}

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
        state.connected = true;
    } else {
        dot.className = 'dot disconnected';
        text.textContent = '连接中...';
        state.connected = false;
    }
}

function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleString('zh-CN');
    }
}

function updateMetrics(data) {
    if (!data) return;
    
    // 更新状态
    const statusElement = document.getElementById('metric-status');
    if (statusElement && data.MachineStatus) {
        statusElement.textContent = data.MachineStatus;
        statusElement.className = `metric-value status-value ${data.MachineStatus.toLowerCase()}`;
    }
    
    // 更新晶圆数量
    const waferElement = document.getElementById('metric-wafer');
    if (waferElement && data.WaferCount !== undefined) {
        waferElement.textContent = data.WaferCount;
    }
    
    // 更新温度
    const tempElement = document.getElementById('metric-temperature');
    if (tempElement && data.Temperature !== undefined) {
        tempElement.textContent = data.Temperature.toFixed(2);
    }
    
    // 更新振动
    const vibElement = document.getElementById('metric-vibration');
    if (vibElement && data.StageVibration !== undefined) {
        vibElement.textContent = data.StageVibration.toFixed(3);
    }
    
    // 更新剂量误差
    const doseElement = document.getElementById('metric-dose');
    if (doseElement && data.DoseError !== undefined) {
        doseElement.textContent = data.DoseError.toFixed(2);
    }
    
    // 更新套刻精度
    const overlayElement = document.getElementById('metric-overlay');
    if (overlayElement && data.OverlayPrecision !== undefined) {
        overlayElement.textContent = data.OverlayPrecision.toFixed(2);
    }
}

function addDataPoint(data) {
    if (!data || !data.timestamp) return;
    
    const timestamp = new Date(data.timestamp);
    
    // 添加新数据点
    state.dataHistory.timestamps.push(timestamp);
    state.dataHistory.temperature.push(data.Temperature || 0);
    state.dataHistory.vibration.push(data.StageVibration || 0);
    state.dataHistory.dose.push(data.DoseError || 0);
    state.dataHistory.overlay.push(data.OverlayPrecision || 0);
    
    // 保持数据点数量限制
    if (state.dataHistory.timestamps.length > config.maxDataPoints) {
        state.dataHistory.timestamps.shift();
        state.dataHistory.temperature.shift();
        state.dataHistory.vibration.shift();
        state.dataHistory.dose.shift();
        state.dataHistory.overlay.shift();
    }
    
    // 更新图表
    updateChart(state.activeChart);
}

function updateAlarms(alarms) {
    const alarmList = document.getElementById('alarm-list');
    const alarmCount = document.getElementById('alarm-count');
    
    if (!alarmList || !alarmCount) return;
    
    alarmCount.textContent = alarms.length;
    
    if (alarms.length === 0) {
        alarmList.innerHTML = '<div class="empty-state"><span>✅ 暂无告警信息</span></div>';
    } else {
        alarmList.innerHTML = alarms.map(alarm => `
            <div class="alarm-item ${alarm.level}">
                <div class="alarm-time">${new Date(alarm.timestamp).toLocaleString('zh-CN')}</div>
                <div class="alarm-message">${alarm.message}</div>
                <div class="alarm-level">${alarm.level.toUpperCase()}</div>
            </div>
        `).join('');
    }
}

// ============================================================================
// 图表相关函数
// ============================================================================
function initChartTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const chartType = btn.getAttribute('data-chart');
            switchChart(chartType);
        });
    });
    
    document.querySelectorAll('.metric-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const chartType = card.getAttribute('data-chart');
            if (chartType) {
                switchChart(chartType);
            }
        });
    });
}

function switchChart(chartType) {
    // 更新标签状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-chart') === chartType);
    });
    
    // 更新画布显示
    document.querySelectorAll('.chart-canvas').forEach(canvas => {
        canvas.classList.toggle('active', canvas.id === `chart-${chartType}`);
    });
    
    state.activeChart = chartType;
    updateChart(chartType);
}

function initCharts() {
    ['temperature', 'vibration', 'dose', 'overlay'].forEach(chartType => {
        const canvas = document.getElementById(`chart-${chartType}`);
        if (canvas) {
            updateChart(chartType);
        }
    });
}

function updateChart(chartType) {
    const canvas = document.getElementById(`chart-${chartType}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = state.dataHistory[chartType] || [];
    const timestamps = state.dataHistory.timestamps || [];
    
    if (data.length < 2) return;
    
    // 绘制图表
    drawChart(ctx, data, timestamps, canvas.width, canvas.height, chartType);
}

function drawChart(ctx, data, timestamps, width, height, chartType) {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // 计算数据范围
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    const valueRange = maxValue - minValue || 1;
    
    // 设置样式
    const colors = {
        temperature: '#ff6b6b',
        vibration: '#4ecdc4', 
        dose: '#45b7d1',
        overlay: '#96ceb4'
    };
    
    ctx.strokeStyle = colors[chartType] || '#666';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 绘制数据线
    ctx.beginPath();
    
    data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + (1 - (value - minValue) / valueRange) * chartHeight;
        
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // 绘制数据点
    ctx.fillStyle = colors[chartType] || '#666';
    data.forEach((value, index) => {
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const y = padding + (1 - (value - minValue) / valueRange) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// ============================================================================
// 页面可见性处理
// ============================================================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时降低轮询频率
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            state.pollingInterval = setInterval(pollData, config.chartUpdateInterval * 2);
        }
    } else {
        // 页面可见时恢复正常频率
        if (state.pollingInterval) {
            clearInterval(state.pollingInterval);
            state.pollingInterval = setInterval(pollData, config.chartUpdateInterval);
        }
    }
});

// ============================================================================
// 页面卸载清理
// ============================================================================
window.addEventListener('beforeunload', () => {
    stopPolling();
});