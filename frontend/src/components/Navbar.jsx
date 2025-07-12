import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Menu, X, User, LogOut, Package, Plus, Settings } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="nav-content">
          <Link to="/" className="nav-brand">
            <Package className="nav-logo" />
            <span>ReWear</span>
          </Link>

          <div className={`nav-menu ${isMenuOpen ? 'nav-menu-open' : ''}`}>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <User size={18} />
                  Dashboard
                </Link>
                <Link to="/add-item" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  <Plus size={18} />
                  Add Item
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                    <Settings size={18} />
                    Admin
                  </Link>
                )}
                <div className="nav-user">
                  <span className="nav-username">Hi, {user?.name}</span>
                  <span className="nav-points">{user?.points || 0} pts</span>
                  <button onClick={handleLogout} className="nav-logout">
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link" onClick={() => setIsMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary btn-small" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button className="nav-toggle" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background-color: var(--surface);
          border-bottom: 1px solid var(--border);
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 0;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--primary-color);
          font-size: 1.5rem;
          font-weight: 700;
        }

        .nav-logo {
          color: var(--primary-color);
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 2rem;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          color: var(--text-primary);
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .nav-link:hover {
          color: var(--primary-color);
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .nav-username {
          font-weight: 500;
          color: var(--text-primary);
        }

        .nav-points {
          background-color: var(--accent-color);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .nav-logout {
          display: flex;
          align-items: center;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }

        .nav-logout:hover {
          background-color: var(--border);
          color: var(--error-color);
        }

        .nav-toggle {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
        }

        @media (max-width: 768px) {
          .nav-toggle {
            display: block;
          }

          .nav-menu {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background-color: var(--surface);
            border-top: 1px solid var(--border);
            flex-direction: column;
            align-items: stretch;
            padding: 1rem;
            gap: 1rem;
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
          }

          .nav-menu-open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }

          .nav-user {
            flex-direction: column;
            align-items: stretch;
            gap: 0.5rem;
          }

          .nav-link {
            padding: 0.5rem 0;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;