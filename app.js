const STUDENT_STORAGE_KEY = "studentTuitionData";
const TEACHER_STORAGE_KEY = "teacherData";
const ADMIN_PASSWORD = "tution2026";

const loginPage = document.getElementById("loginPage");
const appPage = document.getElementById("appPage");
const loginForm = document.getElementById("loginForm");
const passwordInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

const studentForm = document.getElementById("studentForm");
const joinDate = document.getElementById("joinDate");
const nameInput = document.getElementById("name");
const classInput = document.getElementById("className");
const schoolInput = document.getElementById("school");
const subjectInput = document.getElementById("subject");
const monthlyFeeInput = document.getElementById("monthlyFee");
const statusInput = document.getElementById("status");
const studentId = document.getElementById("studentId");

const teacherForm = document.getElementById("teacherForm");
const teacherNameInput = document.getElementById("teacherName");
const teacherSubjectsInput = document.getElementById("teacherSubjects");
const teacherIdInput = document.getElementById("teacherId");

const studentsTable = document.querySelector("#studentsTable tbody");
const leftStudentsTable = document.querySelector("#leftStudentsTable tbody");
const teachersTable = document.querySelector("#teachersTable tbody");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");
const exportJSON = document.getElementById("exportJSON");
const clearData = document.getElementById("clearData");

const SUBJECTS = [
    'Mathematics','English','Science','History','Geography','Physics','Chemistry','Biology','Computer Science','Information Technology',
    'Economics','Business Studies','Accounting','Psychology','Sociology','Art','Music','Physical Education','Health Education','Drama',
    'Literature','Philosophy','Environmental Science','Political Science','Foreign Language','Spanish','French','German','Hindi','Urdu',
    'Bengali','Mandarin','Japanese','Latin','Greek','Statistics','Civic Education','Coding','Robotics','Astronomy','Design Technology',
    'Media Studies','Graphic Design','Nutrition','Home Science','Legal Studies','Ethics','Religious Studies','Photography','Film Studies','Engineering Basics'
];

let students = [];
let teachers = [];

function loadStudents() {
    try {
        const raw = localStorage.getItem(STUDENT_STORAGE_KEY);
        students = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error(e);
        students = [];
    }
}

function saveStudents() {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(students));
}

function loadTeachers() {
    try {
        const raw = localStorage.getItem(TEACHER_STORAGE_KEY);
        teachers = raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error(e);
        teachers = [];
    }
}

function saveTeachers() {
    localStorage.setItem(TEACHER_STORAGE_KEY, JSON.stringify(teachers));
}

function monthKey(date) {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
}

function monthsBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = [];

    let year = start.getFullYear();
    let month = start.getMonth();

    while (year < end.getFullYear() || (year === end.getFullYear() && month <= end.getMonth())) {
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        months.push(key);
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }
    return months;
}

function getPaymentStatus(student) {
    const today = new Date();
    const join = new Date(student.joinDate);
    const endDate = student.leftDate ? new Date(student.leftDate) : today;
    const allMonths = monthsBetween(join, endDate);
    const paidMonths = student.payments || [];

    const overdueMonths = allMonths.filter((month) => !paidMonths.includes(month));
    const currentMonth = monthKey(today);
    const isCurrentPaid = paidMonths.includes(currentMonth);

    if (overdueMonths.length > 0 && !isCurrentPaid) {
        const overdueSince = overdueMonths[0];
        return { text: `Overdue since ${overdueSince}`, status: "payment-due" };
    }

    if (isCurrentPaid) {
        return { text: `Paid for ${currentMonth}`, status: "payment-ok" };
    }

    return { text: `Due this month (${currentMonth})`, status: "payment-due" };
}

function renderMonthChart(student) {
    const endDate = student.leftDate ? new Date(student.leftDate) : new Date();
    let monthsAll = monthsBetween(new Date(student.joinDate), endDate);

    if (monthsAll.length === 0) {
        monthsAll = [monthKey(new Date(student.joinDate))];
    }

    const monthsForChart = monthsAll.slice(0, 12);

    return monthsForChart.map((month) => {
        const checked = (student.payments || []).includes(month) ? "checked" : "";
        return `<label><input type="checkbox" data-month="${month}" ${checked} /> ${month}</label>`;
    }).join(" ");
}

