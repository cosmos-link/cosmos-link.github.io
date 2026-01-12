// 初始化TODO列表
let todos = [];
let currentFilter = 'all';

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadTodos();
    renderTodos();
    updateStats();
});

// 从本地存储加载TODO
function loadTodos() {
    const savedTodos = localStorage.getItem('todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    }
}

// 保存TODO到本地存储
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

// 添加新的TODO
function addTodo() {
    const input = document.getElementById('todoInput');
    const text = input.value.trim();
    
    if (text) {
        const newTodo = {
            id: Date.now(),
            text: text,
            completed: false
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos();
        updateStats();
        input.value = '';
        input.focus();
    }
}

// 删除TODO
function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
}

// 切换TODO完成状态
function toggleTodo(id) {
    todos = todos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    saveTodos();
    renderTodos();
    updateStats();
}

// 开始编辑TODO
function startEdit(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const item = document.querySelector(`[data-id="${id}"]`);
    const textSpan = item.querySelector('.todo-text');
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit-input';
    input.value = todo.text;
    
    textSpan.replaceWith(input);
    input.focus();
    
    // 保存编辑
    function saveEdit() {
        const newText = input.value.trim();
        if (newText) {
            todo.text = newText;
            saveTodos();
            renderTodos();
        } else {
            renderTodos();
        }
    }
    
    input.addEventListener('blur', saveEdit);
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveEdit();
        }
    });
}

// 过滤TODO
function filterTodos(filter) {
    currentFilter = filter;
    renderTodos();
}

// 获取过滤后的TODO
function getFilteredTodos() {
    switch(currentFilter) {
        case 'active':
            return todos.filter(todo => !todo.completed);
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos;
    }
}

// 渲染TODO列表
function renderTodos() {
    const todoList = document.getElementById('todoList');
    const filteredTodos = getFilteredTodos();
    
    todoList.innerHTML = '';
    
    filteredTodos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.setAttribute('data-id', todo.id);
        
        li.innerHTML = `
            <input type="checkbox" 
                   ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text">${todo.text}</span>
            <button onclick="startEdit(${todo.id})">编辑</button>
            <button onclick="deleteTodo(${todo.id})">删除</button>
        `;
        
        todoList.appendChild(li);
    });
}

// 更新统计信息
function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    
    document.getElementById('todoCount').textContent = 
        `${active}个待办事项（共${total}个）`;
}

// 清除已完成的TODO
function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
    saveTodos();
    renderTodos();
    updateStats();
}

// 支持按Enter键添加TODO
document.getElementById('todoInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addTodo();
    }
});