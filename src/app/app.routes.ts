import { Routes } from '@angular/router';
import { Login } from './login/login';
import { authGuard } from './guards/auth.guard';
import { Interview } from './interview/interview';
import { AvatarViewer } from './components/avatar-viewer/avatar-viewer';
import { MeetingLogin } from './meeting-login/meeting-login';

export const routes: Routes = [

    {   path: '', component: Login },
    

    {   path: 'meeting', component: MeetingLogin },
    {
        path: 'interview',component: Interview,
        canActivate: [authGuard] // ✅ Protect Dashboard
    },

    {
        path: 'avatar',component: AvatarViewer,
        canActivate: [authGuard] // ✅ Protect Dashboard
    }
];
