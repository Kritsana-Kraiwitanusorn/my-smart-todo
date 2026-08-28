// ==================== Supabase Setup ====================
// หมายเหตุ: anon key ตัวนี้ถูกออกแบบมาให้เปิดเผยฝั่ง frontend ได้
// ตัวป้องกันจริงคือ Row Level Security (RLS) ที่ตั้งไว้ในฝั่ง Supabase
const SUPABASE_URL = "https://himjanzunaanxyguazmr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbWphbnp1bmFhbnh5Z3Vhem1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5MDY1MTYsImV4cCI6MjEwMzQ4MjUxNn0.cR3NU4o0Lndt51L1iPu7xwqf25FnAAyvT7P72o2rXr8";
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==================== DOM References ====================
const inputField = document.getElementById('todo-input');
const priorityField = document.getElementById('priority-input');
const addButton = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const clearAllBtn = document.getElementById('clear-all-btn');

// priority ใน DB เป็น smallint (1=ด่วน, 2=ปกติ) เพื่อรองรับ priority level เพิ่มเติมในอนาคต
const PRIORITY_TO_DB = { urgent: 1, normal: 2 };
const PRIORITY_FROM_DB = { 1: 'urgent', 2: 'normal' };

// 🚀 ระบบลากวาง (Drag & Drop)
new Sortable(todoList, {
    animation: 200,
    handle: 'li',
    onEnd: async function () {
        updateOrder();
        await saveOrder();
    }
});

// ==================== Data Loading ====================
async function loadData() {
    const { data, error } = await db
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('โหลดข้อมูลไม่สำเร็จ:', error.message);
        alert('โหลดข้อมูลไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง');
        return;
    }

    todoList.innerHTML = '';
    data.forEach(renderTodo);
    updateOrder();
}

function renderTodo(task) {
    const li = document.createElement('li');
    const prioKey = PRIORITY_FROM_DB[task.priority] || 'normal';
    li.className = prioKey;
    li.dataset.id = task.id;
    if (task.is_done) li.classList.add('done');

    const time = new Date(task.created_at).toLocaleTimeString('th-TH', {
        hour: '2-digit',
        minute: '2-digit'
    });

    li.innerHTML = `
        <div class="todo-content">
            <span class="order-number"></span>
            <div class="todo-details">
                <div>
                    <span class="todo-text"></span>
                    <span class="badge ${prioKey === 'urgent' ? 'bg-urgent' : 'bg-normal'}">
                        ${prioKey === 'urgent' ? 'ด่วน' : 'ปกติ'}
                    </span>
                </div>
                <span class="timestamp">เมื่อ: ${time}</span>
            </div>
        </div>
        <div class="btn-group">
            <button class="done-btn">${task.is_done ? '↩' : '✔'}</button>
            <button class="delete-btn">ลบ</button>
        </div>
    `;

    // ใส่ข้อความ task ผ่าน textContent แทน innerHTML เพื่อป้องกัน XSS
    li.querySelector('.todo-text').textContent = task.title;

    todoList.appendChild(li);
    bindActions(li);
}

function updateOrder() {
    const items = todoList.querySelectorAll('li');
    items.forEach((item, index) => {
        const orderSpan = item.querySelector('.order-number');
        if (orderSpan) orderSpan.innerText = `${index + 1}.`;
    });
}

async function saveOrder() {
    const items = todoList.querySelectorAll('li');
    const updates = Array.from(items).map((item, index) =>
        db.from('tasks').update({ sort_order: index }).eq('id', item.dataset.id)
    );
    const results = await Promise.all(updates);
    const failed = results.find(r => r.error);
    if (failed) console.error('บันทึกลำดับไม่สำเร็จ:', failed.error.message);
}

// ==================== Add Todo ====================
async function addTodo() {
    const text = inputField.value.trim();
    const prio = priorityField.value;
    if (!text) return;

    const currentCount = todoList.querySelectorAll('li').length;

    const { data, error } = await db
        .from('tasks')
        .insert({
            title: text,
            priority: PRIORITY_TO_DB[prio] || 2,
            sort_order: currentCount
        })
        .select()
        .single();

    if (error) {
        alert('เพิ่มรายการไม่สำเร็จ: ' + error.message);
        return;
    }

    renderTodo(data);
    inputField.value = '';
    updateOrder();
}

// ==================== Actions per item ====================
function bindActions(item) {
    const doneBtn = item.querySelector('.done-btn');
    const delBtn = item.querySelector('.delete-btn');
    const id = item.dataset.id;

    doneBtn.addEventListener('click', async () => {
        const nowDone = !item.classList.contains('done');

        // อัปเดตหน้าจอก่อน (optimistic) แล้วค่อย sync ไป DB
        item.classList.toggle('done');
        doneBtn.innerText = nowDone ? '↩' : '✔';

        const { error } = await db
            .from('tasks')
            .update({
                is_done: nowDone,
                completed_at: nowDone ? new Date().toISOString() : null
            })
            .eq('id', id);

        if (error) {
            console.error('อัปเดตสถานะไม่สำเร็จ:', error.message);
            // ย้อนกลับ UI ถ้าบันทึกไม่สำเร็จ
            item.classList.toggle('done');
            doneBtn.innerText = nowDone ? '✔' : '↩';
            alert('อัปเดตสถานะไม่สำเร็จ ลองใหม่อีกครั้ง');
        }
    });

    delBtn.addEventListener('click', async () => {
        const { error } = await db.from('tasks').delete().eq('id', id);
        if (error) {
            alert('ลบไม่สำเร็จ: ' + error.message);
            return;
        }
        item.remove();
        updateOrder();
    });
}

// ==================== Global Actions ====================
addButton.addEventListener('click', addTodo);
inputField.addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());

clearAllBtn.addEventListener('click', async () => {
    if (!confirm('ล้างทั้งหมด?')) return;

    // Supabase ต้องมีเงื่อนไข filter เสมอ ใช้ id ที่ไม่มีจริงเพื่อลบ "ทุกแถว"
    const { error } = await db
        .from('tasks')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
        alert('ล้างไม่สำเร็จ: ' + error.message);
        return;
    }
    todoList.innerHTML = '';
});

loadData();
