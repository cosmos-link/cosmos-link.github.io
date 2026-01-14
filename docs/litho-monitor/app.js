// ============================================================================
// 全局配置和状态
// ============================================================================
const config = {
    updateInterval: 2000,  // 更新间隔（毫秒）
    maxDataPoints: 10,     // 最大数据点数 - 减少到10个点，更清晰
    chartAnimationDuration: 300,
};

const state = {
    connected: false,
    charts: {},
    chartInstances: {},
    dataHistory: {
        temperature: [],
        vibration: [],
        dose: [],
        overlay: [],
        timestamps: []
    },
    alarms: [],
};

// 状态地图
const STATUS_MAP = {
    0: { text: 'Offline', color: '#6b7280' },
    1: { text: 'Initial', color: '#f59e0b' },
    2: { text: 'Idle', color: '#22c55e' },
    3: { text: 'Execute', color: '#0066cc' },
};

// ============================================================================
// Socket.IO 连接
// ============================================================================
const socket = io();

socket.on('connect', () => {
    console.log('✅ WebSocket 已连接');
    setConnectionStatus(true);
});

socket.on('disconnect', () => {
    console.log('❌ WebSocket 已断开');
    setConnectionStatus(false);
});

socket.on('init_data', (data) => {
    console.log('📥 收到初始化数据', data);
    console.log('历史数据长度:', {
        timestamps: data.history?.timestamps?.length || 0,
        temperature: data.history?.data?.Temperature?.length || 0
    });
    
    // 加载历史数据
    if (data.history && data.history.data) {
        const history = data.history.data;
        state.dataHistory.timestamps = data.history.timestamps || [];
        state.dataHistory.temperature = history.Temperature || [];
        state.dataHistory.vibration = history.StageVibration || [];
        state.dataHistory.dose = history.DoseError || [];
        state.dataHistory.overlay = history.OverlayPrecision || [];
    }
    
    // 初始化图表（即使没有历史数据也要初始化）
    initCharts();
    
    // 更新最新数据
    if (data.latest) {
        console.log('更新最新数据:', data.latest);
        updateMetrics(data.latest);
        addDataPoint(data.latest);
    }
    
    // 更新告警
    if (data.alarms) {
        updateAlarms(data.alarms);
    }
});

socket.on('data_update', (data) => {
    console.log('📊 收到数据更新', {
        hasLatest: !!data.latest,
        hasAlarms: !!data.alarms,
        timestamp: data.timestamp
    });
    
    // 更新指标
    if (data.latest) {
        updateMetrics(data.latest);
        addDataPoint(data.latest);
    }
    
    // 更新告警
    if (data.alarms) {
        updateAlarms(data.alarms);
    }
});

// ============================================================================
// UI 更新函数
// ============================================================================

/**
 * 设置连接状态
 */
function setConnectionStatus(connected) {
    state.connected = connected;
    const indicator = document.getElementById('connection-status');
    const dot = indicator.querySelector('.dot');
    const text = indicator.querySelector('.text');
    
    if (connected) {
        dot.classList.remove('disconnected');
        dot.classList.add('connected');
        text.textContent = '已连接';
    } else {
        dot.classList.remove('connected');
        dot.classList.add('disconnected');
        text.textContent = '已断开';
    }
}

/**
 * 更新指标数据
 */
