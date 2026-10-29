import { Link, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Brand } from "./Brand";
import { Button, Notice } from "./ui";
import { useAuth } from "../contexts/auth-context";
import { errorMessage } from "../lib/api";
export function AccountLayout() {
  const { logout }=useAuth(); const navigate=useNavigate();const [error,setError]=useState("");const [busy,setBusy]=useState(false);
  async function signOut(){setBusy(true);setError("");try{await logout();navigate("/login",{replace:true});}catch(error){setError(errorMessage(error));}finally{setBusy(false);}}
  return <div className="account-shell"><header><Brand/><nav aria-label="Main navigation"><Link to="/clubs">Your clubs</Link><Link to="/profile">My account</Link><Button variant="secondary" busy={busy} onClick={()=>void signOut()}>Sign out</Button></nav></header><main>{error&&<Notice>{error}</Notice>}<Outlet/></main></div>;
}
