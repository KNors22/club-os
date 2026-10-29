import { Navigate, Outlet, Route, Routes, Link, useLocation } from "react-router-dom";
import { useAuth } from "./contexts/auth-context";
import { AuthPage } from "./pages/AuthPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AccountLayout } from "./components/AccountLayout";
import { ErrorState, Loading } from "./components/ui";
import { Brand } from "./components/Brand";
function RequireAuth(){const {user}=useAuth();const location=useLocation();return user?<Outlet/>:<Navigate to="/login" state={{from:location.pathname}} replace/>;}
export function App(){const auth=useAuth();if(auth.loading)return <div className="full-screen-state"><Brand/><Loading/></div>;if(auth.error)return <div className="full-screen-state"><Brand/><ErrorState message={auth.error} retry={auth.retry}/></div>;return <Routes><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route element={<RequireAuth/>}><Route element={<AccountLayout/>}><Route path="/profile" element={<ProfilePage/>}/><Route path="/clubs" element={<section><h1>Your clubs</h1><p>Your account is ready. Manage your profile to get started.</p><Link to="/profile">Manage your profile</Link></section>}/></Route></Route><Route path="*" element={<Navigate to={auth.user?"/clubs":"/login"} replace/>}/></Routes>;}
