export interface INotification {
    msg: string,
    read: boolean,
    timestamp: string;
    course: string | undefined;
}

export interface IAnnouncement {
    announcementBy_prefix: string,
    announcementBy_Name: string,
    msg: string,
    files: string | undefined,
    course_name: string | undefined,
    read: boolean,
    timestamp: string
}

export interface ICard {
    img: string,
    topic: string,
    subject: string,
    grade: string,
    grade_plus: string,
    units: number | null,
    lessons: number | null,
    topics: number | null,
    teacher_class: string,
    no_of_students: number | null,
    date_of_class: string | null,
    is_favourite: boolean,
    isExpired: boolean,
    preview: boolean,
    manage_course: boolean,
    grade_submission: boolean,
    reports: boolean
}