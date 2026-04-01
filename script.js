// 1. อ้างอิง HTML Elements
const inputField = document.getElementById('todo-input');
const addButton = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');

// --- ส่วนของระบบความจำ (LocalStorage) ---

// ฟังก์ชันสำหรับ "เซฟ" ข้อมูลลงในเครื่อง
function saveData() {
    localStorage.setItem("myTodoList", todoList.innerHTML);
}

// ฟังก์ชันสำหรับ "ดึง" ข้อมูลที่เคยเซฟไว้มาแสดง
function loadData() {
    const savedContent = localStorage.getItem("myTodoList");
    if (savedContent) {
        todoList.innerHTML = savedContent;
        // ต้องไปผูก Event (คลิก/ลบ) ให้กับรายการที่ดึงมาใหม่ด้วย
        attachEventsToExistingItems();
    }
}

// --- ส่วนของ Logic หลัก ---

function addTodo() {
    const taskText = inputField.value;

    if (taskText === "") {
        alert("น้องอย่าลืมพิมพ์รายการก่อนนะจ๊ะ!");
        return;
    }

    // สร้างรายการใหม่
    const listItem = document.createElement('li');
    
    // สร้างส่วนข้อความ
    const textSpan = document.createElement('span');
    textSpan.className = "todo-text";
    textSpan.innerText = taskText;
    
    // สร้างปุ่มลบ
    const deleteBtn = document.createElement('button');
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "ลบ";

    // ใส่ข้อความและปุ่มลงใน li
    listItem.appendChild(textSpan);
    listItem.appendChild(deleteBtn);
    
    // ใส่ li ลงใน ul
    todoList.appendChild(listItem);

    // เคลียร์ช่องพิมพ์
    inputField.value = "";

    // ผูกคำสั่งคลิก (หลังจากสร้างเสร็จ)
    addClickEvents(listItem);
    
    // เซฟข้อมูลทุกครั้งที่มีการเพิ่ม
    saveData();
}

// ฟังก์ชันสำหรับจัดการคลิก (ขีดฆ่า/ลบ)
function addClickEvents(item) {
    const text = item.querySelector('.todo-text');
    const btn = item.querySelector('.delete-btn');

    // คลิกเพื่อขีดฆ่า
    text.addEventListener('click', () => {
        text.style.textDecoration = text.style.textDecoration === 'line-through' ? 'none' : 'line-through';
        text.style.color = text.style.color === 'gray' ? 'black' : 'gray';
        saveData(); // เซฟสถานะขีดฆ่าด้วย
    });

    // คลิกเพื่อลบ
    btn.addEventListener('click', () => {
        item.remove();
        saveData(); // เซฟหลังจากลบ
    });
}

// ฟังก์ชันพิเศษ: ไล่ผูกคำสั่งให้รายการที่โหลดมาจากความจำ
function attachEventsToExistingItems() {
    const items = todoList.querySelectorAll('li');
    items.forEach(item => addClickEvents(item));
}

// 2. ผูกเหตุการณ์ (Event Listeners)
addButton.addEventListener('click', addTodo);

// กด Enter เพื่อเพิ่มรายการได้ด้วย
inputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodo();
});

// 3. เริ่มต้นแอป: โหลดข้อมูลที่เคยเซฟไว้
loadData();