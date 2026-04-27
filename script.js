const inputField = document.getElementById('todo-input');
const priorityField = document.getElementById('priority-input');
const addButton = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const clearAllBtn = document.getElementById('clear-all-btn');

// 🚀 ระบบลากวาง (Drag & Drop)
new Sortable(todoList, {
    animation: 200,
    handle: 'li', // ให้ลากได้ทั้งแผ่น
    onEnd: function() {
        updateOrder();
        saveData();
    }
});

function saveData() {
    localStorage.setItem("mySmartTodoV4_Fixed", todoList.innerHTML);
}

function loadData() {
    const saved = localStorage.getItem("mySmartTodoV4_Fixed");
    if (saved) {
        todoList.innerHTML = saved;
        attachEvents();
        updateOrder();
    }
}

function updateOrder() {
    const items = todoList.querySelectorAll('li');
    items.forEach((item, index) => {
        const orderSpan = item.querySelector('.order-number');
        if (orderSpan) orderSpan.innerText = `${index + 1}.`;
    });
}

function addTodo() {
    const text = inputField.value.trim();
    const prio = priorityField.value;
    if (!text) return;

    const li = document.createElement('li');
    li.className = prio; // 'urgent' หรือ 'normal'
    
    const time = new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'});

    li.innerHTML = `
        <div class="todo-content">
            <span class="order-number"></span>
            <div class="todo-details">
                <div>
                    <span class="todo-text">${text}</span>
                    <span class="badge ${prio === 'urgent' ? 'bg-urgent' : 'bg-normal'}">
                        ${prio === 'urgent' ? 'ด่วน' : 'ปกติ'}
                    </span>
                </div>
                <span class="timestamp">เมื่อ: ${time}</span>
            </div>
        </div>
        <div class="btn-group">
            <button class="done-btn">✔</button>
            <button class="delete-btn">ลบ</button>
        </div>
    `;

    todoList.appendChild(li);
    inputField.value = "";
    bindActions(li);
    updateOrder();
    saveData();
}

function bindActions(item) {
    const doneBtn = item.querySelector('.done-btn');
    const delBtn = item.querySelector('.delete-btn');

    doneBtn.addEventListener('click', () => {
        item.classList.toggle('done');
        doneBtn.innerText = item.classList.contains('done') ? '↩' : '✔';
        saveData();
    });

    delBtn.addEventListener('click', () => {
        item.remove();
        updateOrder();
        saveData();
    });
}

function attachEvents() {
    todoList.querySelectorAll('li').forEach(li => bindActions(li));
}

addButton.addEventListener('click', addTodo);
inputField.addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());
clearAllBtn.addEventListener('click', () => confirm("ล้างทั้งหมด?") && (todoList.innerHTML = "", saveData()));

loadData();
