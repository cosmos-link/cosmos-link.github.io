/**
 * 光刻机监控系统 - API轮询版本
 * 使用HTTP API替代Socket.IO实现数据获取
 */

const config = {
    maxDataPoints: 60,
    chartUpdateInterval: 2000, // 2秒轮询一次
    apiUrls: {
        latest: '/litho-monitor/api/data/latest',
        history: '/litho-monitor/api/data/history', 
        alarms: '/litho-monitor/api/alarms',
        health: '/litho-monitor/api/health'
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
    pollingInterval: null,
    lastDataUpdate: null,
    watchdogInterval: null
};

// ============================================================================
// 页面加载和初始化
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 应用初始化...');
    initChartTabs();
    
    // 设置默认活动图表
    switchChart('temperature');
    console.log('✅ 设置默认图表为温度');
    
    initCharts();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 开始数据轮询
    startPolling();
    
    // 初始化时获取历史数据
    fetchInitialData();
    
    // 启动看门狗定时器
    startWatchdog();
    
    // 添加测试按钮来强制更新图表
    window.testChartUpdate = () => {
        console.log('🧪 [TEST] 强制测试图表更新');
        updateChart('temperature');
    };
    
    console.log('✅ 初始化完成! 输入 testChartUpdate() 来测试图表更新');
});

