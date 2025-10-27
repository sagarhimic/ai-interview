import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Inverview } from "./inverview/inverview";
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

    {   path: '', component: Login },
    
    {
        path: 'interview',component: Inverview,
        canActivate: [authGuard] // ✅ Protect Dashboard
    }
];
