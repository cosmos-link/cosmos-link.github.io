document.addEventListener('DOMContentLoaded', function() {
    // 检查是否有登录信息
    const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    
    if (!loginData.did) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化设备列表
    generateDeviceCards();
    
    // 启动定时更新算力数据
    startDynamicUpdate();

    // 设备类型标签切换
    const deviceTypeTabs = document.querySelectorAll('.device-type-tab');
    deviceTypeTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            deviceTypeTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            const deviceType = this.dataset.type;
            console.log('切换到设备类型:', deviceType);
            
            // 重新生成设备列表
            generateDeviceCards();
        });
    });

    // 搜索按钮
    document.getElementById('searchBtn').addEventListener('click', function() {
        const deviceName = document.getElementById('deviceName').value.trim();
        if (deviceName) {
            console.log('搜索设备:', deviceName);
            searchDevices(deviceName);
        } else {
            alert('请输入设备名称');
        }
    });

    // 取消按钮
    document.getElementById('cancelBtn').addEventListener('click', function() {
        document.getElementById('deviceName').value = '';
        generateDeviceCards();
    });

    // 搜索框回车搜索
    document.getElementById('deviceName').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('searchBtn').click();
        }
    });

    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // 退出按钮
    document.getElementById('exitBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });
});

// 生成随机设备编码
function generateDeviceCode() {
    const prefix = 'SN';
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    return prefix + randomNum;
}

// 生成随机设备名称
function generateDeviceName() {
    const prefix = '设备';
    const number = String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0');
    return prefix + number;
}

// 生成随机算力值
function generateHashRate() {
    return Math.floor(Math.random() * 5000) + 1000;
}

// 生成设备卡片
function generateDeviceCards() {
    const deviceGrid = document.getElementById('deviceGrid');
    deviceGrid.innerHTML = '';
    
    // 生成12个设备卡片
    for (let i = 0; i < 12; i++) {
        const usedHashRate = generateHashRate();
        const remainingHashRate = Math.floor(Math.random() * 200) + 50;
        
        const card = document.createElement('div');
        card.className = 'device-card';
        
        card.innerHTML = `
            <div class="device-info-row">
                <span class="label">设备名称:</span> ${generateDeviceName()}
            </div>
            <div class="device-info-row">
                <span class="label">设备编码:</span> ${generateDeviceCode()}
            </div>
            <div class="section-title">算力情况</div>
            <div class="power-info">
                <div class="power-item">
                    <span class="power-label">已使用:</span>
                    <span class="power-value used">${usedHashRate}H/s</span>
                </div>
                <div class="power-item">
                    <span class="power-label">剩余:</span>
                    <span class="power-value remaining">${remainingHashRate}H/s</span>
                </div>
            </div>
            <button class="btn-view">查看</button>
        `;
        
        deviceGrid.appendChild(card);
    }
    
    // 绑定查看按钮事件
    bindViewButtons();
}

// 绑定查看按钮事件
function bindViewButtons() {
    const viewButtons = document.querySelectorAll('.btn-view');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const card = this.closest('.device-card');
            const deviceName = card.querySelector('.device-info-row:first-child').textContent;
            const deviceCode = card.querySelector('.device-info-row:nth-child(2)').textContent;
            console.log('查看设备详情:', deviceName, deviceCode);
            alert('设备算力详情功能开发中...\n' + deviceName + '\n' + deviceCode);
        });
    });
}

// 搜索设备
function searchDevices(keyword) {
    console.log('搜索设备:', keyword);
    // 这里可以添加搜索逻辑
    alert('搜索功能开发中...\n关键词: ' + keyword);
}

// 启动动态更新
let updateInterval = null;

function startDynamicUpdate() {
    // 每2秒更新一次所有设备的算力数据
    updateInterval = setInterval(function() {
        updateAllDevicePower();
    }, 2000);
}

// 更新所有设备的算力数据
function updateAllDevicePower() {
    const deviceCards = document.querySelectorAll('.device-card');
    
    deviceCards.forEach(card => {
        const usedElement = card.querySelector('.power-value.used');
        const remainingElement = card.querySelector('.power-value.remaining');
        
        if (usedElement && remainingElement) {
            // 获取当前值
            const currentUsed = parseInt(usedElement.textContent);
            const currentRemaining = parseInt(remainingElement.textContent);
            
            // 生成新的算力值（在当前值附近小幅波动）
            const usedChange = Math.floor(Math.random() * 200) - 100; // -100到+100的变化
            const remainingChange = Math.floor(Math.random() * 20) - 10; // -10到+10的变化
            
            let newUsed = currentUsed + usedChange;
            let newRemaining = currentRemaining + remainingChange;
            
            // 限制范围
            newUsed = Math.max(1000, Math.min(5000, newUsed));
            newRemaining = Math.max(30, Math.min(300, newRemaining));
            
            // 更新显示
            usedElement.textContent = newUsed + 'H/s';
            remainingElement.textContent = newRemaining + 'H/s';
            
            // 添加更新动画效果
            usedElement.style.transition = 'color 0.3s ease';
            usedElement.style.color = '#FF5722';
            setTimeout(() => {
                usedElement.style.color = '#FF9800';
            }, 300);
        }
    });
}

// 清理定时器
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});
