import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItems } from '../contexts/ItemContext.jsx';
import { Upload, X, Plus } from 'lucide-react';

const AddItem = () => {
  const navigate = useNavigate();
  const { addItem } = useItems();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: '',
    size: '',
    condition: '',
    tags: '',
    pointValue: 10
  });
  
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    'Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 
    'Accessories', 'Activewear', 'Formal', 'Casual'
  ];

  const clothingTypes = {
    'Tops': ['T-shirt', 'Blouse', 'Sweater', 'Tank Top', 'Hoodie', 'Cardigan'],
    'Bottoms': ['Jeans', 'Trousers', 'Shorts', 'Skirt', 'Leggings'],
    'Dresses': ['Casual Dress', 'Formal Dress', 'Summer Dress', 'Maxi Dress'],
    'Outerwear': ['Jacket', 'Coat', 'Blazer', 'Vest'],
    'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats'],
    'Accessories': ['Bag', 'Hat', 'Scarf', 'Belt', 'Jewelry'],
    'Activewear': ['Sports Bra', 'Workout Pants', 'Athletic Shorts'],
    'Formal': ['Suit', 'Evening Dress', 'Formal Shirt'],
    'Casual': ['Casual Shirt', 'Casual Pants', 'Casual Dress']
  };

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '6', '8', '10', '12', '14', '16'];
  const conditions = ['Like New', 'Excellent', 'Good', 'Fair'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    files.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Each image must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setImages(prev => [...prev, {
          file,
          preview: e.target.result,
          id: Date.now() + Math.random()
        }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (images.length === 0) {
      setError('Please add at least one image');
      setLoading(false);
      return;
    }

    // Convert images to base64 for demo (in production, use proper file upload)
    const imageUrls = images.map(img => img.preview);
    
    const tags = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];

    const itemData = {
      ...formData,
      images: imageUrls,
      tags,
      pointValue: parseInt(formData.pointValue)
    };

    const result = await addItem(itemData);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Failed to add item');
    }
    
    setLoading(false);
  };

  return (
    <div className="add-item">
      <div className="container container-sm">
        <div className="page-header">
          <h1>Add New Item</h1>
          <p>List your pre-loved clothing for the community to discover</p>
        </div>

        <form onSubmit={handleSubmit} className="item-form card">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Image Upload */}
          <div className="form-section">
            <h3>Photos</h3>
            <p className="form-hint">Add up to 5 photos. First photo will be the main image.</p>
            
            <div className="image-upload-area">
              {images.length > 0 && (
                <div className="image-previews">
                  {images.map((image, index) => (
                    <div key={image.id} className="image-preview">
                      <img src={image.preview} alt={`Preview ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(image.id)}
                      >
                        <X size={16} />
                      </button>
                      {index === 0 && <span className="main-image-badge">Main</span>}
                    </div>
                  ))}
                </div>
              )}
              
              {images.length < 5 && (
                <label htmlFor="images" className="upload-btn">
                  <Upload size={24} />
                  <span>Add Photos</span>
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label htmlFor="title" className="form-label">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="e.g., Vintage Denim Jacket"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="form-input form-textarea"
                required
                placeholder="Describe the item, its condition, and any special features..."
                rows="4"
              />
            </div>
          </div>

          {/* Category & Details */}
          <div className="form-section">
            <h3>Category & Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category" className="form-label">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="type" className="form-label">Type *</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={!formData.category}
                >
                  <option value="">Select Type</option>
                  {formData.category && clothingTypes[formData.category]?.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="size" className="form-label">Size *</label>
                <select
                  id="size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Size</option>
                  {sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="condition" className="form-label">Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="form-select"
                  required
                >
                  <option value="">Select Condition</option>
                  {conditions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h3>Additional Details</h3>
            
            <div className="form-group">
              <label htmlFor="tags" className="form-label">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., vintage, boho, summer (separate with commas)"
              />
              <small className="form-hint">Add tags to help others find your item</small>
            </div>

            <div className="form-group">
              <label htmlFor="pointValue" className="form-label">Point Value *</label>
              <input
                type="number"
                id="pointValue"
                name="pointValue"
                value={formData.pointValue}
                onChange={handleChange}
                className="form-input"
                min="1"
                max="100"
                required
              />
              <small className="form-hint">How many points should this item cost? (1-100)</small>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Adding Item...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .add-item {
          padding: 2rem 0;
          min-height: calc(100vh - 80px);
        }

        .page-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .page-header h1 {
          color: var(--text-primary);
          margin-bottom: 0.5rem;
        }

        .page-header p {
          color: var(--text-secondary);
        }

        .item-form {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--border);
        }

        .form-section:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .form-section h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .form-hint {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 1rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .image-upload-area {
          border: 2px dashed var(--border);
          border-radius: 12px;
          padding: 2rem;
          text-align: center;
        }

        .image-previews {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .image-preview {
          position: relative;
          aspect-ratio: 1;
          border-radius: 8px;
          overflow: hidden;
        }

        .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .remove-image {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background-color: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--error-color);
        }

        .main-image-badge {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          background-color: var(--primary-color);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .upload-btn {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 2rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.3s ease;
        }

        .upload-btn:hover {
          color: var(--primary-color);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border);
        }

        .error-message {
          background-color: #ffeaea;
          color: var(--error-color);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid #ffcdd2;
          margin-bottom: 2rem;
        }

        small.form-hint {
          display: block;
          margin-top: 0.25rem;
          color: var(--text-light);
          font-size: 0.75rem;
        }

        @media (max-width: 768px) {
          .item-form {
            padding: 1rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .image-previews {
            grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AddItem;