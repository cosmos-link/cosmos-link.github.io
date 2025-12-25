document.addEventListener('DOMContentLoaded', function() {
    // 检查是否有登录信息
    const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    
    if (!loginData.did) {
        window.location.href = 'index.html';
        return;
    }

    // 初始化设备列表
    generateDeviceCards();

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