function refreshTable() {
    const filter = searchInput.value.trim().toLowerCase();
    studentsTable.innerHTML = "";
    leftStudentsTable.innerHTML = "";

    students.forEach((student) => {
        if (filter && ![student.name, student.className, student.school, student.subject].some((v) => v.toLowerCase().includes(filter))) {
            return;
        }

        const paymentStatus = getPaymentStatus(student);

        let rowHTML;
        if (student.status === "left") {
            rowHTML = `
                <td data-label="Joined">${student.joinDate}</td>
                <td data-label="Name">${student.name}</td>
                <td data-label="Class">${student.className}</td>
                <td data-label="School">${student.school}</td>
                <td data-label="Subject">${student.subject || ''}</td>
                <td data-label="Left Date">${student.leftDate}</td>
                <td data-label="Payment Status" class="${paymentStatus.status}">${paymentStatus.text}</td>
                <td data-label="Actions">
                    <button class="action-btn chart" data-id="${student.id}">View Chart</button>
                    <button class="action-btn edit" data-id="${student.id}">Edit</button>
                    <button class="action-btn pay" data-id="${student.id}">Pay Month</button>
                    <button class="action-btn delete" data-id="${student.id}">Rejoin</button>
                    <button class="action-btn restore" data-id="${student.id}">Delete</button>
                    <button class="action-btn copy-reminder" data-id="${student.id}">Copy Reminder</button>
                </td>
            `;
        } else {
            rowHTML = `
                <td data-label="Join Date">${student.joinDate}</td>
                <td data-label="Name">${student.name}</td>
                <td data-label="Class">${student.className}</td>
                <td data-label="School">${student.school}</td>
                <td data-label="Subject">${student.subject || ''}</td>
                <td data-label="Monthly Fee">${student.monthlyFee}</td>
                <td data-label="Payment Status" class="${paymentStatus.status}">${paymentStatus.text}</td>
                <td data-label="Status" class="status-${student.status}">${student.status}</td>
                <td data-label="Actions">
                    <button class="action-btn chart" data-id="${student.id}">12-month Chart</button>
                    <button class="action-btn edit" data-id="${student.id}">Edit</button>
                    <button class="action-btn pay" data-id="${student.id}">Pay Month</button>
                    <button class="action-btn delete" data-id="${student.id}">Mark Left</button>
                    <button class="action-btn restore" data-id="${student.id}">Delete</button>
                    <button class="action-btn copy-reminder" data-id="${student.id}">Copy Reminder</button>
                </td>
            `;
        }

        const row = document.createElement("tr");
        row.innerHTML = rowHTML;

        const chartDetail = document.createElement("tr");
        chartDetail.className = "month-chart-row hidden";
        chartDetail.setAttribute("data-student-id", student.id);
        chartDetail.innerHTML = `
            <td colspan="${student.status === 'left' ? '8' : '9'}">
                <div class="chart-grid">
                    ${renderMonthChart(student)}
                </div>
                <button class="action-btn save-chart" data-id="${student.id}">Save Chart</button>
            </td>
        `;

        if (student.status === "left") {
            leftStudentsTable.appendChild(row);
            leftStudentsTable.appendChild(chartDetail);
        } else {
            studentsTable.appendChild(row);
            studentsTable.appendChild(chartDetail);
        }
    });
}

