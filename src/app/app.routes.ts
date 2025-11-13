import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AvatarViewer } from './meeting/avatar-viewer/avatar-viewer';
import { MeetingLogin } from './meeting/meeting-login/meeting-login';
import { Dashboard } from './recruiter/dashboard/dashboard';
import { Login } from './recruiter/login/login';
import { Interview } from './meeting/interview/interview';

export const routes: Routes = [

    // RECRUITER ROUTES
    { path: '', component: Login },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

    // MEETING ROUTES
    { path: 'meeting', component: MeetingLogin },
    { path: 'interview',component: Interview, canActivate: [authGuard] },
    { path: 'avatar',component: AvatarViewer, canActivate: [authGuard] }
];
