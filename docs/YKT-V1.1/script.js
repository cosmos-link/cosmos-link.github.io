// 标签页切换功能
document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('.tab');
    const loginForm = document.getElementById('loginForm');

    // 标签页切换
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 给当前标签添加active类
            this.classList.add('active');
            
            // 获取用户类型
            const userType = this.dataset.type;
            console.log('切换到:', userType === 'enterprise' ? '企业用户' : '机构用户');
        });
    });

    // 表单提交
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const didInput = document.getElementById('did');
        const countrySelect = document.getElementById('country');
        const activeTab = document.querySelector('.tab.active');
        
        const loginData = {
            userType: activeTab.dataset.type === 'enterprise' ? '企业用户' : '机构用户',
            country: countrySelect.value,
            did: didInput.value
        };
        
        console.log('登录信息:', loginData);
        
        // 保存登录信息到sessionStorage
        sessionStorage.setItem('loginData', JSON.stringify(loginData));
        
        // 跳转到dashboard页面
        window.location.href = 'dashboard.html';
    });

    // 注册DID链接
    document.querySelector('a[href="#register"]').addEventListener('click', function(e) {
        e.preventDefault();
        alert('跳转到注册DID页面');
    });

    // 助记词恢复链接
    document.querySelector('a[href="#recover"]').addEventListener('click', function(e) {
        e.preventDefault();
        alert('跳转到助记词恢复页面');
    });
});
