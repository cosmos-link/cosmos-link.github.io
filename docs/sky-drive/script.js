// ==================== 可调整参数 ====================
const CONFIG = {
    particleCount: 600,           // 粒子数量
    particleSpeedMin: 1.0,        // 粒子最小速度
    particleSpeedMax: 2.5,        // 粒子最大速度（speedMin + 2.0）
    particleSizeMin: 0.5,         // 粒子最小尺寸
    particleSizeMax: 2.5,         // 粒子最大尺寸（sizeMin + 2.0）
    particleColor: 'rgba(255, 255, 255',  // 粒子颜色（RGB格式，不含透明度）
    mouseRadius: 150,             // 鼠标影响范围
    mouseForce: 0.02,             // 鼠标推力强度
    connectionDistance: 120,      // 粒子连线距离
    connectionOpacity: 0.3,       // 连线最大透明度
    connectionColor: 'rgba(102, 126, 234',  // 连线颜色（RGB格式，不含透明度）
    connectionLineWidth: 0.5,     // 连线宽度
    trailLength: 10,              // 运动轨迹长度
    trailOpacity: 0.5,            // 轨迹透明度
    trailWidthMultiplier: 0.5,    // 轨迹宽度倍数
    fadeSpeed: 0.1,               // 画面淡出速度（越小拖尾越长）
    depthRange: 1500,             // 3D深度范围
    depthThreshold: 300,          // 连线深度阈值（只有靠近的粒子才连线）
    trailDepthThreshold: 500,     // 轨迹深度阈值（只有靠近的粒子才显示轨迹）
    projectionDistance: 1000,     // 3D投影距离
    opacityDepthDivisor: 1000,    // 透明度深度除数
    glowSizeMultiplier: 2,        // 发光效果尺寸倍数
    glowOpacity: 0.2,             // 发光效果透明度
    glowMinSize: 1                // 发光效果最小粒子尺寸
};
// ===================================================

// Canvas 设置
const canvas = document.getElementById('starfield');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: null, y: null, radius: CONFIG.mouseRadius };

// 粒子类
class Particle {
    constructor() {
        this.reset();
        // 初始化时随机分布在整个屏幕
        this.y = Math.random() * height;
    }

    // 重置粒子位置和属性
    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * CONFIG.depthRange;
        this.size = Math.random() * (CONFIG.particleSizeMax - CONFIG.particleSizeMin) + CONFIG.particleSizeMin;
        this.speed = Math.random() * (CONFIG.particleSpeedMax - CONFIG.particleSpeedMin) + CONFIG.particleSpeedMin;
        
