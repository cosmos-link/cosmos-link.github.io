// 页面加载时的初始化
document.addEventListener('DOMContentLoaded', function() {
    // 获取登录信息
    const loginData = JSON.parse(sessionStorage.getItem('loginData') || '{}');
    
    // 如果没有登录信息，跳转回登录页
    if (!loginData.did) {
        window.location.href = 'index.html';
        return;
    }

    // 标签切换功能
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有active类
            tabBtns.forEach(tab => tab.classList.remove('active'));
            // 添加当前active类
            this.classList.add('active');
            
            const category = this.dataset.category;
            console.log('切换到分类:', category);
            
            // 这里可以添加根据分类加载不同视频的逻辑
            loadCategoryVideos(category);
        });
    });

    // 视频卡片点击
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach(card => {
        card.addEventListener('click', function() {
            const videoIndex = this.dataset.index;
            console.log('点击视频:', videoIndex);
            
            // 高亮效果
            videoCards.forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            
            // 这里可以添加播放视频的逻辑
            playVideo(videoIndex);
        });
    });

    // 录制视频按钮
    document.getElementById('recordBtn').addEventListener('click', function() {
        console.log('点击录制视频');
        startRecording();
    });

    // 返回按钮
    document.getElementById('backBtn').addEventListener('click', function() {
        window.location.href = 'dashboard.html';
    });

    // 初始化视频数据
    initializeVideos();
});

// 加载分类视频
function loadCategoryVideos(category) {
    console.log('加载分类视频:', category);
    
    // 这里可以根据分类加载不同的视频数据
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach((card, index) => {
        const videoInfo = card.querySelector('.video-info');
        const title = videoInfo.querySelector('.video-title');
        const subtitle = videoInfo.querySelector('.video-subtitle');
        
        // 根据分类更新视频信息
        title.textContent = `${getCategoryName(category)}视频${index + 1}`;
        subtitle.textContent = `这是${getCategoryName(category)}分类的视频`;
    });
}

// 获取分类名称
function getCategoryName(category) {
    const categoryNames = {
        'life': '生活',
        'knowledge': '知识', 
        'shopping': '带货',
        'talent': '才艺'
    };
    return categoryNames[category] || '未知分类';
}

// 播放视频
function playVideo(videoIndex) {
    console.log('播放视频:', videoIndex);
    
    // 获取视频数据（按存储顺序）
    const uploadedVideos = getUploadedVideos();
    
    // videoIndex现在是卡片索引，直接使用它来获取视频
    if (videoIndex < uploadedVideos.length) {
        const video = uploadedVideos[videoIndex];
        alert(`播放视频: ${video.title}`);
    } else {
        alert(`视频未找到`);
    }
    
    // 示例：可以打开一个模态框显示视频播放器
    // showVideoPlayer(video);
}

// 开始录制视频
function startRecording() {
    console.log('开始录制视频');
    
    // 检查是否已达到10个视频的限制
    const uploadedVideos = getUploadedVideos();
    if (uploadedVideos.length >= 10) {
        alert('您已达到最多上传10个视频的限制！');
        return;
    }
    
    // 这里可以实现录制视频的逻辑
    // 例如：调用摄像头、录制功能等
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // 支持录制功能
        alert('开始录制视频...\n（实际项目中这里会启动摄像头录制功能）');
        
        // 模拟录制完成后的操作
        setTimeout(() => {
            const videoIndex = uploadedVideos.length + 1;
            addNewVideo(videoIndex);
        }, 2000);
    } else {
        alert('您的浏览器不支持录制功能');
    }
}

// 获取已上传的视频
function getUploadedVideos() {
    // 这里可以从服务器或本地存储获取已上传的视频列表
    // 暂时返回模拟数据
    return JSON.parse(localStorage.getItem('uploadedVideos') || '[]');
}

