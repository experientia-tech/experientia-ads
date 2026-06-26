"use client";
import { useState, useEffect } from "react";
import { FiUpload, FiX, FiMap } from "react-icons/fi";
import "./CreateCampaignForm.scss";
import { useRouter } from "next/navigation";
import { authenticatedFetch } from "@/app/constants/api";
import { getTokenPayload } from "@/app/constants/auth";
import SuccessModal from "../components/success_modal/SuccessModal";
import { useCampaignStore } from "@/app/store/Campaigns";
import dynamic from "next/dynamic";

const LocationMapPicker = dynamic(
  () => import("../components/LocationMapPicker/LocationMapPicker"),
  { ssr: false }
);

const CreateCampaignForm = ({
  onClose,
  isEdit = false,
  initialData = null,
}: {
  onClose: () => void;
  isEdit?: boolean;
  initialData?: any;
}) => {
  const [brandName, setBrandName] = useState(initialData?.name || "");
  const [campaignLocation, setCampaignLocation] = useState(
    initialData?.address || "",
  );
  const [totalTasks, setTotalTasks] = useState(
    initialData?.totalTasks?.toString() || "",
  );
  const [startDate, setStartDate] = useState(
    initialData?.startDate
      ? new Date(initialData.startDate).toISOString().split("T")[0]
      : "",
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate
      ? new Date(initialData.endDate).toISOString().split("T")[0]
      : "",
  );
  const [selectedImage, setSelectedImage] = useState<string | null>(
    initialData?.logo || null,
  );
  const [serviceType, setServiceType] = useState(
    initialData?.serviceType || "",
  );
  const [latitude, setLatitude] = useState(
    initialData?.latitude?.toString() || "",
  );
  const [longitude, setLongitude] = useState(
    initialData?.longitude?.toString() || "",
  );
  const [useMapPicker, setUseMapPicker] = useState(false);
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState("");
  const editCampaignStore = useCampaignStore((state) => state.editCampaign);

  const [successConfig, setSuccessConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const payload = getTokenPayload();
    if (payload?.orgld) {
      setOrganizationId(payload.orgld);
    }
  }, []);
  useEffect(() => {
    if (isEdit && initialData) {
      setBrandName(initialData.name || "");
      setCampaignLocation(initialData.address || "");
      setTotalTasks(initialData.totalTasks?.toString() || "");
      setStartDate(
        initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : "",
      );
      setEndDate(
        initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : "",
      );
      setSelectedImage(initialData.logo || null);
      setServiceType(initialData.serviceType || "");
      setLatitude(initialData.latitude?.toString() || "");
      setLongitude(initialData.longitude?.toString() || "");
    }
  }, [isEdit, initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Show loading state
        setSelectedImage(null);

        // Get presigned URL from API
        const presignedResponse = await fetch('/api/document/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `campaign-logo-${Date.now()}.${file.type.split('/')[1]}`,
            contentType: file.type
          })
        });

        if (!presignedResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, imageUrl } = await presignedResponse.json();

        // Upload file to S3
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }
        setSelectedImage(imageUrl);

      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Failed to upload image. Please try again.');
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const validateCoordinates = () => {
    if (latitude && !/^-?([0-8]?[0-9]|90)\.?[0-9]*$/.test(latitude)) {
      alert("Please enter a valid latitude between -90 and 90");
      return false;
    }
    if (
      longitude &&
      !/^-?([0-9]{1,2}|1[0-7][0-9]|180)\.?[0-9]*$/.test(longitude)
    ) {
      alert("Please enter a valid longitude between -180 and 180");
      return false;
    }
    return true;
  };

  const handleMapLocationSelect = (data: {
    address: string;
    latitude: number;
    longitude: number;
  }) => {
    setCampaignLocation(data.address);
    setLatitude(data.latitude.toString());
    setLongitude(data.longitude.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCoordinates()) {
      return;
    }

    try {
      if (isEdit && initialData) {
        // Calculate diff for partial update
        const updatedFields: any = {};

        if (brandName !== initialData.name) updatedFields.name = brandName;
        if (campaignLocation !== initialData.address)
          updatedFields.address = campaignLocation;

        const tasksNum = parseInt(totalTasks, 10) || 0;
        if (tasksNum !== initialData.totalTasks)
          updatedFields.totalTasks = tasksNum;

        if (
          startDate !==
          (initialData.startDate
            ? new Date(initialData.startDate).toISOString().split("T")[0]
            : "")
        ) {
          updatedFields.startDate = startDate || null;
        }

        if (
          endDate !==
          (initialData.endDate
            ? new Date(initialData.endDate).toISOString().split("T")[0]
            : "")
        ) {
          updatedFields.endDate = endDate || null;
        }

        if (serviceType !== initialData.serviceType)
          updatedFields.serviceType = serviceType;

        const latNum = latitude ? parseFloat(latitude) : null;
        if (latNum !== initialData.latitude) updatedFields.latitude = latNum;

        const lngNum = longitude ? parseFloat(longitude) : null;
        if (lngNum !== initialData.longitude) updatedFields.longitude = lngNum;

        if (selectedImage !== initialData.logo) updatedFields.logo = selectedImage;

        // Check if anything actually changed
        if (Object.keys(updatedFields).length === 0) {
          alert("No changes detected.");
          onClose();
          return;
        }

        const result = await editCampaignStore(initialData.id, updatedFields);

        if (!result.success) {
          throw new Error(result.error || "Failed to update campaign");
        }

        setSuccessConfig({
          isOpen: true,
          title: "Campaign Updated!",
          message: `The campaign "${brandName}" has been successfully updated.`,
        });

        window.dispatchEvent(
          new CustomEvent("campaignUpdated", {
            detail: { campaign: result.data },
          }),
        );
      } else {
        // Create new campaign
        const response = await authenticatedFetch("/api/campaigns", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: brandName,
            address: campaignLocation,
            totalTasks: parseInt(totalTasks, 10) || 0,
            startDate: startDate || null,
            endDate: endDate || null,
            serviceType: serviceType || "DEFAULT_SERVICE",
            status: "ACTIVE",
            latitude: latitude ? parseFloat(latitude) : null,
            longitude: longitude ? parseFloat(longitude) : null,
            description: "",
            logo: selectedImage,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create campaign");
        }

        const data = await response.json();

        setSuccessConfig({
          isOpen: true,
          title: "Campaign Created!",
          message: `The campaign "${brandName}" has been successfully created.`,
        });

        window.dispatchEvent(
          new CustomEvent("campaignCreated", {
            detail: { campaign: data.data || data },
          }),
        );
      }
    } catch (error) {
      console.error(`Error processing campaign:`, error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to process campaign"}`,
      );
    }
  };

  const handleSuccessClose = () => {
    setSuccessConfig((prev) => ({ ...prev, isOpen: false }));
    onClose();
    useCampaignStore.getState().fetchMyCampaigns();
    router.refresh();
  };

  return (
    <div className="campaign-form-overlay">
      <div className="campaign-form-container">
        <div className="campaign-form-header">
          <h2>{isEdit ? "Edit Campaign" : "Create New Campaign"}</h2>
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

          <div className="form-group">
            <div className="location-section-header">
              <label>Campaign Location</label>
              <button
                type="button"
                className="toggle-map-btn"
                onClick={() => setUseMapPicker(!useMapPicker)}
              >
                <FiMap />
                {useMapPicker ? "Use Manual Input" : "Use Map Picker"}
              </button>
            </div>

            {useMapPicker ? (
              <LocationMapPicker
                initialLat={latitude ? parseFloat(latitude) : undefined}
                initialLng={longitude ? parseFloat(longitude) : undefined}
                initialAddress={campaignLocation}
                onLocationSelect={handleMapLocationSelect}
              />
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="campaignLocation">Address</label>
                    <input
                      type="text"
                      id="campaignLocation"
                      value={campaignLocation}
                      onChange={(e) => setCampaignLocation(e.target.value)}
                      placeholder="Enter location"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="latitude">Latitude</label>
                    <input
                      type="number"
                      id="latitude"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="Enter latitude (e.g., 40.7128)"
                      step="any"
                      min="-90"
                      max="90"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="longitude">Longitude</label>
                    <input
                      type="number"
                      id="longitude"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="Enter longitude (e.g., -74.0060)"
                      step="any"
                      min="-180"
                      max="180"
                    />
                  </div>
                </div>
              </>
            )}
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
                {selectedImage ? "Change Image" : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: "none" }}
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
              <option value="Auto Hood">Auto Hood</option>
              <option value="Gym">Gym</option>
              <option value="No Parking Boards">No Parking Boards</option>
              <option value="Pole Boards">Pole Boards</option>
              <option value="Shop Branding">Shop Branding</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="create-btn">
              {isEdit ? "Update Campaign" : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>

      <SuccessModal
        isOpen={successConfig.isOpen}
        onClose={handleSuccessClose}
        title={successConfig.title}
        message={successConfig.message}
      />
    </div>
  );
};

export default CreateCampaignForm;
