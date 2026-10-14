import React from 'react';
import "../App.css";
import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
    const router = useNavigate();

    const handleJoinAsGuest = () => {
        const guestRoom = Math.random().toString(36).substring(2, 10);
        router(`/${guestRoom}`);
    };

    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='navHeader'>
                    <h2>Meetly</h2>
                </div>
                <div className='navlist'>
                    <p onClick={handleJoinAsGuest} style={{ cursor: "pointer" }}>Join as Guest</p>
                    <p onClick={() => router("/auth")} style={{ cursor: "pointer" }}>Register</p>
                    <div onClick={() => router("/auth")} role='button' style={{ cursor: "pointer" }}>
                        <p style={{ margin: 0 }}>Login</p>
                    </div>
                </div>
            </nav>

            <div className="landingMainContainer">
                <div>
                    <h1><span style={{ color: "#FF9839" }}>Connect</span> with your loved Ones</h1>
                    <p>Cover the distance with Meetly</p>
                    <div role='button'>
                        <Link to={"/auth"}>Get Started</Link>
                    </div>
                </div>
                <div>
                    <img src="/mobile.png" alt="Mobile preview" />
                </div>
            </div>
        </div>
    );
}

