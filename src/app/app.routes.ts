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

export const routes: Routes = [

    // RECRUITER ROUTES
    { path: '', component: Login, canActivate: [loginGuard] },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

    // MEETING ROUTES
    { path: 'meeting-login', component: MeetingLogin, canActivate: [meetLoginGuard] },
    { path: 'interview',component: Interview, canActivate: [meetAuthGuard] },
    { path: 'avatar',component: AvatarViewer, canActivate: [meetAuthGuard] }
];
