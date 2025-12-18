import React from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../assets/LOGO-name.svg";
import { useAuth } from "../context/AuthContext";
import UserMenu from "./UserMenu";
import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header glass-panel">
      <div className="logo-container">
        <Link
          to={user && user.role === "organizer" ? "/my-created" : "/"}
          className="logo-link"
        >
          <img src={logo} alt="AIV Voting Logo" className="logo-img" />
          {/* <span className="site-title gradient-text">AI Voting</span> */}
        </Link>
      </div>

      <nav className="nav">
        {user && user.role === "organizer" ? (
          <NavLink
            to="/my-created"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            My created Votings
          </NavLink>
        ) : (
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            Home
          </NavLink>
        )}
        <NavLink
          to="/whitepaper"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Whitepaper
        </NavLink>
        <NavLink
          to="/guide"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Guide
        </NavLink>
        {user && user.role === "organizer" && (
          <NavLink
            to="/create"
            className={({ isActive }) =>
              isActive ? "nav-link create-btn active" : "nav-link create-btn"
            }
          >
            Create Voting
          </NavLink>
        )}

        {user ? (
          <UserMenu />
        ) : (
          <Link to="/login" className="nav-link login-btn">
            Login
          </Link>
        )}
      </nav>
    </header>
  );
};

export default Header;
