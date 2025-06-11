
const announcementData = [
    {
        announcementBy_prefix: 'PA.',
        announcementBy_Name: "Wilson Kumar",
        msg: "No classes will be held on 21st Nov",
        files: "2 files are attached",
        course_name: "",
        read: true,
        timestamp: "15-Sep-2018 at 07:21 pm"
    },
    {
        announcementBy_prefix: 'PA.',
        announcementBy_Name: "Samson White",
        msg: "Guest lecture on Geometry on 20th September",
        files: "2 files are attached",
        course_name: "",
        read: false,
        timestamp: "15-Sep-2018 at 07:21 pm"
    },
    {
        announcementBy_prefix: 'PA.',
        announcementBy_Name: "Wilson Kumar",
        msg: "Additional course materials available on request",
        files: "",
        course_name: "Course: Mathematics 101",
        read: true,
        timestamp: "15-Sep-2018 at 07:21 pm"
    },
    {
        announcementBy_prefix: 'PA.',
        announcementBy_Name: "Wilson Kumar",
        msg: "No classes will be held on 25th Dec",
        files: "",
        course_name: "",
        read: false,
        timestamp: "15-Sep-2018 at 07:21 pm"
    },
    {
        announcementBy_prefix: 'PA.',
        announcementBy_Name: "Wilson Kumar",
        msg: "Additional course materials available on request",
        files: "",
        course_name: "Course: Mathematics 101",
        read: false,
        timestamp: "15-Sep-2018 at 07:21 pm"
    },
]

const cardData = [
    {
        img: "../assets/images/cardImages/imageMask.png",
        topic: "Acceleration",
        subject: "Physics",
        grade: "7",
        grade_plus: "+2",
        units: 4,
        lessons: 18,
        topics: 24,
        teacher_class: "Mr. Frank's Class B",
        no_of_students: 50,
        date_of_class: "21-Jan-2020 - 21-Aug-2020",
        is_favourite: true,
        isExpired: false,
        preview: true,
        manage_course: true,
        grade_submission: true,
        reports: true
    },
    {
        img: "../assets/images/cardImages/imageMask-1.png",
        topic: "Displacement, Velocity and Speed",
        subject: "Physics 2",
        grade: "6",
        grade_plus: "+3",
        units: 2,
        lessons: 15,
        topics: 20,
        teacher_class: "",
        no_of_students: null,
        date_of_class: null,
        is_favourite: true,
        isExpired: false,
        preview: true,
        manage_course: false,
        grade_submission: false,
        reports: true
    },
    {
        img: "../assets/images/cardImages/imageMask-3.png",
        topic: "Introduction to Biology: Micro organisms and how they affec...",
        subject: "Biology",
        grade: "4",
        grade_plus: "+1",
        units: 5,
        lessons: 16,
        topics: 22,
        teacher_class: "All Classes",
        no_of_students: 300,
        date_of_class: null,
        is_favourite: true,
        isExpired: false,
        preview: true,
        manage_course: false,
        grade_submission: false,
        reports: true
    },
    {
        img: "../assets/images/cardImages/imageMask-2.png",
        topic: "Introduction to High School Mathematics",
        subject: "Mathematics",
        grade: "8",
        grade_plus: "+3",
        units: null,
        lessons: null,
        topics: null,
        teacher_class: "Mr. Frank's Class A",
        no_of_students: 44,
        date_of_class: "14-Oct-2019 - 20-Oct-2020",
        is_favourite: false,
        isExpired: true,
        preview: true,
        manage_course: true,
        grade_submission: true,
        reports: true
    }
];


const announceMentContainer = document.querySelector('.noti-content-container');

announcementData.forEach(announcement => {
    const notiCont = document.createElement("div");
    notiCont.className = announcement.read ? "noti-content" : "noti-content not-read";

    notiCont.innerHTML = `
    
        <div class="n-ln">
            <div class="ln-text">
                <span class="ln-text-higl">${announcement.announcementBy_prefix}</span> 
                ${announcement.announcementBy_Name}
            </div>
            <img width="15px" height="18px" src="../assets/images/checkbox-checked.svg" class="checkbox" />
        </div>
        <div class="n-ld">
            ${announcement.msg}
        </div>
        <div class="n-sub-name">
            ${announcement.course_name}
        </div>
        <div class="n-lf">
            <div class="f-att" style"${announcement.files  ? "display: block" : "display: none"}>
                ${announcement.files}
            </div>
            <div class="timestamp">
                ${announcement.timestamp}
            </div>
        </div>
    
    `

    announceMentContainer.appendChild(notiCont);

});


