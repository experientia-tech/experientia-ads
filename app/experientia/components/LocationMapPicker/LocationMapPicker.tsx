"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./LocationMapPicker.scss";
import { FiSearch, FiMapPin } from "react-icons/fi";

interface LocationMapPickerProps {
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    onLocationSelect: (data: {
        address: string;
        latitude: number;
        longitude: number;
    }) => void;
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

export default function LocationMapPicker({
    initialLat,
    initialLng,
    initialAddress = "",
    onLocationSelect,
}: LocationMapPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCoords, setSelectedCoords] = useState({
        lat: initialLat || 28.6139, // Default to New Delhi
        lng: initialLng || 77.2090,
    });
    const [selectedAddress, setSelectedAddress] = useState(initialAddress);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    const [searchMode, setSearchMode] = useState<"address" | "coordinates">("address");
    const [latInput, setLatInput] = useState(initialLat ? initialLat.toFixed(6) : "");
    const [lngInput, setLngInput] = useState(initialLng ? initialLng.toFixed(6) : "");
    const [coordError, setCoordError] = useState<string | null>(null);

    // Get user's current location
    useEffect(() => {
        // If initial coordinates are provided, don't get current location
        if (initialLat && initialLng) {
            return;
        }

        setIsLoadingLocation(true);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // handleLocationSelect already updates state and calls onLocationSelect
                    handleLocationSelect(latitude, longitude);

                    // Update map center if map is already initialized
                    if (mapRef.current) {
                        mapRef.current.setCenter([longitude, latitude]);
                        markerRef.current?.setLngLat([longitude, latitude]);
                    }
                    setIsLoadingLocation(false);
                },
                (error) => {
                    console.error("Error getting current location:", error);
                    setIsLoadingLocation(false);
                    // Emit default location if geolocation fails
                    handleLocationSelect(selectedCoords.lat, selectedCoords.lng);
                }
            );
        } else {
            console.log("Geolocation is not supported by this browser.");
            setIsLoadingLocation(false);
            // Emit default location if geolocation is not supported
            handleLocationSelect(selectedCoords.lat, selectedCoords.lng);
        }
    }, [initialLat, initialLng]);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const initialCenter = {
            lng: initialLng || selectedCoords.lng,
            lat: initialLat || selectedCoords.lat,
        };

        mapRef.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/streets-v12",
            center: [initialCenter.lng, initialCenter.lat],
            zoom: 12,
        });

        // Add navigation controls
        mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

        // Create draggable marker
        markerRef.current = new mapboxgl.Marker({
            color: "#7c3aed",
            draggable: true,
        })
            .setLngLat([initialCenter.lng, initialCenter.lat])
            .addTo(mapRef.current);

        // Handle marker drag end
        markerRef.current.on("dragend", () => {
            const lngLat = markerRef.current!.getLngLat();
            handleLocationSelect(lngLat.lat, lngLat.lng);
        });

        // Handle map click
        mapRef.current.on("click", (e) => {
            const { lat, lng } = e.lngLat;
            markerRef.current?.setLngLat([lng, lat]);
            handleLocationSelect(lat, lng);
        });

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
        };
    }, []);

    // Reverse geocode to get address from coordinates
    const reverseGeocode = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!mapboxToken) {
                throw new Error("Mapbox token not found");
            }

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`
            );

            if (!response.ok) {
                throw new Error(`Mapbox API error: ${response.status}`);
            }

            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const bestFeature = data.features.find((f: any) =>
                    f.place_type.includes('address') ||
                    f.place_type.includes('poi')
                ) || data.features[0];

                // Construct a truly full address from feature + context
                let addressParts = [];

                // Add street number and street name if it's an address
                if (bestFeature.address) {
                    addressParts.push(bestFeature.address);
                }
                if (bestFeature.text) {
                    addressParts.push(bestFeature.text);
                }

                // Add context parts (Neighborhood, Locality, Place, District, etc.)
                if (bestFeature.context) {
                    bestFeature.context.forEach((ctx: any) => {
                        addressParts.push(ctx.text);
                    });
                }

                // If we couldn't build it manually, fall back to place_name
                const address = addressParts.length > 0
                    ? Array.from(new Set(addressParts)).join(", ")
                    : bestFeature.place_name;

                setSelectedAddress(address);
                return address;
            } else {
                const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                setSelectedAddress(fallbackAddress);
                return fallbackAddress;
            }
        } catch (error) {
            console.error("Error reverse geocoding:", error);
            const fallbackAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            setSelectedAddress(fallbackAddress);
            return fallbackAddress;
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // Handle location selection
    const handleLocationSelect = async (lat: number, lng: number, updateInputs = true) => {
        setSelectedCoords({ lat, lng });
        if (updateInputs) {
            setLatInput(lat.toFixed(6));
            setLngInput(lng.toFixed(6));
            setCoordError(null);
        }
        const address = await reverseGeocode(lat, lng);
        onLocationSelect({
            address,
            latitude: lat,
            longitude: lng,
        });
    };

    const handleCoordinateInputChange = (type: "lat" | "lng", val: string) => {
        if (val !== "" && !/^-?\d*\.?\d*$/.test(val)) {
            return;
        }

        const nextLat = type === "lat" ? val : latInput;
        const nextLng = type === "lng" ? val : lngInput;

        if (type === "lat") setLatInput(val);
        else setLngInput(val);

        if (nextLat === "" || nextLng === "") {
            setCoordError("Latitude and Longitude coordinates cannot be empty.");
            return;
        }

        const parsedLat = parseFloat(nextLat);
        const parsedLng = parseFloat(nextLng);

        if (isNaN(parsedLat) || isNaN(parsedLng)) {
            setCoordError("Please enter valid numeric coordinates.");
            return;
        }

        if (parsedLat < -90 || parsedLat > 90) {
            setCoordError("Latitude must be between -90 and 90.");
            return;
        }

        if (parsedLng < -180 || parsedLng > 180) {
            setCoordError("Longitude must be between -180 and 180.");
            return;
        }

        setCoordError(null);

        if (mapRef.current) {
            mapRef.current.flyTo({
                center: [parsedLng, parsedLat],
                zoom: 14,
                essential: true,
            });
            markerRef.current?.setLngLat([parsedLng, parsedLat]);
        }

        handleLocationSelect(parsedLat, parsedLng, false);
    };
    // Handle search
    const handleSearch = async (e?: React.FormEvent | React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (!searchQuery.trim()) return;

        setIsLoadingAddress(true);

        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (!mapboxToken) {
                throw new Error("Mapbox token not found");
            }

            // Add proximity bias based on current map center for better results
            const currentCenter = mapRef.current?.getCenter();
            const proximityParam = currentCenter
                ? `&proximity=${currentCenter.lng},${currentCenter.lat}`
                : '';

            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mapboxToken}${proximityParam}&limit=1`
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Mapbox API error response:", errorText);
                throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log("Search results:", data);

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                const address = data.features[0].place_name;

                // Update map and marker
                mapRef.current?.flyTo({
                    center: [lng, lat],
                    zoom: 14,
                    essential: true,
                });
                markerRef.current?.setLngLat([lng, lat]);

                // Update state
                setSelectedCoords({ lat, lng });
                setSelectedAddress(address);
                onLocationSelect({
                    address,
                    latitude: lat,
                    longitude: lng,
                });
            } else {
                alert("Location not found. Please try a different search term.");
            }
        } catch (error) {
            console.error("Error searching location:", error);
            alert(`Failed to search location: ${error instanceof Error ? error.message : "Unknown error"}`);
        } finally {
            setIsLoadingAddress(false);
        }
    };

    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
        return (
            <div className="map-picker-error">
                <p>Mapbox token not configured</p>
            </div>
        );
    }

    return (
        <div className="location-map-picker">
            <div className="map-search-container">
                <div className="search-mode-tabs">
                    <button
                        type="button"
                        className={`tab-btn ${searchMode === "address" ? "active" : ""}`}
                        onClick={() => setSearchMode("address")}
                    >
                        Search Address
                    </button>
                    <button
                        type="button"
                        className={`tab-btn ${searchMode === "coordinates" ? "active" : ""}`}
                        onClick={() => setSearchMode("coordinates")}
                    >
                        Search Coordinates
                    </button>
                </div>

                {searchMode === "address" ? (
                    <div className="search-form">
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search for a location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleSearch(e as any);
                                }
                            }}
                            className="search-input"
                            disabled={isLoadingAddress}
                        />
                        <button
                            type="button"
                            className="search-button"
                            disabled={isLoadingAddress || !searchQuery.trim()}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSearch(e as any);
                            }}
                        >
                            {isLoadingAddress ? "Searching..." : "Search"}
                        </button>
                    </div>
                ) : (
                    <div className="coordinates-form">
                        <div className="coord-input-group">
                            <label htmlFor="lat-input">Latitude</label>
                            <input
                                type="text"
                                id="lat-input"
                                value={latInput}
                                onChange={(e) => handleCoordinateInputChange("lat", e.target.value)}
                                placeholder="e.g., 28.6139"
                                className="coord-input"
                            />
                        </div>
                        <div className="coord-input-group">
                            <label htmlFor="lng-input">Longitude</label>
                            <input
                                type="text"
                                id="lng-input"
                                value={lngInput}
                                onChange={(e) => handleCoordinateInputChange("lng", e.target.value)}
                                placeholder="e.g., 77.2090"
                                className="coord-input"
                            />
                        </div>
                        {coordError && (
                            <div className="coordinate-error-msg">{coordError}</div>
                        )}
                    </div>
                )}
            </div>

            <div ref={mapContainerRef} className="map-container" />

            <div className="location-info">
                <div className="info-header">
                    <FiMapPin className="pin-icon" />
                    <span className="info-title">Selected Location</span>
                </div>
                <div className="info-content">
                    {isLoadingAddress ? (
                        <p className="loading-text">Loading address...</p>
                    ) : (
                        <>
                            <p className="address-text">{selectedAddress || "Click on the map to select a location"}</p>
                            <p className="coords-text">
                                Lat: {selectedCoords.lat.toFixed(6)}, Lng: {selectedCoords.lng.toFixed(6)}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
