class BlogApp {
    constructor() {
        this.currentView = 'home';
        this.currentBlogId = null;
        this.initializeElements();
        this.attachEventListeners();
        this.loadBlogs();
        this.updateStats();
    }

    initializeElements() {
        this.views = {
            home: document.getElementById('homeView'),
            editor: document.getElementById('editorView'),
            list: document.getElementById('listView'),
            detail: document.getElementById('detailView')
        };

        this.buttons = {
            home: document.getElementById('homeBtn'),
            new: document.getElementById('newBtn'),
            list: document.getElementById('listBtn'),
            cancel: document.getElementById('cancelBtn'),
            back: document.getElementById('backBtn'),
            edit: document.getElementById('editBtn'),
            delete: document.getElementById('deleteBtn')
        };

        this.form = document.getElementById('blogForm');
        this.titleInput = document.getElementById('title');
        this.contentInput = document.getElementById('content');
        this.tagsInput = document.getElementById('tags');
        this.blogList = document.getElementById('blogList');
        this.detailTitle = document.getElementById('detailTitle');
        this.detailDate = document.getElementById('detailDate');
        this.detailTags = document.getElementById('detailTags');
        this.detailContent = document.getElementById('detailContent');
        this.blogCount = document.getElementById('blogCount');
        this.lastUpdate = document.getElementById('lastUpdate');
    }

    attachEventListeners() {
        this.buttons.home.addEventListener('click', () => this.showView('home'));
        this.buttons.new.addEventListener('click', () => this.showEditor());
        this.buttons.list.addEventListener('click', () => this.showBlogList());
        this.buttons.cancel.addEventListener('click', () => this.showView('home'));
        this.buttons.back.addEventListener('click', () => this.showBlogList());
        this.buttons.edit.addEventListener('click', () => this.editCurrentBlog());
        this.buttons.delete.addEventListener('click', () => this.deleteCurrentBlog());
        this.form.addEventListener('submit', (e) => this.saveBlog(e));
    }

    showView(viewName) {
        Object.values(this.views).forEach(view => view.style.display = 'none');
        this.views[viewName].style.display = 'block';
        this.currentView = viewName;
    }

    showEditor(blog = null) {
        this.showView('editor');
        this.titleInput.value = blog ? blog.title : '';
        this.contentInput.value = blog ? blog.content : '';
        this.tagsInput.value = blog ? blog.tags.join(', ') : '';
        this.currentBlogId = blog ? blog.id : null;
    }

    showBlogList() {
        this.showView('list');
        this.renderBlogList();
    }

    showBlogDetail(blog) {
        this.showView('detail');
        this.currentBlogId = blog.id;
        this.detailTitle.textContent = blog.title;
        this.detailDate.textContent = `发布于：${new Date(blog.createdAt).toLocaleString()}`;
        this.detailTags.textContent = `标签：${blog.tags.join(', ')}`;
        this.detailContent.innerHTML = this.renderMarkdown(blog.content);
    }

    renderMarkdown(text) {
        // 简单的Markdown渲染
        return text
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>');
    }

    saveBlog(e) {
        e.preventDefault();

        const blog = {
            id: this.currentBlogId || Date.now().toString(),
            title: this.titleInput.value.trim(),
            content: this.contentInput.value.trim(),
            tags: this.tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            createdAt: this.currentBlogId ? this.getBlog(this.currentBlogId).createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const blogs = this.getBlogs();
        const index = blogs.findIndex(b => b.id === blog.id);
        
        if (index > -1) {
            blogs[index] = blog;
        } else {
            blogs.push(blog);
        }

        localStorage.setItem('blogs', JSON.stringify(blogs));
        this.showView('home');
        this.updateStats();
        this.form.reset();
        this.currentBlogId = null;
    }

    renderBlogList() {
        const blogs = this.getBlogs();
        this.blogList.innerHTML = '';

        if (blogs.length === 0) {
            this.blogList.innerHTML = '<p class="no-blogs">还没有博客，点击"写博客"开始创作吧！</p>';
            return;
        }

        blogs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).forEach(blog => {
            const blogElement = document.createElement('div');
            blogElement.className = 'blog-item';
            blogElement.innerHTML = `
                <h3>${blog.title}</h3>
                <div class="blog-meta">
                    <span>${new Date(blog.updatedAt).toLocaleDateString()}</span>
                    <span>${blog.tags.join(', ')}</span>
                </div>
                <p>${blog.content.substring(0, 100)}${blog.content.length > 100 ? '...' : ''}</p>
            `;
            blogElement.addEventListener('click', () => this.showBlogDetail(blog));
            this.blogList.appendChild(blogElement);
        });
    }

    editCurrentBlog() {
        const blog = this.getBlog(this.currentBlogId);
        if (blog) {
            this.showEditor(blog);
        }
    }

    deleteCurrentBlog() {
        if (confirm('确定要删除这篇博客吗？')) {
            const blogs = this.getBlogs();
            const filteredBlogs = blogs.filter(blog => blog.id !== this.currentBlogId);
            localStorage.setItem('blogs', JSON.stringify(filteredBlogs));
            this.showBlogList();
            this.updateStats();
        }
    }

    getBlogs() {
        const blogsJson = localStorage.getItem('blogs');
        return blogsJson ? JSON.parse(blogsJson) : [];
    }

    getBlog(id) {
        return this.getBlogs().find(blog => blog.id === id);
    }

    loadBlogs() {
        if (!localStorage.getItem('blogs')) {
            // 初始化一些示例博客
            const sampleBlogs = [
                {
                    id: '1',
                    title: '欢迎来到程序员博客',
                    content: '这是一个基于浏览器本地存储的博客系统。\n\n## 功能特点\n\n* 数据存储在浏览器本地\n* 支持Markdown格式\n* 可以添加标签\n* 随时编辑和删除\n\n## 开始使用\n\n点击"写博客"按钮开始创作吧！',
                    tags: ['欢迎', '指南'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'JavaScript闭包详解',
                    content: '闭包是JavaScript中一个重要的概念。\n\n```javascript\nfunction outer() {\n    let count = 0;\n    return function inner() {\n        count++;\n        return count;\n    };\n}\n\nconst counter = outer();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n```',
                    tags: ['JavaScript', '编程', '闭包'],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            localStorage.setItem('blogs', JSON.stringify(sampleBlogs));
        }
    }

    updateStats() {
        const blogs = this.getBlogs();
        this.blogCount.textContent = blogs.length;
        
        if (blogs.length > 0) {
            const latestBlog = blogs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
            this.lastUpdate.textContent = new Date(latestBlog.updatedAt).toLocaleDateString();
        } else {
            this.lastUpdate.textContent = '- -';
        }
    }
}

// 初始化应用
window.addEventListener('DOMContentLoaded', () => {
    new BlogApp();
});