// ============================================================================
// API 请求函数
// ============================================================================
async function fetchData(url) {
    try {
        console.log(`🌐 请求 API: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log(`✅ API响应成功`, result);
        return result;
    } catch (error) {
        console.error(`❌ API请求失败 ${url}:`, error);
        return null;
    }
}

async function fetchLatestData() {
    console.log('🔄 获取最新数据...');
    try {
        const result = await fetchData(config.apiUrls.latest);
        if (result && result.status === 'ok') {
            console.log('📊 更新数据:', result.data);
            updateMetrics(result.data);
            
            // 添加timestamp到数据中
            const dataWithTimestamp = {
                ...result.data,
                timestamp: result.timestamp || new Date().toISOString()
            };
            console.log('➕ 准备添加带时间戳的数据:', dataWithTimestamp);
            addDataPoint(dataWithTimestamp);
            
            updateConnectionStatus(true);
            // 更新最后数据时间
            state.lastDataUpdate = new Date();
            return result.data;
        } else {
            console.log('❌ 数据获取失败');
            updateConnectionStatus(false);
            return null;
        }
    } catch (error) {
        console.error('❌ fetchLatestData 错误:', error);
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
    
    // 先停止任何现有的轮询
    stopPolling();
    
    // 立即执行一次
    pollData();
    
    // 设置定时轮询
    state.pollingInterval = setInterval(() => {
        console.log(`⏰ 定时轮询触发 (${new Date().toLocaleTimeString()})`);
        pollData();
    }, config.chartUpdateInterval);
    
    console.log(`✅ 轮询已启动，间隔: ${config.chartUpdateInterval}ms`);
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
        console.log('🔄 执行轮询...');
        // 并行获取最新数据和告警信息
        const [latestData, alarms] = await Promise.all([
            fetchLatestData(),
            fetchAlarms()
        ]);
        
        if (latestData) {
            console.log('✅ 轮询成功');
        } else {
            console.log('⚠️ 轮询数据为空');
        }
        
        // 定期检查健康状态
        if (Math.random() < 0.1) { // 10%概率检查健康状态
            checkHealth();
        }
        
    } catch (error) {
        console.error('❌ 轮询数据时出错:', error);
        updateConnectionStatus(false);
        // 不要停止轮询，继续下一次尝试
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
    
    // 更新状态 - 处理数字状态码
    const statusElement = document.getElementById('metric-status');
    if (statusElement && data.MachineStatus !== undefined) {
        // 将数字状态码转换为文本
        const statusMap = {
            1: 'Idle',
            2: 'Execute', 
            3: 'Pause',
            4: 'Error'
        };
        const statusText = statusMap[data.MachineStatus] || `Status${data.MachineStatus}`;
        statusElement.textContent = statusText;
        statusElement.className = `metric-value status-value ${statusText.toLowerCase()}`;
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
    if (!data || !data.timestamp) {
        console.log('❌ 无效数据点:', data);
        return;
    }
    
    const timestamp = new Date(data.timestamp);
    
    console.log('📈 添加数据点:', {
        time: timestamp.toLocaleTimeString(),
        temp: data.Temperature,
        vibration: data.StageVibration,
        dose: data.DoseError,
        overlay: data.OverlayPrecision
    });
    
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
    
    console.log(`📊 历史数据长度: ${state.dataHistory.timestamps.length}, 活动图表: ${state.activeChart}`);
    
    // 只更新当前活动的图表
    if (state.activeChart) {
        console.log(`🎯 更新活动图表: ${state.activeChart}`);
        updateChart(state.activeChart);
    } else {
        console.log('⚠️ 没有活动图表，跳过更新');
    }
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
    console.log(`🔄 切换到图表: ${chartType}`);
    
    // 更新标签状态
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-chart') === chartType);
    });
    
    // 更新画布显示
    document.querySelectorAll('.chart-canvas').forEach(canvas => {
        canvas.classList.toggle('active', canvas.id === `chart-${chartType}`);
    });
    
    state.activeChart = chartType;
    
    // 立即更新新的活动图表
    setTimeout(() => {
        updateChart(chartType);
        console.log(`✅ 完成图表切换到: ${chartType}`);
    }, 100);
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
    console.log(`🎨 [CHART] 开始更新图表: ${chartType}`);
    const canvas = document.getElementById(`chart-${chartType}`);
    if (!canvas) {
        console.log(`❌ [CHART] 找不到画布: chart-${chartType}`);
        return;
    }
    
    // 检查Canvas是否可见
    const isVisible = canvas.offsetWidth > 0 && canvas.offsetHeight > 0;
    const hasActiveClass = canvas.classList.contains('active');
    console.log(`👁️ [CHART] 画布 ${chartType} 状态: 可见=${isVisible} (${canvas.offsetWidth}x${canvas.offsetHeight}), active类=${hasActiveClass}`);
    
    if (!isVisible) {
        console.log(`⚠️ [CHART] 画布不可见，跳过渲染`);
        return;
    }
    
    // 确保Canvas尺寸正确
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // 设置实际尺寸
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // 缩放canvas以匹配设备像素比
    const ctx = canvas.getContext('2d'); // 获取context（只声明一次）
    ctx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换，避免多次scale叠加
    ctx.scale(dpr, dpr); // 缩放canvas以匹配设备像素比
    
    // 设置CSS尺寸
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // 清除画布
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    const data = state.dataHistory[chartType] || [];
    const timestamps = state.dataHistory.timestamps || [];
    
    console.log(`📊 [CHART] 图表数据 ${chartType}: ${data.length} 个数据点 [${data.slice(-3).join(', ')}]`);
    
    // 获取context
    // const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    if (data.length < 2) {
        console.log('⚠️ [CHART] 数据点不足，只显示测试内容');
        return;
    }
    
    // 绘制图表
    drawChart(ctx, data, timestamps, rect.width, rect.height, chartType);
    console.log(`✅ 图表 ${chartType} 更新完成`);
}

function drawChart(ctx, data, timestamps, width, height, chartType) {
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    console.log(`🖼️ 绘制图表 ${chartType}: ${data.length} 个数据点, 尺寸: ${width}x${height}`);
    
    if (data.length === 0 || chartWidth <= 0 || chartHeight <= 0) {
        console.log('❌ 无效的绘制参数');
        return;
    }
    
    // 计算数据范围，确保有合理的范围
    const minValue = Math.min(...data);
    const maxValue = Math.max(...data);
    let valueRange = maxValue - minValue;
    if (valueRange < 0.01) valueRange = 1;
    console.log(`📈 数据范围: ${minValue.toFixed(3)} - ${maxValue.toFixed(3)}, 范围: ${valueRange.toFixed(3)}`);
    
    // 设置样式
    const colors = {
        temperature: '#ff3b30', // 红色
        vibration: '#007aff',   // 蓝色
        dose: '#34c759',        // 绿色
        overlay: '#af52de'      // 紫色
    };
    
    ctx.strokeStyle = colors[chartType] || '#666';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // 绘制纵轴刻度线和标签
    ctx.save();
    ctx.strokeStyle = '#ccc';
    ctx.fillStyle = '#888';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const y = padding + (chartHeight / yTicks) * i;
        const value = maxValue - (valueRange / yTicks) * i;
        ctx.beginPath();
        ctx.moveTo(padding - 5, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillText(value.toFixed(2), padding - 10, y);
    }
    ctx.restore();

    // 绘制横轴刻度线和时间标签
    ctx.save();
    ctx.strokeStyle = '#eee';
    ctx.fillStyle = '#888';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = Math.min(6, data.length - 1);
    for (let i = 0; i <= xTicks; i++) {
        const idx = Math.round(i * (data.length - 1) / xTicks);
        const x = padding + (idx / (data.length - 1)) * chartWidth;
        ctx.beginPath();
        ctx.moveTo(x, height - padding + 5);
        ctx.lineTo(x, padding);
        ctx.stroke();
        if (timestamps[idx]) {
            let label = '';
            if (timestamps[idx] instanceof Date) {
                label = timestamps[idx].toLocaleTimeString();
            } else if (typeof timestamps[idx] === 'string') {
                label = timestamps[idx].slice(11, 19); // 只取时分秒
            }
            ctx.fillText(label, x, height - padding + 8);
        }
    }
    ctx.restore();

    // 绘制折线图
    ctx.beginPath();
    let validPointsCount = 0;
    let lastX = null, lastY = null;
    data.forEach((value, index) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return;
        }
        const x = padding + (index / (data.length - 1)) * chartWidth;
        const normalizedY = (value - minValue) / valueRange;
        const y = padding + (1 - normalizedY) * chartHeight;
        if (validPointsCount === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
        validPointsCount++;
        if (index === data.length - 1) {
            lastX = x;
            lastY = y;
        }
    });
    if (validPointsCount > 1) {
        ctx.strokeStyle = colors[chartType] || '#666';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }
    // 在最后一个数据点加小圆点
    if (lastX !== null && lastY !== null) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = colors[chartType] || '#666';
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 2;
        ctx.fill();
        ctx.restore();
    }
    console.log(`✅ 图表绘制完成: ${validPointsCount} 个有效点`);
}

// ============================================================================
// 看门狗机制 - 检测轮询是否正常工作
// ============================================================================
function startWatchdog() {
    console.log('🐕 启动看门狗...');
    state.watchdogInterval = setInterval(checkPollingHealth, 10000); // 每10秒检查一次
}

function checkPollingHealth() {
    const now = new Date();
    const timeSinceLastUpdate = state.lastDataUpdate ? now - state.lastDataUpdate : Infinity;
    
    console.log(`🐕 看门狗检查: 距离上次数据更新 ${Math.round(timeSinceLastUpdate/1000)}秒`);
    
    // 如果超过6秒没有数据更新，重启轮询
    if (timeSinceLastUpdate > 6000) {
        console.log('⚠️ 检测到轮询异常，重启轮询机制...');
        startPolling();
    }
    
    // 检查轮询间隔是否还存在
    if (!state.pollingInterval) {
        console.log('⚠️ 检测到轮询已停止，重新启动...');
        startPolling();
    }
}

// ============================================================================
// 页面可见性处理
// ============================================================================
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('📱 页面隐藏，保持正常轮询频率');
        // 保持正常频率，不降低
    } else {
        console.log('📱 页面可见，确保轮询正常');
        // 页面可见时确保轮询正常
        if (!state.pollingInterval) {
            console.log('🔄 页面重新可见，重启轮询');
            startPolling();
        }
    }
});

// ============================================================================
// 页面卸载清理
// ============================================================================
window.addEventListener('beforeunload', () => {
    console.log('🔄 页面卸载，清理资源...');
    stopPolling();
    if (state.watchdogInterval) {
        clearInterval(state.watchdogInterval);
        state.watchdogInterval = null;
    }
});