const TASKS = "studymate_tasks";
const PLANS = "studymate_plans";
const USER = "studymate_user";

function getData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function today() {
    return new Date().toISOString().slice(0, 10);
}

function formatDate(date) {
    if (!date) return "";

    return new Date(date + "T00:00:00")
        .toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

function escapeHTML(text) {
    return String(text).replace(/[&<>"']/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[char];
    });
}

function getStats() {

    const tasks = getData(TASKS);

    const completed =
        tasks.filter(task => task.done).length;

    const pending =
        tasks.length - completed;

    const progress =
        tasks.length
            ? Math.round((completed / tasks.length) * 100)
            : 0;

    return {
        tasks,
        completed,
        pending,
        progress
    };
}


/* TOAST MESSAGE */

function toast(message) {

    const box = document.createElement("div");

    box.className = "toast";

    box.textContent = message;

    document.body.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 2200);
}


/* AUTHENTICATION */

function checkAuthentication() {

    if (!localStorage.getItem(USER)) {

        window.location.href = "login.html";

        return false;
    }

    return true;
}


/* PAGE LOAD */

document.addEventListener("DOMContentLoaded", function () {

    /* LOGIN */

    const loginForm =
        document.getElementById("loginForm");

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name =
                document.getElementById("loginName").value.trim();

            const id =
                document.getElementById("loginId").value.trim();

            const password =
                document.getElementById("loginPassword").value;

            if (password.length < 4) {

                alert("Password must contain at least 4 characters.");

                return;
            }

            localStorage.setItem(
                USER,
                JSON.stringify({
                    name: name,
                    id: id
                })
            );

            window.location.href = "dashboard.html";
        });
    }


    /* PROTECTED PAGES */

    if (document.body.classList.contains("app")) {

        if (!checkAuthentication()) {
            return;
        }
    }


    /* USER NAME */

    const user =
        JSON.parse(localStorage.getItem(USER) || "null");

    const studentName =
        document.getElementById("studentName");

    if (studentName && user) {

        studentName.textContent = user.name;
    }


    /* TODAY DATE */

    const todayText =
        document.getElementById("todayText");

    if (todayText) {

        todayText.textContent =
            new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }


    /* LOGOUT */

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", function () {

            localStorage.removeItem(USER);

            window.location.href = "index.html";
        });
    }


    /* TASK PAGE */

    const taskForm =
        document.getElementById("taskForm");

    if (taskForm) {

        setupTasks(taskForm);
    }


    /* PLANNER PAGE */

    const planForm =
        document.getElementById("planForm");

    if (planForm) {

        setupPlans(planForm);
    }


    /* DASHBOARD */

    if (document.getElementById("totalTasks")) {

        dashboard();
    }


    /* PROGRESS */

    if (document.getElementById("pTotal")) {

        progressPage();
    }


    /* HOME PAGE PROGRESS */

    if (document.getElementById("heroProgress")) {

        const stats = getStats();

        document.getElementById("heroProgress").textContent =
            stats.progress + "%";

        document.getElementById("heroBar").style.width =
            stats.progress + "%";
    }

});


/* TASK MANAGEMENT */

function setupTasks(form) {

    const taskDate =
        document.getElementById("taskDate");

    if (taskDate) {

        taskDate.min = today();
    }


    form.addEventListener("submit", function (event) {

        event.preventDefault();

        const tasks = getData(TASKS);

        const task = {

            id:
                "T" +
                Date.now().toString().slice(-7),

            title:
                document.getElementById("taskTitle").value.trim(),

            subject:
                document.getElementById("taskSubject").value.trim(),

            date:
                document.getElementById("taskDate").value,

            priority:
                document.getElementById("taskPriority").value,

            category:
                document.getElementById("taskCategory").value,

            done: false
        };

        tasks.unshift(task);

        saveData(TASKS, tasks);

        form.reset();

        if (taskDate) {
            taskDate.min = today();
        }

        renderTasks();

        dashboard();

        toast("Task added successfully! 🎯");
    });


    const search =
        document.getElementById("taskSearch");

    const filter =
        document.getElementById("taskFilter");

    const priorityFilter =
        document.getElementById("priorityFilter");


    if (search) {
        search.addEventListener("input", renderTasks);
    }

    if (filter) {
        filter.addEventListener("change", renderTasks);
    }

    if (priorityFilter) {
        priorityFilter.addEventListener("change", renderTasks);
    }


    renderTasks();
}