function renderTeachers() {
    teachersTable.innerHTML = "";
    teachers.forEach((teacher) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${teacher.name}</td>
            <td>${teacher.subjects.join(", ")}</td>
            <td>
                <button class="action-btn edit-teacher" data-id="${teacher.id}">Edit</button>
                <button class="action-btn delete-teacher" data-id="${teacher.id}">Delete</button>
            </td>
        `;
        teachersTable.appendChild(row);
    });
}

function populateSubjectList() {
    const list = document.getElementById("subjectList");
    if (!list) return;
    list.innerHTML = SUBJECTS.map((s) => `<option value="${s}">`).join("");
}

function resetStudentForm() {
    studentForm.reset();
    studentId.value = "";
}

function resetTeacherForm() {
    teacherForm.reset();
    teacherIdInput.value = "";
}

function resetForm() {
    studentForm.reset();
    studentId.value = "";
}

function setForm(student) {
    joinDate.value = student.joinDate;
    nameInput.value = student.name;
    classInput.value = student.className;
    schoolInput.value = student.school;
    subjectInput.value = student.subject || "";
    monthlyFeeInput.value = student.monthlyFee;
    statusInput.value = student.status;
    studentId.value = student.id;
}

function addOrUpdateStudent(e) {
    e.preventDefault();

    const obj = {
        id: studentId.value || crypto.randomUUID(),
        joinDate: joinDate.value,
        name: nameInput.value.trim(),
        className: classInput.value.trim(),
        school: schoolInput.value.trim(),
        subject: subjectInput.value.trim(),
        monthlyFee: Number(monthlyFeeInput.value),
        payments: [],
        status: statusInput.value,
        leftDate: null,
    };

    if (!obj.name || !obj.className || !obj.school || !obj.subject || !obj.joinDate || !obj.monthlyFee) {
        return alert("All fields are required.");
    }

    const idx = students.findIndex((s) => s.id === obj.id);

    if (idx > -1) {
        obj.payments = students[idx].payments || [];
        obj.leftDate = students[idx].leftDate || null;
        students[idx] = obj;
    } else {
        students.push(obj);
    }

    saveStudents();
    refreshTable();
    resetForm();
}

function updateStatusOrAction(event) {
    const target = event.target;
    if (!target.dataset.id) return;
    const id = target.dataset.id;
    const student = students.find((s) => s.id === id);
    if (!student) return;

    if (target.classList.contains("edit")) {
        setForm(student);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
    }

    if (target.classList.contains("chart")) {
        const chartRow = document.querySelector(`.month-chart-row[data-student-id='${student.id}']`);
        if (chartRow) {
            chartRow.classList.toggle("hidden");
        }
        return;
    }

    if (target.classList.contains("save-chart")) {
        const chartRow = target.closest("tr");
        const checkboxes = chartRow.querySelectorAll("input[type='checkbox']");
        student.payments = [];
        checkboxes.forEach((checkbox) => {
            if (checkbox.checked) {
                student.payments.push(checkbox.dataset.month);
            }
        });
        saveStudents();
        refreshTable();
        return;
    }

    if (target.classList.contains("pay")) {
        const currentMonth = monthKey(new Date());
        student.payments = student.payments || [];

        if (student.payments.includes(currentMonth)) {
            alert(`Payment for ${currentMonth} is already recorded.`);
            return;
        }

        student.payments.push(currentMonth);
        saveStudents();
        refreshTable();
        return;
    }

    if (target.classList.contains("delete")) {
        if (student.status === "left") {
            student.status = "active";
            student.leftDate = null;
            saveStudents();
            refreshTable();
        } else {
            student.status = "left";
            student.leftDate = new Date().toISOString().slice(0,10);
            saveStudents();
            refreshTable();
        }
        return;
    }

    if (target.classList.contains("restore")) {
        if (confirm("Permanently delete this student record?")) {
            students = students.filter((s) => s.id !== id);
            saveStudents();
            refreshTable();
        }
        return;
    }

    if (target.classList.contains("copy-reminder")) {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dateStr = endOfMonth.toISOString().slice(0, 10);
        const monthName = now.toLocaleString('default', { month: 'long' });
        const message = `Dear ${student.name}, this is a friendly reminder to pay your monthly tuition fee of ${student.monthlyFee} for ${monthName} before ${dateStr}. Please ensure timely payment to avoid any interruptions in your studies. Happy learning!`;
        navigator.clipboard.writeText(message).then(() => {
            alert("Reminder message copied to clipboard!");
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert("Failed to copy message.");
        });
        return;
    }
}

function init() {
    const valid = localStorage.getItem("logged_in");
    if (valid === "1") {
        loginPage.classList.add("hidden");
        appPage.classList.remove("hidden");
    }

    loadStudents();
    loadTeachers();
    populateSubjectList();
    refreshTable();
    renderTeachers();

    teacherForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const teacher = {
            id: teacherIdInput.value || crypto.randomUUID(),
            name: teacherNameInput.value.trim(),
            subjects: teacherSubjectsInput.value.split(",").map((s) => s.trim()).filter((s) => s),
        };

        if (!teacher.name || teacher.subjects.length === 0) {
            return alert("Teacher name and at least one subject are required.");
        }

        const idx = teachers.findIndex((t) => t.id === teacher.id);
        if (idx > -1) {
            teachers[idx] = teacher;
        } else {
            teachers.push(teacher);
        }

        saveTeachers();
        renderTeachers();
        resetTeacherForm();
    });

    teachersTable.addEventListener("click", (event) => {
        const target = event.target;
        if (!target.dataset.id) return;

        const teacherId = target.dataset.id;
        const teacherIndex = teachers.findIndex((t) => t.id === teacherId);
        if (teacherIndex < 0) return;

        if (target.classList.contains("edit-teacher")) {
            const teacher = teachers[teacherIndex];
            teacherNameInput.value = teacher.name;
            teacherSubjectsInput.value = teacher.subjects.join(", ");
            teacherIdInput.value = teacher.id;
        }

        if (target.classList.contains("delete-teacher")) {
            if (confirm("Delete teacher?")) {
                teachers.splice(teacherIndex, 1);
                saveTeachers();
                renderTeachers();
            }
        }
    });

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const pw = passwordInput.value;
        if (pw === ADMIN_PASSWORD) {
            localStorage.setItem("logged_in", "1");
            loginPage.classList.add("hidden");
            appPage.classList.remove("hidden");
            loginError.textContent = "";
            passwordInput.value = "";
            loadStudents();
            refreshTable();
        } else {
            loginError.textContent = "Password incorrect.";
        }
    });

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("logged_in");
        appPage.classList.add("hidden");
        loginPage.classList.remove("hidden");
    });

    studentForm.addEventListener("submit", addOrUpdateStudent);

    studentsTable.addEventListener("click", updateStatusOrAction);
    leftStudentsTable.addEventListener("click", updateStatusOrAction);

    searchInput.addEventListener("input", refreshTable);

    exportJSON.addEventListener("click", () => {
        const data = JSON.stringify(students, null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "students.json";
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    });

    clearData.addEventListener("click", () => {
        if (confirm("Clear all student data?")) {
            students = [];
            saveStudents();
            refreshTable();
        }
    });
}

init();