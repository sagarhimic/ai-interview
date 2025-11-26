import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { AvatarViewer } from './meeting/avatar-viewer/avatar-viewer';
import { MeetingLogin } from './meeting/meeting-login/meeting-login';
import { Dashboard } from './recruiter/dashboard/dashboard';
import { Login } from './recruiter/login/login';
import { Interview } from './meeting/interview/interview';
import { meetAuthGuard } from './core/guards/meet-auth-guard';
import { loginGuard } from './core/guards/login-guard';
import { meetLoginGuard } from './core/guards/meet-login-guard';
import { ProfileSearch } from './recruiter/profile-search/profile-search';
import { RecruiterLayout } from './layouts/recruiter-layout/recruiter-layout';
import { ROUTES } from './core/constants/routes';
import { ScheduleInterview } from './recruiter/schedule-interview/schedule-interview';
import { ScheduleNewInterview } from './recruiter/schedule-new-interview/schedule-new-interview';
import { MeetingExpired } from './meeting/meeting-expired/meeting-expired';

export const routes: Routes = [

    // RECRUITER ROUTES
    { path: ROUTES.RECRUITER.LOGIN, component: Login, canActivate: [loginGuard] },

    {
        path: '', component: RecruiterLayout, canActivate: [authGuard],
        children: [
            { path: ROUTES.RECRUITER.DASHBOARD.slice(1), component: Dashboard },
            { path: ROUTES.RECRUITER.PROFILE_SEARCH.slice(1), component: ProfileSearch },
            { path: ROUTES.RECRUITER.SCHEDULE_INTERVIEW.slice(1), component: ScheduleInterview },
            { path: ROUTES.RECRUITER.SCHEDULE_NEW_INTERVIEW.slice(1), component: ScheduleNewInterview },
        ]
    },

    // MEETING ROUTES
    { path: ROUTES.MEETING.LOGIN.slice(1), component: MeetingLogin, canActivate: [meetLoginGuard] },
    { path: ROUTES.MEETING.INTERVIEW.slice(1), component: Interview, canActivate: [meetAuthGuard] },
    { path: ROUTES.MEETING.AVATAR.slice(1), component: AvatarViewer, canActivate: [meetAuthGuard] },


    { path: ROUTES.MEETING.EXPIRED.slice(1), component: MeetingExpired },


    // ⚠️ CATCH ALL INVALID ROUTES
    { path: '**', redirectTo: ROUTES.ROOT }
];