// 添加新视频
function addNewVideo(videoIndex) {
    console.log('添加新视频:', videoIndex);
    
    // 获取当前选中的分类
    const activeTab = document.querySelector('.category-tab.active');
    const category = activeTab ? activeTab.dataset.category : 'life';
    const categoryName = getCategoryName(category);
    
    // 更新本地存储
    const uploadedVideos = getUploadedVideos();
    const newVideo = {
        index: videoIndex,
        title: `我的录制视频${videoIndex}`,
        subtitle: `这是${categoryName}分类的视频`,
        category: category,
        uploadTime: new Date().toISOString()
    };
    
    uploadedVideos.push(newVideo);
    localStorage.setItem('uploadedVideos', JSON.stringify(uploadedVideos));
    
    // 如果这是第一个视频，更新界面状态
    if (uploadedVideos.length === 1) {
        const emptyState = document.getElementById('emptyState');
        const videoGrid = document.getElementById('videoGrid');
        emptyState.style.display = 'none';
        videoGrid.style.display = 'grid';
    }
    
    // 显示新的视频卡片
    showVideoCard(videoIndex - 1, newVideo);
    
    // 更新录制按钮状态
    updateRecordButtonState();
    
    alert(`视频 ${videoIndex} 录制完成并保存！`);
}


// 初始化视频数据
function initializeVideos() {
    console.log('初始化视频数据');
    
    // 获取已上传的视频
    const uploadedVideos = getUploadedVideos();
    const emptyState = document.getElementById('emptyState');
    const videoGrid = document.getElementById('videoGrid');
    
    if (uploadedVideos.length === 0) {
        // 没有视频时显示空状态
        emptyState.style.display = 'block';
        videoGrid.style.display = 'none';
    } else {
        // 有视频时隐藏空状态，显示视频网格
        emptyState.style.display = 'none';
        videoGrid.style.display = 'grid';
        
        // 加载已上传的视频（按上传顺序）
        uploadedVideos.forEach((video, index) => {
            if (index < 10) { // 最多10个视频
                showVideoCard(index, video);
            }
        });
    }
    
    // 更新录制按钮状态
    updateRecordButtonState();
}

// 显示视频卡片
function showVideoCard(cardIndex, videoData) {
    const videoCards = document.querySelectorAll('.video-card');
    if (cardIndex < videoCards.length) {
        const card = videoCards[cardIndex];
        const title = card.querySelector('.video-title');
        const subtitle = card.querySelector('.video-subtitle');
        const placeholder = card.querySelector('.placeholder-text');
        
        title.textContent = videoData.title;
        subtitle.textContent = videoData.subtitle;
        placeholder.textContent = `视频${videoData.index}`;
        
        // 设置data-index为cardIndex，这样点击时能正确匹配
        card.setAttribute('data-index', cardIndex);
        
        // 显示视频卡片
        card.classList.add('has-video');
    }
}

// 更新录制按钮状态
function updateRecordButtonState() {
    const uploadedVideos = getUploadedVideos();
    const recordBtn = document.getElementById('recordBtn');
    
    if (uploadedVideos.length >= 10) {
        recordBtn.textContent = '已达上限';
        recordBtn.disabled = true;
        recordBtn.style.opacity = '0.5';
        recordBtn.style.cursor = 'not-allowed';
    } else {
        recordBtn.textContent = `录制视频 (${uploadedVideos.length}/10)`;
        recordBtn.disabled = false;
        recordBtn.style.opacity = '1';
        recordBtn.style.cursor = 'pointer';
    }
}

// 删除视频功能（可选）
function deleteVideo(videoIndex) {
    if (confirm('确定要删除这个视频吗？')) {
        const uploadedVideos = getUploadedVideos();
        const filteredVideos = uploadedVideos.filter(video => video.index !== videoIndex);
        localStorage.setItem('uploadedVideos', JSON.stringify(filteredVideos));
        
        // 重新初始化页面
        location.reload();
    }
}