import { IAnnouncement, ICard, INotification } from './dom.interface.js';
import { cardData, announcementData, notificationData } from './store.js';

const showNotificationData = (bellData: INotification[]): string | void => {

    const bellDataContainer: Element | null = document.querySelector('.bell-content-container');

    if (!bellDataContainer) {
        return `<h1>Nothing to show</h1>`;
    }
    bellData.forEach(bell => {
        const bellCont = document.createElement("div");
        bellCont.className = !bell.read ? "bell-content" : "bell-content not-read";

        bellCont.innerHTML = `
        <div class="b-ln">
                        <div class="b-ln-text">
                           ${bell.msg}
                        </div>
                          <img width="15px" height="18px" src=${!bell.read ? "../assets/images/checkbox-checked.svg" : "../assets/images/checkbox-unchecked.svg"} class="checkbox" />
                    </div>
                    <div class="bn-sub-name">
                        ${bell.course}
                    </div>
                    <div class="bn-lf">
                        <div class="timestamp">
                            ${bell.timestamp}
                        </div>
                    </div>
    `;

        bellDataContainer.append(bellCont);
    });

};


const showAnnounceMentData = (announcementData: IAnnouncement[]): string | void => {
    const announceMentContainer: Element | null = document.querySelector('.noti-content-container');

    if (!announceMentContainer) {
        return `<h1>Nothing to show here</h1>`
    }

    announcementData.forEach(announcement => {
        const notiCont = document.createElement("div");
        notiCont.className = announcement.read ? "noti-content" : "noti-content not-read";

        notiCont.innerHTML = `
        <div class="n-ln">
            <div class="ln-text">
                <span class="ln-text-higl">${announcement.announcementBy_prefix}</span> 
                ${announcement.announcementBy_Name}
            </div>
            <img width="15px" height="18px" src=${announcement.read ? "../assets/images/check_circle.svg" : "../assets/images/minus-in-circle.svg"} class="checkbox" />
        </div>
        <div class="n-ld">
            ${announcement.msg}
        </div>
        <div class="n-sub-name">
            ${announcement.course_name}
        </div>
        <div class="n-lf" style="${announcement.files ? 'display: flex; align-items: center' : 'display: flex; justify-content: end'}">
            <div class="f-att" style="${announcement.files ? 'display: flex; align-items: center;' : 'display: none'}">
               <img style="margin-left: -4px" src="../assets/images/paperclip.svg" /> ${announcement.files}
            </div>
            <div class="timestamp">
                ${announcement.timestamp}
            </div>
        </div>
    `;

        announceMentContainer.appendChild(notiCont);
    });

}


const showCardData = (cardData: ICard[]) => {
    const container: Element | null = document.querySelector(".cards");

    if (!container) {
        return `<h1>Nothing to show here</h1>`
    }

    cardData.forEach(card => {
        const cardElement = document.createElement("div");
        cardElement.className = "card";


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
            <ul class="action-list">
            <li class="action-list-item" style="opacity: ${card.preview ? 1 : 0.4};">
                <img src="../assets/images/preview.svg" />
            </li>
            <li class="action-list-item" style="opacity: ${card.manage_course ? 1 : 0.4};">
                <img src="../assets/images/manage course.svg" />
            </li>
            <li class="action-list-item" style="opacity: ${card.grade_submission ? 1 : 0.4};">
                <img src="../assets/images/grade submission.svg" />
            </li>
            <li class="action-list-item" style="opacity: ${card.reports ? 1 : 0.4};">
                <img src="../assets/images/reports.svg" />
            </li>
            </ul>
        </div>
    `;

        container.appendChild(cardElement);
    });
}


const handleNavNavigation = () => {
    const navItems: NodeListOf<Element> = document.querySelectorAll('.nav-item');

    navItems.forEach((item: Element) => {
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
};

const handleMobileMenuDisplay = () => {
    const mobileMenu: HTMLElement | null = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const contentMenuItem = document.querySelector('.menu-item.active-hidden');
    const subMenu = document.querySelector('.sub-menu');
    const bugIco = document.getElementById('bug-ico');


    if (!mobileNav || !contentMenuItem || !subMenu || !bugIco || !mobileMenu) {
        return `Nothing To show here`
    }

    mobileMenu.addEventListener('click', () => {
        if (mobileNav?.classList.contains('show')) {
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
            item.classList.add('active-hidden');
        });
        item.addEventListener('mouseleave', function () {
            item.classList.remove('active-hidden');
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
};


const handleNotificationDataDisplay = () => {

    const bellIcon = document.getElementById("bell-icon");
    if (!bellIcon) return `Nothing to Show here`;
    bellIcon.addEventListener('click', () => {
        const bellMenu = document.querySelectorAll<HTMLElement>('.bell-menu');
        const bellImage = bellIcon.querySelectorAll<HTMLImageElement>('.nav-image');
        if (!bellMenu || !bellImage) return `Nothing to Show here`;
        if (bellMenu[0].style.display === "none" || bellMenu[0].style.display === "") {
            bellMenu[0].style.display = "flex";
            bellImage[0].src = "http://127.0.0.1:5500/src/tasks/5/assets/images/alerts-clicked.svg";
        } else {
            bellMenu[0].style.display = "none";
            bellImage[0].src = "http://127.0.0.1:5500/src/tasks/5/assets/images/alerts.svg";
        }
    });
};

const handleAnnouncementDataDisplay = () => {
    const announcementIcon = document.getElementById("announcement-icon");
    if(!announcementIcon) return `Nothing to show here`;
    announcementIcon.addEventListener("click", () => {
        const announeMenu = document.querySelectorAll<HTMLElement>('.noti-menu');
        const announcementImage = announcementIcon.querySelectorAll<HTMLImageElement>('.nav-image');
        if (announeMenu[0].style.display === "none" || announeMenu[0].style.display === "") {
            announeMenu[0].style.display = "flex";
            announcementImage[0].src = "http://127.0.0.1:5500/src/tasks/5/assets/images/announcement-clicked.svg";
        } else {
            announeMenu[0].style.display = "none";
            announcementImage[0].src = "http://127.0.0.1:5500/src/tasks/5/assets/images/announcements.svg"
        }
    })
};

const handleNavbar = () => {
    handleNavNavigation();
    handleAnnouncementDataDisplay();
    handleMobileMenuDisplay();
    handleNotificationDataDisplay();
}

document.addEventListener('DOMContentLoaded', () => {
    showNotificationData(notificationData);
    showAnnounceMentData(announcementData);
    showCardData(cardData);
    handleNavbar();
})