function updateMetrics(data) {
    // 机器状态
    if ('MachineStatus' in data) {
        const status = data.MachineStatus;
        const statusInfo = STATUS_MAP[status] || { text: 'Unknown', color: '#9ca3af' };
        const element = document.getElementById('metric-status');
        if (element) {
            element.textContent = statusInfo.text;
            element.style.color = statusInfo.color;
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
    
    // 更新时间
    updateCurrentTime();
}

/**
 * 添加新数据点
 */
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
    
    if ('Temperature' in data) {
        state.dataHistory.temperature.push(data.Temperature);
    }
    
    if ('StageVibration' in data) {
        state.dataHistory.vibration.push(data.StageVibration);
    }
    
    if ('DoseError' in data) {
        state.dataHistory.dose.push(data.DoseError);
    }
    
    if ('OverlayPrecision' in data) {
        state.dataHistory.overlay.push(data.OverlayPrecision);
    }
    
    // 更新图表
    console.log('📊 更新图表数据，数据点数:', state.dataHistory.timestamps.length);
    updateCharts();
}

/**
 * 初始化图表
 */
function initCharts() {
    console.log('🎨 初始化图表...');
    
    // 销毁现有图表
    Object.values(state.chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
    state.chartInstances = {};
    
    // 温度图表
    createChart('temperature', '🌡️ 温度 (°C)', state.dataHistory.temperature, '#ef4444');
    
    // 振动图表
    createChart('vibration', '📳 工台振动 (μm)', state.dataHistory.vibration, '#f59e0b');
    
    // 剂量图表
    createChart('dose', '📊 剂量误差 (%)', state.dataHistory.dose, '#06b6d4');
    
    // 精度图表
    createChart('overlay', '📐 套刻精度 (nm)', state.dataHistory.overlay, '#8b5cf6');
    
    console.log('✅ 图表初始化完成，共', Object.keys(state.chartInstances).length, '个图表');
}

/**
 * 创建单个图表
 */
function createChart(chartId, label, data, color) {
    const canvasElement = document.getElementById(`chart-${chartId}`);
    if (!canvasElement) {
        console.error(`❌ 找不到图表元素: chart-${chartId}`);
        return;
    }
    
    const ctx = canvasElement.getContext('2d');
    
    const chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: state.dataHistory.timestamps,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '20',
                borderWidth: 2,
                fill: true,
                tension: 0.3,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { color: '#e5e7eb' },
                    ticks: { 
                        color: '#6b7280',
                        maxRotation: 0,
                        autoSkip: true
                    }
                },
                y: {
                    beginAtZero: false,
                    grid: { color: '#e5e7eb' },
                    ticks: { color: '#6b7280' }
                }
            }
        }
    });
    
    state.chartInstances[chartId] = chart;
    console.log(`✅ 创建图表: ${chartId}, 数据点数: ${data.length}`);
}

/**
 * 更新所有图表
 */
function updateCharts() {
    console.log('📈 开始更新图表, 图表实例:', Object.keys(state.chartInstances));
    
    if (state.chartInstances.temperature) {
        state.chartInstances.temperature.data.labels = state.dataHistory.timestamps;
        state.chartInstances.temperature.data.datasets[0].data = state.dataHistory.temperature;
        state.chartInstances.temperature.update('active');
        console.log('  - 温度图表已更新, 数据点:', state.dataHistory.temperature.length);
    }
    
    if (state.chartInstances.vibration) {
        state.chartInstances.vibration.data.labels = state.dataHistory.timestamps;
        state.chartInstances.vibration.data.datasets[0].data = state.dataHistory.vibration;
        state.chartInstances.vibration.update('active');
        console.log('  - 振动图表已更新, 数据点:', state.dataHistory.vibration.length);
    }
    
    if (state.chartInstances.dose) {
        state.chartInstances.dose.data.labels = state.dataHistory.timestamps;
        state.chartInstances.dose.data.datasets[0].data = state.dataHistory.dose;
        state.chartInstances.dose.update('active');
        console.log('  - 剂量图表已更新, 数据点:', state.dataHistory.dose.length);
    }
    
    if (state.chartInstances.overlay) {
        state.chartInstances.overlay.data.labels = state.dataHistory.timestamps;
        state.chartInstances.overlay.data.datasets[0].data = state.dataHistory.overlay;
        state.chartInstances.overlay.update('active');
        console.log('  - 精度图表已更新, 数据点:', state.dataHistory.overlay.length);
    }
}

/**
 * 更新告警信息
 */
