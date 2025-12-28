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

    // 我的按钮 - 显示钱包浮层
    document.getElementById('profileBtn').addEventListener('click', function() {
        showWalletOverlay();
    });

    // 钱包浮层相关功能
    function showWalletOverlay() {
        const overlay = document.getElementById('walletOverlay');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // 防止背景滚动
    }

    function hideWalletOverlay() {
        const overlay = document.getElementById('walletOverlay');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    // 钱包浮层关闭按钮
    document.getElementById('walletClose').addEventListener('click', hideWalletOverlay);

    // 点击浮层外部关闭
    document.getElementById('walletOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            hideWalletOverlay();
        }
    });

    // 钱包功能按钮
    document.getElementById('transferBtn').addEventListener('click', function() {
        alert('转账功能开发中...');
    });

    document.getElementById('withdrawBtn').addEventListener('click', function() {
        alert('提现功能开发中...');
    });

    // 兑换按钮
    document.getElementById('exchangeBtn').addEventListener('click', function() {
        hideWalletOverlay();
        showExchangeOverlay();
    });

    // 兑换浮层功能
    function showExchangeOverlay() {
        const overlay = document.getElementById('exchangeOverlay');
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // 获取当前钱包币种
        const currentCurrency = document.getElementById('currencySelector').childNodes[0].textContent.trim();
        
        // 设置来源币种为当前币种
        document.getElementById('fromCurrencyExchange').value = currentCurrency;
        
        // 根据来源币种更新目标币种选项
        updateToCurrencyOptions(currentCurrency);
        updateExchangeRate();
    }
    
    function hideExchangeOverlay() {
        const overlay = document.getElementById('exchangeOverlay');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // 重置输入
        document.getElementById('fromAmountExchange').value = '0';
        document.getElementById('toAmountExchange').value = '0';
    }
    
    // 兑换浮层事件监听
    document.getElementById('exchangeClose').addEventListener('click', hideExchangeOverlay);
    
    // 点击兑换浮层外部关闭
    document.getElementById('exchangeOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            hideExchangeOverlay();
        }
    });
    
    // 输入金额时自动计算
    document.getElementById('fromAmountExchange').addEventListener('input', updateConversion);
    document.getElementById('fromCurrencyExchange').addEventListener('change', function() {
        const fromCurrency = this.value;
        updateToCurrencyOptions(fromCurrency);
        updateExchangeRate();
        updateConversion();
    });
    document.getElementById('toCurrencyExchange').addEventListener('change', function() {
        updateExchangeRate();
        updateConversion();
    });
    
    // 确认兑换
    document.getElementById('exchangeConfirmBtn').addEventListener('click', function() {
        const fromAmount = document.getElementById('fromAmountExchange').value;
        const fromCurrency = document.getElementById('fromCurrencyExchange').value;
        const toCurrency = document.getElementById('toCurrencyExchange').value;
        
        if (fromAmount > 0) {
            alert(`兑换 ${fromAmount} ${fromCurrency} 到 ${toCurrency} 成功！`);
            hideExchangeOverlay();
        } else {
            alert('请输入有效的兑换金额');
        }
    });
    
    // 更新目标币种选项
    function updateToCurrencyOptions(fromCurrency) {
        const toCurrencySelect = document.getElementById('toCurrencyExchange');
        
        // 清空现有选项
        toCurrencySelect.innerHTML = '';
        
        if (fromCurrency === 'YKT-CNY') {
            // 如果来源是YKT-CNY，可以兑换到YKT-JL和YKT-ZL
            toCurrencySelect.innerHTML = `
                <option value="YKT-JL">YKT-JL</option>
                <option value="YKT-ZL">YKT-ZL</option>
            `;
        } else {
            // 如果来源是其他币种，只能兑换到YKT-CNY
            toCurrencySelect.innerHTML = `
                <option value="YKT-CNY">YKT-CNY</option>
            `;
        }
        
        // 设置默认选中第一个选项
        toCurrencySelect.selectedIndex = 0;
    }

    // 更新汇率显示
    function updateExchangeRate() {
        const fromCurrency = document.getElementById('fromCurrencyExchange').value;
        const toCurrency = document.getElementById('toCurrencyExchange').value;
        
        // 汇率规则：1 YKT-CNY = 10 YKT-JL = 100 YKT-ZL
        let rate = 1;
        
        if (fromCurrency === 'YKT-CNY' && toCurrency === 'YKT-JL') {
            rate = 10;
        } else if (fromCurrency === 'YKT-CNY' && toCurrency === 'YKT-ZL') {
            rate = 100;
        } else if (fromCurrency === 'YKT-JL' && toCurrency === 'YKT-CNY') {
            rate = 0.1;
        } else if (fromCurrency === 'YKT-ZL' && toCurrency === 'YKT-CNY') {
            rate = 0.01;
        }
        
        document.getElementById('exchangeRateText').textContent = `汇率: 1 ${fromCurrency} = ${rate} ${toCurrency}`;
        
        // 存储当前汇率供计算使用
        window.currentRate = rate;
    }
    
    // 更新兑换计算
    function updateConversion() {
        const fromAmount = parseFloat(document.getElementById('fromAmountExchange').value) || 0;
        const toAmount = fromAmount * (window.currentRate || 1);
        document.getElementById('toAmountExchange').value = toAmount.toFixed(2);
    }



    // 币种选择器功能
    const currencySelector = document.getElementById('currencySelector');
    const currencyDropdown = document.getElementById('currencyDropdown');
    
    currencySelector.addEventListener('click', function(e) {
        e.stopPropagation();
        currencyDropdown.classList.toggle('show');
        currencySelector.classList.toggle('active');
        
        // 设置下拉框位置
        const rect = currencySelector.getBoundingClientRect();
        currencyDropdown.style.top = rect.bottom + 5 + 'px';
        currencyDropdown.style.left = rect.left + 'px';
    });
    
    // 币种选择选项点击
    const currencyOptions = document.querySelectorAll('.currency-option');
    currencyOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedCurrency = this.dataset.currency;
            
            // 更新显示的币种
            const currencyText = currencySelector.childNodes[0];
            currencyText.textContent = selectedCurrency + ' ';
            
            // 更新选中状态
            currencyOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // 隐藏下拉框
            currencyDropdown.classList.remove('show');
            currencySelector.classList.remove('active');
        });
    });

    
    // 全局点击关闭下拉框
    document.addEventListener('click', function() {
        currencyDropdown.classList.remove('show');
        currencySelector.classList.remove('active');
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