function renderTasks() {

    const box =
        document.getElementById("tasksTable");

    if (!box) return;


    const search =
        (document.getElementById("taskSearch")?.value || "")
            .toLowerCase();

    const statusFilter =
        document.getElementById("taskFilter")?.value || "all";

    const priorityFilter =
        document.getElementById("priorityFilter")?.value || "all";


    let tasks = getData(TASKS);


    tasks = tasks
        .filter(task => {

            const text =
                (
                    task.title +
                    " " +
                    task.subject +
                    " " +
                    task.category
                ).toLowerCase();

            return text.includes(search);
        })
        .filter(task => {

            if (statusFilter === "all") {
                return true;
            }

            if (statusFilter === "completed") {
                return task.done;
            }

            return !task.done;
        })
        .filter(task => {

            if (priorityFilter === "all") {
                return true;
            }

            return task.priority === priorityFilter;
        });


    if (!tasks.length) {

        box.innerHTML = `
            <div class="empty">
                No tasks found.
                Add your first task above. 🎯
            </div>
        `;

        return;
    }


    box.innerHTML = `

        <table>

            <thead>

                <tr>
                    <th>Task</th>
                    <th>Subject</th>
                    <th>Deadline</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Action</th>
                </tr>

            </thead>

            <tbody>

                ${tasks.map(task => `

                    <tr>

                        <td>
                            <strong>
                                ${escapeHTML(task.title)}
                            </strong>

                            <br>

                            <small class="muted">
                                ${escapeHTML(task.category)}
                            </small>
                        </td>

                        <td>
                            ${escapeHTML(task.subject)}
                        </td>

                        <td>
                            ${formatDate(task.date)}
                        </td>

                        <td>

                            <span class="priority ${task.priority}">
                                ${task.priority}
                            </span>

                        </td>

                        <td>

                            <span class="status ${task.done ? "done" : ""}">
                                ${task.done ? "Completed" : "Pending"}
                            </span>

                        </td>

                        <td>

                            ${
                                task.done
                                ? ""
                                : `
                                    <button
                                        class="complete"
                                        data-action="done"
                                        data-id="${task.id}">
                                        ✓ Done
                                    </button>
                                `
                            }

                            <button
                                class="delete"
                                data-action="delete"
                                data-id="${task.id}">
                                Delete
                            </button>

                        </td>

                    </tr>

                `).join("")}

            </tbody>

        </table>
    `;


    box.querySelectorAll("button")
        .forEach(button => {

            button.addEventListener("click", function () {

                const id =
                    this.dataset.id;

                let tasks =
                    getData(TASKS);


                if (this.dataset.action === "done") {

                    const task =
                        tasks.find(item => item.id === id);

                    if (task) {

                        task.done = true;

                        toast("Task completed! 🎉");
                    }

                } else {

                    tasks =
                        tasks.filter(
                            item => item.id !== id
                        );

                    toast("Task deleted.");
                }


                saveData(TASKS, tasks);

                renderTasks();

                dashboard();

                progressPage();

            });

        });
}


/* STUDY PLANNER */

function setupPlans(form) {

    const planDate =
        document.getElementById("planDate");

    if (planDate) {

        planDate.min = today();
    }


    form.addEventListener("submit", function (event) {

        event.preventDefault();


        const start =
            document.getElementById("planStart").value;

        const end =
            document.getElementById("planEnd").value;


        if (end <= start) {

            toast("End time must be after start time.");

            return;
        }


        const plans =
            getData(PLANS);


        const plan = {

            id:
                "P" +
                Date.now().toString().slice(-7),

            subject:
                document.getElementById("planSubject").value.trim(),

            topic:
                document.getElementById("planTopic").value.trim(),

            date:
                document.getElementById("planDate").value,

            start: start,

            end: end,

            priority:
                document.getElementById("planPriority").value

        };


        plans.push(plan);

        saveData(PLANS, plans);

        form.reset();

        if (planDate) {
            planDate.min = today();
        }

        renderPlans();

        dashboard();

        toast("Study plan added! 📅");
    });


    renderPlans();
}


function renderPlans() {

    const box =
        document.getElementById("plansList");

    if (!box) return;


    const plans =
        getData(PLANS)
            .sort(
                (a, b) =>
                    (a.date + a.start)
                        .localeCompare(
                            b.date + b.start
                        )
            );


    const count =
        document.getElementById("planCount");

    if (count) {

        count.textContent = plans.length;
    }


    if (!plans.length) {

        box.innerHTML = `
            <div class="empty">
                No study plans yet.
                Create your first study session! 📚
            </div>
        `;

        return;
    }


    box.innerHTML = plans.map(plan => `

        <div class="plan-item">

            <div class="task-main">

                <strong>
                    ${escapeHTML(plan.subject)}
                    —
                    ${escapeHTML(plan.topic)}
                </strong>

                <span class="priority ${plan.priority}">
                    ${plan.priority}
                </span>

            </div>

            <div class="task-meta">

                📅 ${formatDate(plan.date)}
                ·
                ⏰ ${plan.start}–${plan.end}

                <button
                    class="delete"
                    style="float:right"
                    data-id="${plan.id}">
                    Delete
                </button>

            </div>

        </div>

    `).join("");


    box.querySelectorAll(".delete")
        .forEach(button => {

            button.addEventListener("click", function () {

                const id =
                    this.dataset.id;

                const plans =
                    getData(PLANS)
                        .filter(
                            plan => plan.id !== id
                        );

                saveData(PLANS, plans);

                renderPlans();

                dashboard();

                toast("Study plan deleted.");

            });

        });
}


/* DASHBOARD */

