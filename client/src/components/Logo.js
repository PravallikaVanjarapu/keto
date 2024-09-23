import HomeLogo from "../assets/Battery/keto.png";
import { BsFillLightningChargeFill } from "react-icons/bs";
import React from 'react';
import { useNavigate } from "react-router-dom";


const Logo = () => {

    const navigate = useNavigate();
    const handleClick = () => { 
        navigate('/keto/master')
    }
    return (
        <div>
            <div className="logo">
                <div className="logo-icon">
                    <img style={{ width:"48px"}} src={HomeLogo} alt="" onClick={()=>handleClick()} />
                </div>
            </div>
        </div>
    )
}

export default Logo;