        // 白色星星
        this.color = CONFIG.particleColor;
    }

    // 更新粒子位置
    update() {
        // 粒子向前移动（z轴减小）
        this.z -= this.speed;
        
        // 如果粒子移出屏幕，重置到远处
        if (this.z <= 0) {
            this.reset();
            this.z = CONFIG.depthRange;
        }

        // 3D 投影计算（将3D坐标转换为2D屏幕坐标）
        const scale = CONFIG.projectionDistance / (CONFIG.projectionDistance + this.z);
        this.projectedX = (this.x - width / 2) * scale + width / 2;
        this.projectedY = (this.y - height / 2) * scale + height / 2;
        this.projectedSize = this.size * scale;

        // 鼠标交互效果（粒子被鼠标推开）
        if (mouse.x !== null && mouse.y !== null) {
            const dx = this.projectedX - mouse.x;
            const dy = this.projectedY - mouse.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果粒子在鼠标影响范围内
            if (distance < mouse.radius) {
                const force = (mouse.radius - distance) / mouse.radius;
                this.x += dx * force * CONFIG.mouseForce;
                this.y += dy * force * CONFIG.mouseForce;
            }
        }
    }

    // 绘制粒子
    draw() {
        // 根据深度计算透明度（越近越亮）
        const opacity = Math.min(1, (CONFIG.depthRange - this.z) / CONFIG.opacityDepthDivisor);
        
        // 绘制星星主体
        ctx.beginPath();
        ctx.arc(this.projectedX, this.projectedY, this.projectedSize, 0, Math.PI * 2);
        ctx.fillStyle = `${this.color}, ${opacity})`;
        ctx.fill();

        // 添加发光效果（较大的星星有光晕）
        if (this.projectedSize > CONFIG.glowMinSize) {
            ctx.beginPath();
            ctx.arc(this.projectedX, this.projectedY, this.projectedSize * CONFIG.glowSizeMultiplier, 0, Math.PI * 2);
            ctx.fillStyle = `${this.color}, ${opacity * CONFIG.glowOpacity})`;
            ctx.fill();
        }

        // 绘制运动轨迹（只有靠近的粒子才显示）
        if (this.z < CONFIG.trailDepthThreshold) {
            // 计算上一帧的位置
            const prevScale = CONFIG.projectionDistance / (CONFIG.projectionDistance + this.z + this.speed * CONFIG.trailLength);
            const prevX = (this.x - width / 2) * prevScale + width / 2;
            const prevY = (this.y - height / 2) * prevScale + height / 2;

            // 绘制从上一帧到当前位置的线条
            ctx.beginPath();
            ctx.moveTo(prevX, prevY);
            ctx.lineTo(this.projectedX, this.projectedY);
            ctx.strokeStyle = `${this.color}, ${opacity * CONFIG.trailOpacity})`;
            ctx.lineWidth = this.projectedSize * CONFIG.trailWidthMultiplier;
            ctx.stroke();
        }
    }
}

// 连接附近的粒子（形成网络效果）
function connectParticles() {
    // 遍历所有粒子对
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            // 计算两个粒子之间的距离
            const dx = particles[i].projectedX - particles[j].projectedX;
            const dy = particles[i].projectedY - particles[j].projectedY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果距离小于阈值且都在靠近位置，绘制连线
            if (distance < CONFIG.connectionDistance && 
                particles[i].z < CONFIG.depthThreshold && 
                particles[j].z < CONFIG.depthThreshold) {
                // 根据距离计算透明度（越近越亮）
                const opacity = (CONFIG.connectionDistance - distance) / CONFIG.connectionDistance * CONFIG.connectionOpacity;
                ctx.beginPath();
                ctx.moveTo(particles[i].projectedX, particles[i].projectedY);
                ctx.lineTo(particles[j].projectedX, particles[j].projectedY);
                ctx.strokeStyle = `${CONFIG.connectionColor}, ${opacity})`;
                ctx.lineWidth = CONFIG.connectionLineWidth;
                ctx.stroke();
            }
        }
    }
}

// 初始化画布和粒子
function init() {
    // 设置画布尺寸为窗口尺寸
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // 创建粒子数组
    particles = [];
    for (let i = 0; i < CONFIG.particleCount; i++) {
        particles.push(new Particle());
    }
}

// 动画循环
function animate() {
    // 使用半透明黑色覆盖画布，产生拖尾效果
    ctx.fillStyle = `rgba(9, 10, 15, ${CONFIG.fadeSpeed})`;
    ctx.fillRect(0, 0, width, height);

    // 更新并绘制所有粒子
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // 绘制粒子之间的连线
    connectParticles();

    // 请求下一帧动画
    requestAnimationFrame(animate);
}

// ==================== 事件监听 ====================

// 窗口大小改变时重新初始化
window.addEventListener('resize', init);

// 鼠标移动事件
canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

// 鼠标离开画布时清除鼠标位置
canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
});

// 触摸移动支持（移动设备）
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    mouse.x = e.touches[0].clientX;
    mouse.y = e.touches[0].clientY;
});

// 触摸结束时清除触摸位置
canvas.addEventListener('touchend', () => {
    mouse.x = null;
    mouse.y = null;
});

// ==================== 启动程序 ====================
init();
animate();