function dashboard() {

    const stats =
        getStats();


    const total =
        document.getElementById("totalTasks");

    const pending =
        document.getElementById("pendingTasks");

    const completed =
        document.getElementById("completedTasks");

    const progress =
        document.getElementById("dashboardProgress");


    if (total) {
        total.textContent = stats.tasks.length;
    }

    if (pending) {
        pending.textContent = stats.pending;
    }

    if (completed) {
        completed.textContent = stats.completed;
    }

    if (progress) {
        progress.textContent =
            stats.progress + "%";
    }


    /* TODAY TASKS */

    const todayBox =
        document.getElementById("todayTasks");


    if (todayBox) {

        const tasks =
            stats.tasks
                .filter(
                    task =>
                        task.date === today()
                )
                .slice(0, 5);


        if (!tasks.length) {

            todayBox.innerHTML = `
                <div class="empty">
                    No tasks due today.
                    Great time to plan ahead! 🎯
                </div>
            `;

        } else {

            todayBox.innerHTML =
                tasks.map(task => `

                    <div class="task-item">

                        <div class="task-main">

                            <strong>
                                ${escapeHTML(task.title)}
                            </strong>

                            <span class="status ${task.done ? "done" : ""}">
                                ${task.done ? "Completed" : "Pending"}
                            </span>

                            <span class="priority ${task.priority}">
                                ${task.priority}
                            </span>

                        </div>

                        <div class="task-meta">
                            ${escapeHTML(task.subject)}
                            · Due today
                        </div>

                    </div>

                `).join("");
        }
    }


    /* UPCOMING PLANS */

    const upcomingBox =
        document.getElementById("upcomingPlans");


    if (upcomingBox) {

        const plans =
            getData(PLANS)
                .filter(
                    plan =>
                        plan.date >= today()
                )
                .sort(
                    (a, b) =>
                        (a.date + a.start)
                            .localeCompare(
                                b.date + b.start
                            )
                )
                .slice(0, 4);


        if (!plans.length) {

            upcomingBox.innerHTML = `
                <div class="empty">
                    No upcoming plans.
                </div>
            `;

        } else {

            upcomingBox.innerHTML =
                plans.map(plan => `

                    <div class="plan-item">

                        <div class="task-main">

                            <strong>
                                ${escapeHTML(plan.subject)}
                                —
                                ${escapeHTML(plan.topic)}
                            </strong>

                            <span class="priority ${plan.priority}">
                                ${plan.priority}
                            </span>

                        </div>

                        <div class="task-meta">

                            📅 ${formatDate(plan.date)}
                            ·
                            ${plan.start}–${plan.end}

                        </div>

                    </div>

                `).join("");
        }
    }
}


/* PROGRESS PAGE */

function progressPage() {

    const stats =
        getStats();


    const total =
        document.getElementById("pTotal");

    const completed =
        document.getElementById("pCompleted");

    const pending =
        document.getElementById("pPending");


    if (total) {
        total.textContent =
            stats.tasks.length;
    }

    if (completed) {
        completed.textContent =
            stats.completed;
    }

    if (pending) {
        pending.textContent =
            stats.pending;
    }


    const circle =
        document.getElementById("circleProgress");


    if (circle) {

        circle.style.background =
            `conic-gradient(
                var(--primary)
                ${stats.progress * 3.6}deg,
                #eceef7 0deg
            )`;

        const span =
            circle.querySelector("span");

        if (span) {

            span.textContent =
                stats.progress + "%";
        }
    }


    const message =
        document.getElementById("progressMessage");


    if (message) {

        if (!stats.tasks.length) {

            message.textContent =
                "Add some tasks to start tracking.";

        } else if (stats.progress >= 80) {

            message.textContent =
                "Excellent consistency! Keep it up. 🎉";

        } else if (stats.progress >= 50) {

            message.textContent =
                "Good progress. Stay consistent! 💪";

        } else {

            message.textContent =
                "Keep going — small completed tasks build momentum.";
        }
    }


    /* SUBJECT PROGRESS */

    const subjectBox =
        document.getElementById("subjectProgress");


    if (!subjectBox) return;


    const subjects = {};


    stats.tasks.forEach(task => {

        if (!subjects[task.subject]) {

            subjects[task.subject] = {
                total: 0,
                completed: 0
            };
        }

        subjects[task.subject].total++;

        if (task.done) {

            subjects[task.subject].completed++;
        }

    });


    const entries =
        Object.entries(subjects);


    if (!entries.length) {

        subjectBox.innerHTML = `
            <div class="empty">
                Add tasks from different subjects
                to see subject-wise progress.
            </div>
        `;

        return;
    }


    subjectBox.innerHTML =
        entries.map(([subject, value]) => {

            const percentage =
                Math.round(
                    value.completed /
                    value.total *
                    100
                );


            return `

                <div class="bar-row">

                    <div class="bar-label">

                        <span>
                            ${escapeHTML(subject)}
                        </span>

                        <span>
                            ${percentage}%
                        </span>

                    </div>

                    <div class="bar">

                        <span
                            style="width:${percentage}%">
                        </span>

                    </div>

                </div>

            `;

        }).join("");
}