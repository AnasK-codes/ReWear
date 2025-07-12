import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useItems } from '../contexts/ItemContext.jsx';
import ItemCard from '../components/ItemCard.jsx';
import { ArrowRight, Recycle, Users, Award, ChevronLeft, ChevronRight } from 'lucide-react';

const Landing = () => {
  const { items, loading } = useItems();
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredItems = Array.isArray(items) ? items.slice(0, 6) : [];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.max(1, Math.ceil(featuredItems.length / 3)));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(featuredItems.length / 3)) % Math.max(1, Math.ceil(featuredItems.length / 3)));
  };

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [featuredItems.length]);

  return (
    <div className="landing">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Give Your Clothes a <span className="text-primary">Second Life</span>
              </h1>
              <p className="hero-description">
                Join ReWear's community clothing exchange. Swap, redeem, and discover pre-loved fashion 
                while reducing textile waste and building a sustainable wardrobe.
              </p>
              <div className="hero-actions">
                <Link to="/register" className="btn btn-primary">
                  Start Swapping
                  <ArrowRight size={20} />
                </Link>
                <Link to="#features" className="btn btn-outline">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="hero-image">
              <img 
                src="https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg" 
                alt="Sustainable Fashion"
                className="hero-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title text-center">How ReWear Works</h2>
          <div className="features-grid grid grid-3">
            <div className="feature-card card">
              <div className="feature-icon">
                <Recycle size={48} />
              </div>
              <div className="card-body">
                <h3>List Your Items</h3>
                <p>Upload photos and descriptions of clothes you no longer wear. Our community will give them new life.</p>
              </div>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <Users size={48} />
              </div>
              <div className="card-body">
                <h3>Connect & Swap</h3>
                <p>Browse items from other users and request direct swaps or use your earned points to redeem items.</p>
              </div>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">
                <Award size={48} />
              </div>
              <div className="card-body">
                <h3>Earn Rewards</h3>
                <p>Gain points for each successful swap and contribution to the community. Use points to get items you love.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Items Carousel */}
      <section className="featured-items">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Items</h2>
            <Link to="/browse" className="btn btn-outline btn-small">
              Browse All Items
            </Link>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : featuredItems.length > 0 ? (
            <div className="carousel">
              <button className="carousel-btn carousel-prev" onClick={prevSlide}>
                <ChevronLeft size={24} />
              </button>
              <div className="carousel-container">
                <div 
                  className="carousel-track"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {featuredItems.map((item, index) => (
                    <div key={item._id} className="carousel-slide">
                      <ItemCard item={item} />
                    </div>
                  ))}
                </div>
              </div>
              <button className="carousel-btn carousel-next" onClick={nextSlide}>
                <ChevronRight size={24} />
              </button>
            </div>
          ) : (
            <div className="no-items">
              <p>No items available yet. Be the first to add one!</p>
              <Link to="/add-item" className="btn btn-primary">
                Add First Item
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Your Sustainable Fashion Journey?</h2>
            <p>Join thousands of users already making a difference through conscious fashion choices.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-primary">
                Join ReWear Today
              </Link>
              <Link to="/add-item" className="btn btn-secondary">
                List Your First Item
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hero {
          padding: 4rem 0;
          background: linear-gradient(135deg, #f8fffe 0%, #e8f5e8 100%);
        }

        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: center;
          gap: 4rem;
        }

        .hero-title {
          font-size: 3rem;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          color: var(--text-primary);
        }

        .hero-description {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .hero-actions .btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .hero-image {
          position: relative;
        }

        .hero-img {
          width: 100%;
          height: 400px;
          object-fit: cover;
          border-radius: 12px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }

        .features {
          padding: 4rem 0;
        }

        .section-title {
          margin-bottom: 3rem;
          color: var(--text-primary);
        }

        .features-grid {
          gap: 2rem;
        }

        .feature-card {
          text-align: center;
          padding: 2rem;
        }

        .feature-icon {
          color: var(--primary-color);
          margin-bottom: 1rem;
        }

        .featured-items {
          padding: 4rem 0;
          background-color: #f8f9fa;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .carousel {
          position: relative;
          overflow: hidden;
        }

        .carousel-container {
          overflow: hidden;
          border-radius: 12px;
        }

        .carousel-track {
          display: flex;
          transition: transform 0.5s ease;
        }

        .carousel-slide {
          min-width: 33.333%;
          padding: 0 1rem;
        }

        .carousel-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: white;
          border: 2px solid var(--border);
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .carousel-btn:hover {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .carousel-prev {
          left: -24px;
        }

        .carousel-next {
          right: -24px;
        }

        .no-items {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .cta {
          padding: 4rem 0;
          background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white;
        }

        .cta-content {
          text-align: center;
        }

        .cta-content h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .cta-content p {
          font-size: 1.25rem;
          margin-bottom: 2rem;
          opacity: 0.9;
        }

        .cta-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        @media (max-width: 768px) {
          .hero-content {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .hero-title {
            font-size: 2rem;
          }

          .hero-description {
            font-size: 1rem;
          }

          .hero-actions {
            justify-content: center;
            flex-wrap: wrap;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }

          .carousel-slide {
            min-width: 100%;
          }

          .carousel-btn {
            display: none;
          }

          .cta-content h2 {
            font-size: 1.8rem;
          }

          .cta-actions {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default Landing;