import { IAnnouncement, ICard, INotification } from './dom.interface.js';

export const notificationData: INotification[] = [

    {
        msg: "License for Introduction to Algebra has been assigned to your school",
        read: false,
        timestamp: "15-Sep-2018 at 07:21 pm",
        course: ""
    },
    {
        msg: "Lesson 3 Practice Worksheet overdue for Amy Santiago",
        read: true,
        timestamp: "15-Sep-2018 at 05:21 pm",
        course: "Course: Advanced Mathematics"
    },
    {
        msg: "23 new students created",
        read: true,
        timestamp: "14-Sep-2018 at 01:21 pm",
        course: ""
    },
    {
        msg: "15 submissions ready for evaluation",
        read: true,
        timestamp: "13-Sep-2018 at 01:15 pm",
        course: "Class: Basics of Algebra"
    },
    {
        msg: "License for Basic Concepts in Geometry has been assigned to your... school",
        read: true,
        timestamp: "15-Sep-2018 at 07:21 pm",
        course: ""
    },
    {
        msg: "Lesson 3 Practice Worksheet overdue for Sam Diego",
        read: false,
        timestamp: "15-Sep-2018 at 05:21 pm",
        course: "Course: Advanced Mathematics"
    }
];

export const announcementData: IAnnouncement[] = [
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
    }
];

export const cardData: ICard[] = [
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
]