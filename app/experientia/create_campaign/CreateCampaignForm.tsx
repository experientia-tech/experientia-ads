'use client';

import { useState, useEffect } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';
import './CreateCampaignForm.scss';
import { useProfileStore } from '@/app/experientia/store/useProfileStore';
import { useRouter } from 'next/navigation';

const CreateCampaignForm = ({ onClose }: { onClose: () => void }) => {
  const [brandName, setBrandName] = useState('');
  const [campaignLocation, setCampaignLocation] = useState('');
  const [totalTasks, setTotalTasks] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [serviceType, setServiceType] = useState('');
  const {profile} = useProfileStore();
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState('');
  useEffect(() => {
    if (profile?.organizationId) {
      setOrganizationId(profile.organizationId);
    }
  }, [profile]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/api/campaigns', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: brandName,
        address: campaignLocation,
        totalTasks: parseInt(totalTasks, 10) || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        serviceType: serviceType || 'DEFAULT_SERVICE',
        status: 'ACTIVE',
        organizationId: organizationId,
        latitude: null,
        longitude: null,
        description: '',  
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create campaign');
    }

    alert('Campaign created successfully!');
    onClose();
    router.refresh(); 

  } catch (error) {
    console.error('Error creating campaign:', error);
    alert(error instanceof Error ? error.message : 'Failed to create campaign');
  }
};

  return (
    <div className="campaign-form-overlay">
      <div className="campaign-form-container">
        <div className="campaign-form-header">
          <h2>Create New Campaign</h2>
          <button className="close-btn" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="brandName">Brand Name</label>
            <input
              type="text"
              id="brandName"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Enter brand name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="campaignLocation">Search Campaign Location</label>
              <input
                type="text"
                id="campaignLocation"
                value={campaignLocation}
                onChange={(e) => setCampaignLocation(e.target.value)}
                placeholder="Enter location"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="totalTasks">Total Tasks</label>
              <input
                type="number"
                id="totalTasks"
                value={totalTasks}
                onChange={(e) => setTotalTasks(e.target.value)}
                placeholder="Enter number of tasks"
                min="1"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Campaign Start Date</label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">Campaign End Date</label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Brand Image</label>
            <div className="image-upload">
              <label className="upload-btn">
                <FiUpload className="upload-icon" />
                {selectedImage ? 'Change Image' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
              {selectedImage && (
                <div className="image-preview">
                  <img src={selectedImage} alt="Brand Preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="serviceType">Service Type</label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              <option value="">Select service type</option>
              <option value="social_media">Social Media Marketing</option>
              <option value="influencer">Influencer Marketing</option>
              <option value="content">Content Creation</option>
              <option value="event">Event Marketing</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn">
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCampaignForm;
