// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取登录信息
    const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    
    // 如果没有登录信息，跳转回登录页
    if (!loginData.did) {
        window.location.href = 'index.html';
        return;
    }

    // 显示企业信息
    if (loginData.userType === '企业用户') {
        const companyNameElement = document.getElementById('companyName');
        // 这里可以根据实际需求显示真实的工厂名称
        companyNameElement.textContent = '***有限公司';
    }

    // 行业标签切换
    const industryTabs = document.querySelectorAll('.industry-tab');
    industryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有active类
            industryTabs.forEach(t => t.classList.remove('active'));
            // 添加当前active类
            this.classList.add('active');
            
            const industry = this.dataset.industry;
            console.log('切换到行业:', this.textContent);
            
            // 这里可以添加加载不同行业应用的逻辑
            loadIndustryApps(industry);
        });
    });

    // 应用卡片点击
    const appCards = document.querySelectorAll('.app-card');
    appCards.forEach(card => {
        card.addEventListener('click', function() {
            const appName = this.querySelector('.app-name').textContent;
            console.log('点击应用:', appName);
            
            // 高亮效果
            appCards.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // 根据应用名称跳转到对应页面
            if (appName === '数据采集器') {
                window.location.href = 'data-collector.html';
            } else if (appName === '上链数据') {
                window.location.href = 'blockchain-data.html';
            } else if (appName === '算力中心') {
                window.location.href = 'computing-power.html';
            } else {
                alert('打开应用: ' + appName);
            }
        });
    });

    // 退出按钮
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('确定要退出吗？')) {
            sessionStorage.removeItem('loginData');
            window.location.href = 'index.html';
        }
    });

    // 我的按钮
    document.getElementById('profileBtn').addEventListener('click', function() {
        alert('个人中心功能开发中...\n\n用户信息:\n' + 
              '类型: ' + loginData.userType + '\n' +
              '国家: ' + loginData.country + '\n' +
              'DID: ' + loginData.did);
    });

    // 分页指示器
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.addEventListener('click', function() {
            dots.forEach(d => d.classList.remove('active'));
            this.classList.add('active');
            console.log('切换到页面:', index + 1);
        });
    });
});

// 加载行业应用
function loadIndustryApps(industry) {
    // 这里可以添加根据行业加载不同应用的逻辑
    console.log('加载行业应用:', industry);
    
    // 示例：可以通过API获取应用列表
    // fetch(`/api/apps?industry=${industry}`)
    //     .then(response => response.json())
    //     .then(data => {
    //         // 更新应用网格
    //     });
}
