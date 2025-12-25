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
            
            // 这里可以添加根据设备类型过滤设备的逻辑
            filterDevicesByType(deviceType);
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
        // 重新生成所有设备
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

// 根据设备类型过滤设备
function filterDevicesByType(deviceType) {
    console.log('加载设备类型', deviceType, '的设备...');
    // 这里可以添加从后端获取指定类型设备的逻辑
    // fetch(`/api/devices?type=${deviceType}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         updateDeviceGrid(data);
    //     });
}

// 搜索设备
function searchDevices(keyword) {
    console.log('搜索设备:', keyword);
    // 这里可以添加搜索逻辑
    // fetch(`/api/devices/search?keyword=${keyword}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         updateDeviceGrid(data);
    //     });
}

// 加载所有设备
function loadAllDevices() {
    console.log('加载所有设备...');
    // 这里可以添加重新加载所有设备的逻辑
}

// 更新设备网格
function updateDeviceGrid(devices) {
    const deviceGrid = document.getElementById('deviceGrid');
    // 这里可以根据返回的数据动态生成设备卡片
    console.log('更新设备网格:', devices);
}

// 生成随机设备编码
function generateDeviceCode() {
    const prefix = 'SN';
    const randomNum = Math.floor(Math.random() * 90000000) + 10000000;
    return prefix + randomNum;
}

// 生成随机设备名称
function generateDeviceName() {
    const models = ['PLC-S7', 'SIMATIC', 'SINAMICS', 'SITOP', 'ET200', 'CP343', 'S7-1200', 'S7-1500'];
    const model = models[Math.floor(Math.random() * models.length)];
    const number = Math.floor(Math.random() * 9000) + 1000;
    return model + '-' + number;
}

// 生成设备卡片
function generateDeviceCards() {
    const deviceGrid = document.getElementById('deviceGrid');
    deviceGrid.innerHTML = ''; // 清空现有内容
    
    // 状态类型循环
    const statuses = [
        { class: 'status-success', text: '已上链' },
        { class: 'status-error', text: '异常' },
        { class: 'status-pending', text: '未上链' }
    ];
    
    // 生成12个设备卡片
    for (let i = 0; i < 12; i++) {
        const statusIndex = i % 3;
        const status = statuses[statusIndex];
        
        const card = document.createElement('div');
        card.className = 'device-card';
        
        card.innerHTML = `
            <div class="device-info">
                <p><span class="label">设备名称:</span> ${generateDeviceName()}</p>
                <p><span class="label">设备编码:</span> ${generateDeviceCode()}</p>
                <p><span class="label">设备品牌:</span> 西门子</p>
                <p class="status-row">
                    <span class="label">区块链:</span> 
                    <span class="status ${status.class}">${status.text}</span>
                    <a href="#" class="link-detail">查看详情</a>
                </p>
            </div>
        `;
        
        deviceGrid.appendChild(card);
    }
    
    // 重新绑定事件
    bindDeviceCardEvents();
}

// 绑定设备卡片事件
function bindDeviceCardEvents() {
    // 查看详情链接
    const detailLinks = document.querySelectorAll('.link-detail');
    detailLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.device-card');
            const deviceName = card.querySelector('.device-info p:first-child').textContent;
            const deviceCode = card.querySelector('.device-info p:nth-child(2)').textContent;
            console.log('查看设备详情:', deviceName);
            
            // 显示区块链详情弹窗
            showBlockchainDetails(deviceName, deviceCode);
        });
    });
}

// 生成随机哈希
function generateHash() {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 40; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
}

// 生成随机区块高度
function generateBlockHeight() {
    return '#' + (Math.floor(Math.random() * 9000000) + 1000000);
}

// 生成随机时间戳（最近一周内）
function generateTimestamp() {
    const now = new Date();
    const pastTime = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
    const year = pastTime.getFullYear();
    const month = String(pastTime.getMonth() + 1).padStart(2, '0');
    const day = String(pastTime.getDate()).padStart(2, '0');
    const hour = String(pastTime.getHours()).padStart(2, '0');
    const minute = String(pastTime.getMinutes()).padStart(2, '0');
    const second = String(pastTime.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

// 生成随机Gas消耗
function generateGasUsed() {
    return (Math.floor(Math.random() * 50000) + 20000).toLocaleString() + ' Gwei';
}

// 显示区块链详情弹窗
function showBlockchainDetails(deviceName, deviceCode) {
    const modal = document.getElementById('blockchainModal');
    
    // 生成随机数据
    const blockHeight = generateBlockHeight();
    const blockTime = generateTimestamp();
    const txHash = generateHash();
    const gasUsed = generateGasUsed();
    const dataHash = 'SHA256: ' + generateHash().substring(2, 18) + '...';
    
    // 更新弹窗内容
    document.getElementById('blockHeight').textContent = blockHeight;
    document.getElementById('blockTime').textContent = blockTime;
    document.getElementById('txHash').textContent = txHash;
    document.getElementById('gasUsed').textContent = gasUsed;
    document.getElementById('originalHash').textContent = dataHash;
    document.getElementById('chainHash').textContent = dataHash;
    
    // 显示弹窗
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭弹窗
function closeModal() {
    const modal = document.getElementById('blockchainModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// 初始化弹窗事件
document.addEventListener('DOMContentLoaded', function() {
    // 现有的初始化代码...
    
    // 关闭按钮
    const closeBtn = document.getElementById('closeModal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 点击弹窗外部关闭
    const modal = document.getElementById('blockchainModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
});