function updateAlarms(alarms) {
    state.alarms = alarms;
    
    const alarmList = document.getElementById('alarm-list');
    const alarmCount = document.getElementById('alarm-count');
    const alarmHistory = document.getElementById('alarm-history');
    
    // 更新告警计数
    alarmCount.textContent = alarms.length;
    
    // 清空告警列表
    alarmList.innerHTML = '';
    
    if (alarms.length === 0) {
        alarmList.innerHTML = '<div class="empty-state"><span>✅ 暂无告警信息</span></div>';
    } else {
        alarms.forEach(alarm => {
            const alarmElement = createAlarmElement(alarm);
            alarmList.appendChild(alarmElement);
        });
    }
    
    // 添加到历史
    if (alarms.length > 0) {
        const latestAlarm = alarms[0];
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <strong>${latestAlarm.node}:</strong> ${latestAlarm.message}
        `;
        
        const firstChild = alarmHistory.firstChild;
        if (firstChild) {
            alarmHistory.insertBefore(historyItem, firstChild);
        } else {
            alarmHistory.appendChild(historyItem);
        }
        
        // 限制历史数量
        while (alarmHistory.children.length > 10) {
            alarmHistory.removeChild(alarmHistory.lastChild);
        }
    }
}

/**
 * 创建告警元素
 */
function createAlarmElement(alarm) {
    const div = document.createElement('div');
    div.className = `alarm-item ${alarm.level}`;
    
    const time = new Date(alarm.timestamp).toLocaleTimeString();
    
    div.innerHTML = `
        <div class="alarm-header">
            <span class="alarm-node">🚨 ${alarm.node}</span>
            <span class="alarm-time">${time}</span>
        </div>
        <div class="alarm-message">${alarm.message}</div>
        <div class="alarm-suggestion">💡 ${alarm.suggestion}</div>
    `;
    
    return div;
}

/**
 * 更新当前时间
 */
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('current-time').textContent = timeString;
}

// ============================================================================
// 初始化和周期更新
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 应用已初始化');
    
    // 初始化空图表
    initCharts();
    
    // 图表标签页切换
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            console.log('📊 切换到图表:', e.target.dataset.chart);
            
            // 移除所有活动状态
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.chart-canvas').forEach(c => c.classList.remove('active'));
            
            // 激活选中的标签和图表
            e.target.classList.add('active');
            const chartId = e.target.dataset.chart;
            const chartElement = document.getElementById(`chart-${chartId}`);
            if (chartElement) {
                chartElement.classList.add('active');
            }
            
            // 重绘图表以适应容器
            setTimeout(() => {
                if (state.chartInstances[chartId]) {
                    state.chartInstances[chartId].resize();
                }
            }, 100);
        });
    });
    
    // 窗口大小变化时重新调整图表
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('📱 窗口大小变化，重新调整图表');
            Object.values(state.chartInstances).forEach(chart => {
                if (chart) {
                    chart.resize();
                }
            });
        }, 250);
    });
    
    // 设备方向变化时重新调整图表（移动设备）
    if (screen && screen.orientation) {
        screen.orientation.addEventListener('change', () => {
            setTimeout(() => {
                console.log('📱 设备方向变化，重新调整图表');
                Object.values(state.chartInstances).forEach(chart => {
                    if (chart) {
                        chart.resize();
                    }
                });
            }, 300);
        });
    }
    
    // 更新时间
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
    
    // 请求初始数据
    socket.emit('request_data');
    
    // 添加指标卡片点击事件
    document.querySelectorAll('.metric-card.clickable').forEach(card => {
        card.addEventListener('click', () => {
            const chartId = card.getAttribute('data-chart');
            if (chartId) {
                // 切换到对应的图表标签
                const tabBtn = document.querySelector(`.tab-btn[data-chart="${chartId}"]`);
                if (tabBtn) {
                    tabBtn.click();
                    // 平滑滚动到图表区域
                    document.querySelector('.chart-container').scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'nearest' 
                    });
                }
            }
        });
    });
});

// ============================================================================
// 导出（用于测试）
// ============================================================================
window.MonitorApp = {
    state,
    config,
    socket,
    updateMetrics,
    updateAlarms,
    initCharts
};