const container = document.querySelector(".cards");

cardData.forEach(card => {
    const cardElement = document.createElement("div");
    cardElement.className = "card";

    const actionIcons = [
        { key: "preview", icon: "preview.svg" },
        { key: "manage_course", icon: "manage course.svg" },
        { key: "grade_submission", icon: "grade submissions.svg" },
        { key: "reports", icon: "reports.svg" }
    ];

    const actionsHTML = actionIcons.map(action => {
        const isEnabled = card[action.key];
        return `
            <li class="action-list-item" style="opacity: ${isEnabled ? 1 : 0.4};">
                <img src="../assets/images/${action.icon}" />
            </li>
        `;
    }).join("");

    const expiredTag = card.isExpired
        ? `<div class="expired-tag">Expired</div>`
        : "";

    cardElement.innerHTML = `
         ${expiredTag}
        <div class="card-body" style="position: relative;">
           
            <img class="card-img" src="${card.img}" />
            <div class="content">
                <div class="topic card-margin">${card.topic}</div>
                <div class="subject-grade card-margin">${card.subject} | Grade ${card.grade} <span class="grade-plus">${card.grade_plus}</span></div>
                <div class="chapter-contents card-margin">
                    <div class="content-text"><b class="content-no">${card.units ?? ""}</b> Units</div>
                    <div class="content-text" style="margin: 0 6px;"><b class="content-no">${card.lessons ?? ""}</b> Lessons</div>
                    <div class="content-text"><b class="content-no">${card.topics ?? ""}</b> Topics</div>
                </div>
                <div class="class-filter" style="margin-top: 18px;">
                    <select id="sort-courses" class=${card.teacher_class ? 'class-list' : 'class-list class-list-x'}>
                        ${card.teacher_class ? `<option disabled selected=selected>${card.teacher_class}</option>` : "<option disabled selected=selected style='color:rgb(221, 214, 214)' selected disabled>No Classes</option>"}
                    </select>
                    <img src="../assets/images/arrow-down.svg" />
                </div>
                <div class="misc-information">
                    <div class="student-no">${card.no_of_students ? `${card.no_of_students} Students` : ""}</div>
                    ${card.date_of_class ? `<div class="separator">|</div>` : ""}
                    <div class="date">${card.date_of_class || ""}</div>
                </div>
            </div>
            ${card.is_favourite ? `<div class="favourite"><img src="../assets/images/favourite.svg"/></div>` : `<div class="favourite"><img src="../assets/images/notFavourite.svg"/></div>`}
        </div>
        <div class="action-menu">
            <ul class="action-list">${actionsHTML}</ul>
        </div>
    `;

    container.appendChild(cardElement);
});


const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(nav => {
            nav.classList.remove('selected');
            const link = nav.querySelector('a');
            if (link) {
                link.classList.remove('selected-link');
                link.classList.add('nav-link')
            }
        });
        item.classList.add('selected');
        const link = item.querySelector('a');
        if (link) {
            link.classList.add('selected-link');
            link.classList.remove('nav-link');
        }

    });
});
const mobileMenu = document.getElementById('mobile-menu-btn');
const mobileNav = document.getElementById('mobile-nav');
const contentMenuItem = document.querySelector('.menu-item.active-hidden');
const subMenu = document.querySelector('.sub-menu');
const bugIco = document.getElementById('bug-ico');

// Toggle mobile menu show/hide
mobileMenu.addEventListener('click', () => {
    if (mobileNav.classList.contains('show')) {
        mobileNav.classList.remove('show');
        setTimeout(() => {
            mobileNav.style.display = 'none';
        }, 500);
    } else {
        mobileNav.style.display = 'block';
        setTimeout(() => {
            mobileNav.classList.add('show');
        }, 10);
    }
});

document.querySelectorAll('.menu-item, .sub-menu').forEach(item => {
    item.addEventListener('mouseenter', function () {
        this.classList.add('active-hidden');
    });
    item.addEventListener('mouseleave', function () {
        this.classList.remove('active-hidden');
    });
});

contentMenuItem.addEventListener('click', function (e) {
    e.preventDefault();

    subMenu.classList.toggle('ishidden');

    if (subMenu.classList.contains('ishidden')) {
        bugIco.style.transform = 'rotate(0deg)';
    } else {
        bugIco.style.transform = 'rotate(180deg)';
    }
});