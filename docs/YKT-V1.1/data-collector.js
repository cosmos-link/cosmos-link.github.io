// 温度波形图相关变量
let temperatureChart = null;
let temperatureData = [];
let chartUpdateInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    // 检查是否有登录信息
    const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    
    if (!loginData.did) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化温度波形图
    initTemperatureChart();

    // 参数标签切换
    const paramTabs = document.querySelectorAll('.param-tab');
    paramTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            paramTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            console.log('切换参数:', this.textContent);
            // 这里可以添加切换不同参数显示的逻辑
        });
    });

    // 退出按钮
    document.getElementById('exitBtn').addEventListener('click', function() {
        // 返回到dashboard页面
        window.location.href = 'dashboard.html';
    });

    // 设置按钮
    document.getElementById('settingsBtn').addEventListener('click', function() {
        alert('设置功能开发中...');
    });

    // 操作按钮
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent.trim();
            if (text) {
                console.log('点击操作:', text);
            } else {
                console.log('点击操作按钮');
            }
        });
    });

    // 告警行点击
    const alertRows = document.querySelectorAll('.alert-row');
    alertRows.forEach(row => {
        row.addEventListener('click', function() {
            if (this.querySelector('td:nth-child(2)').textContent.trim()) {
                console.log('查看告警详情');
                // 可以添加显示告警详情的逻辑
            }
        });
    });

    // 模拟实时数据更新
    setInterval(updateGaugeData, 3000);
});

// 模拟更新仪表数据
function updateGaugeData() {
    // 这里可以添加从后端获取实时数据并更新仪表盘的逻辑
    console.log('更新仪表数据...');
}

// 初始化温度波形图
function initTemperatureChart() {
    const canvas = document.getElementById('temperatureChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 设置canvas实际大小
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // 初始化数据（60个数据点）
    for (let i = 0; i < 60; i++) {
        temperatureData.push(25 + Math.random() * 5);
    }
    
    // 绘制初始图表
    drawTemperatureChart(ctx, rect.width, rect.height);
    
    // 开始实时更新
    chartUpdateInterval = setInterval(function() {
        // 移除最旧的数据，添加新数据
        temperatureData.shift();
        const newTemp = 25 + Math.random() * 5;
        temperatureData.push(newTemp);
        
        // 更新当前温度显示
        document.getElementById('currentTemp').textContent = newTemp.toFixed(1) + '°C';
        
        // 重绘图表
        drawTemperatureChart(ctx, rect.width, rect.height);
    }, 1000);
}

// 绘制温度波形图
function drawTemperatureChart(ctx, width, height) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
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
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // 绘制Y轴刻度标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const temp = 30 - i * 2;
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(temp + '°C', padding - 10, y + 4);
    }
    
    // 绘制温度曲线
    if (temperatureData.length > 1) {
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const xStep = chartWidth / (temperatureData.length - 1);
        
        temperatureData.forEach((temp, index) => {
            const x = padding + index * xStep;
            // 将温度映射到y坐标（20-30°C映射到图表高度）
            const normalizedTemp = (temp - 20) / 10; // 归一化到0-1
            const y = height - padding - normalizedTemp * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制填充区域
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(255, 87, 34, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 87, 34, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制最新数据点
        const lastX = width - padding;
        const lastTemp = temperatureData[temperatureData.length - 1];
        const lastY = height - padding - ((lastTemp - 20) / 10) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF5722';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 清理定时器
window.addEventListener('beforeunload', function() {
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
});

// 初始化温度波形图
function initTemperatureChart() {
    const canvas = document.getElementById('temperatureChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // 设置canvas实际大小
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // 初始化数据（60个数据点）
    for (let i = 0; i < 60; i++) {
        temperatureData.push(25 + Math.random() * 5);
    }
    
    // 绘制初始图表
    drawTemperatureChart(ctx, rect.width, rect.height);
    
    // 开始实时更新
    chartUpdateInterval = setInterval(function() {
        // 移除最旧的数据，添加新数据
        temperatureData.shift();
        const newTemp = 25 + Math.random() * 5;
        temperatureData.push(newTemp);
        
        // 更新当前温度显示
        document.getElementById('currentTemp').textContent = newTemp.toFixed(1) + '°C';
        
        // 重绘图表
        drawTemperatureChart(ctx, rect.width, rect.height);
    }, 1000);
}

// 绘制温度波形图
function drawTemperatureChart(ctx, width, height) {
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
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
        ctx.lineTo(x, height - padding);
        ctx.stroke();
    }
    
    // 绘制坐标轴
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // 绘制Y轴刻度标签
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const temp = 30 - i * 2;
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(temp + '°C', padding - 10, y + 4);
    }
    
    // 绘制温度曲线
    if (temperatureData.length > 1) {
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const xStep = chartWidth / (temperatureData.length - 1);
        
        temperatureData.forEach((temp, index) => {
            const x = padding + index * xStep;
            // 将温度映射到y坐标（20-30°C映射到图表高度）
            const normalizedTemp = (temp - 20) / 10; // 归一化到0-1
            const y = height - padding - normalizedTemp * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // 绘制填充区域
        ctx.lineTo(width - padding, height - padding);
        ctx.lineTo(padding, height - padding);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
        gradient.addColorStop(0, 'rgba(255, 87, 34, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 87, 34, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制最新数据点
        const lastX = width - padding;
        const lastTemp = temperatureData[temperatureData.length - 1];
        const lastY = height - padding - ((lastTemp - 20) / 10) * chartHeight;
        
        ctx.beginPath();
        ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FF5722';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// 清理定时器
window.addEventListener('beforeunload', function() {
    if (chartUpdateInterval) {
        clearInterval(chartUpdateInterval);
    }
});
