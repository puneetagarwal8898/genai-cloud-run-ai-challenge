import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Globe,
  Tag,
  Check,
  Loader2,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import L from 'leaflet';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from '@vis.gl/react-google-maps';
import { SanctuaryLocation, JournalInteraction } from '../types';

interface LocationSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationTagged: (location: SanctuaryLocation) => void;
  existingLocation?: SanctuaryLocation;
  interactionsWithLocation?: JournalInteraction[];
  activeInteraction?: JournalInteraction | null;
}

const SANCTUARY_PRESETS = [
  { name: 'Kyoto Bamboo Grove, Japan', latitude: 35.0165, longitude: 135.6713, description: 'Tranquil whispering bamboo' },
  { name: 'Big Sur Coastline, California', latitude: 36.2704, longitude: -121.8081, description: 'Pacific mist and ocean waves' },
  { name: 'Lake District, England', latitude: 54.4609, longitude: -3.0886, description: 'Gentle green rolling hills' },
  { name: 'Mount Fuji Foothills, Japan', latitude: 35.3606, longitude: 138.7274, description: 'Grounded morning calm' }
];

/**
 * Controller to smoothly pan the Google Map when center coordinates change
 */
const GoogleMapController: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (map && center && typeof center.lat === 'number' && typeof center.lng === 'number') {
      try {
        map.panTo(center);
      } catch (err) {
        // Safe catch for detached map instance
      }
    }
  }, [map, center.lat, center.lng]);
  return null;
};

interface PlaceSuggestion {
  id: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  type: string;
}

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelected: (placeName: string, lat: number, lng: number) => void;
}

/**
 * Real-time Autocomplete input with instant suggestions dropdown and coordinates
 */
const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChange,
  onPlaceSelected
}) => {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeFetchRef = useRef<number>(0);

  // Debounced search fetching matching locations with real coordinates
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    const fetchId = ++activeFetchRef.current;
    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?q=${encodeURIComponent(value.trim())}`);
        if (res.ok && activeFetchRef.current === fetchId) {
          const data: PlaceSuggestion[] = await res.json();
          setSuggestions(data);
          setIsOpen(data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (err) {
        console.warn('Autocomplete fetch notice:', err);
      } finally {
        if (activeFetchRef.current === fetchId) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (item: PlaceSuggestion) => {
    onChange(item.name);
    onPlaceSelected(item.name, item.latitude, item.longitude);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          id="location-name-input"
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type any place, city, or sanctuary (e.g. Central Park, Kyoto)"
          className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition pr-8"
          style={{
            backgroundColor: 'var(--bg-input)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
          ) : (
            <Search className="w-3.5 h-3.5 opacity-40" style={{ color: 'var(--text-secondary)' }} />
          )}
        </div>
      </div>

      {/* Auto-suggestions dropdown list */}
      {isOpen && suggestions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto custom-scrollbar"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          <div className="px-3 py-1.5 border-b text-[10px] uppercase font-semibold tracking-wider flex items-center justify-between"
            style={{
              backgroundColor: 'var(--bg-card-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-muted)'
            }}
          >
            <span>Suggested Locations & Coordinates</span>
            <span>{suggestions.length} results</span>
          </div>

          {suggestions.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3.5 py-2.5 transition flex items-start gap-2.5 border-b last:border-b-0 cursor-pointer"
                style={{
                  borderColor: 'var(--border-color)',
                  backgroundColor: isSelected ? 'var(--bg-card-elevated)' : 'var(--bg-card)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-card-elevated)';
                  setSelectedIndex(idx);
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                  }
                }}
              >
                <div className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-xs leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                      {item.name}
                    </p>
                    {item.type && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-medium shrink-0 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {item.type}
                      </span>
                    )}
                  </div>
                  {item.formattedAddress && (
                    <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {item.formattedAddress}
                    </p>
                  )}
                  <p className="text-[10px] font-mono mt-1" style={{ color: 'var(--accent)' }}>
                    {item.latitude.toFixed(4)}° N, {item.longitude.toFixed(4)}° E
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Interactive Leaflet sanctuary map for 100% reliable local/offline rendering
 */
interface LeafletSanctuaryMapProps {
  center: { lat: number; lng: number };
  placeName: string;
  onCoordinatesSelected: (lat: number, lng: number) => void;
  savedInteractions?: JournalInteraction[];
  onSelectPin?: (interaction: JournalInteraction) => void;
}

const LeafletSanctuaryMap: React.FC<LeafletSanctuaryMapProps> = ({
  center,
  onCoordinatesSelected,
  savedInteractions = [],
  onSelectPin
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const mainMarkerRef = useRef<L.Marker | null>(null);
  const pastMarkersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center.lat, center.lng],
      zoom: 11,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
    }).addTo(map);

    // Glowing amber sanctuary pin icon
    const mainIcon = L.divIcon({
      className: 'sanctuary-pin-wrapper',
      html: `
        <div class="sanctuary-pin-pulse">
          <div style="background-color: #f59e0b; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.5); border: 2.5px solid #ffffff;">
            <div style="width: 7px; height: 7px; background-color: #ffffff; border-radius: 50%;"></div>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 28]
    });

    const marker = L.marker([center.lat, center.lng], {
      icon: mainIcon,
      draggable: true
    }).addTo(map);

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onCoordinatesSelected(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      onCoordinatesSelected(e.latlng.lat, e.latlng.lng);
    });

    mainMarkerRef.current = marker;
    mapInstanceRef.current = map;

    // Small delay to ensure container dimension calculation settles after modal fade-in
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Smoothly fly map and update marker pin when center coordinates update
  useEffect(() => {
    if (mapInstanceRef.current && mainMarkerRef.current) {
      mapInstanceRef.current.flyTo([center.lat, center.lng], Math.max(mapInstanceRef.current.getZoom(), 11), {
        duration: 1.0
      });
      mainMarkerRef.current.setLatLng([center.lat, center.lng]);
    }
  }, [center.lat, center.lng]);

  // Render reflection history pins
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    pastMarkersRef.current.forEach((m) => m.remove());
    pastMarkersRef.current = [];

    const pastIcon = L.divIcon({
      className: 'past-pin-wrapper',
      html: `
        <div style="background-color: #0ea5e9; width: 18px; height: 18px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 1.5px solid #ffffff;">
          <div style="width: 5px; height: 5px; background-color: #ffffff; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 22]
    });

    savedInteractions.forEach((item) => {
      if (!item.location) return;
      const m = L.marker([item.location.latitude, item.location.longitude], { icon: pastIcon }).addTo(map);
      m.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPin?.(item);
      });
      pastMarkersRef.current.push(m);
    });
  }, [savedInteractions]);

  return <div ref={containerRef} className="w-full h-full" style={{ minHeight: '100%' }} />;
};

export const LocationSanctuaryModal: React.FC<LocationSanctuaryModalProps> = ({
  isOpen,
  onClose,
  onLocationTagged,
  existingLocation,
  interactionsWithLocation = []
}) => {
  const [placeName, setPlaceName] = useState(existingLocation?.placeName || '');
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number }>(
    existingLocation
      ? { lat: existingLocation.latitude, lng: existingLocation.longitude }
      : { lat: 35.0165, lng: 135.6713 }
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [selectedPin, setSelectedPin] = useState<JournalInteraction | null>(null);
  const [authError, setAuthError] = useState(false);

  // Sync with existing location or reset on open
  useEffect(() => {
    if (isOpen) {
      if (existingLocation) {
        setPlaceName(existingLocation.placeName);
        setCurrentPos({ lat: existingLocation.latitude, lng: existingLocation.longitude });
      }
      setSelectedPin(null);
      setLocationSuccess(false);
    }
  }, [isOpen, existingLocation]);

  // Listen for Google Maps auth errors to prevent black screen
  useEffect(() => {
    const handleAuthFailure = () => {
      console.warn('Google Maps authentication failure event detected.');
      setAuthError(true);
    };
    (window as any).gm_authFailure = handleAuthFailure;
    return () => {
      if ((window as any).gm_authFailure === handleAuthFailure) {
        delete (window as any).gm_authFailure;
      }
    };
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Key lookup: Check runtime global injected by server endpoint, then environment variables
  const apiKey =
    (typeof window !== 'undefined' && (window as any).__GOOGLE_MAPS_API_KEY__) ||
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    import.meta.env.VITE_MAPS_API_KEY ||
    '';

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        setPlaceName(`Peaceful Spot (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Location lookup notice:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApplyLocation = () => {
    const loc: SanctuaryLocation = {
      latitude: currentPos.lat,
      longitude: currentPos.lng,
      placeName: placeName.trim() || 'Peaceful Spot'
    };
    onLocationTagged(loc);
    setLocationSuccess(true);
    setTimeout(() => {
      setLocationSuccess(false);
      onClose();
    }, 1200);
  };

  const hasGoogleMaps = Boolean(apiKey && !authError);

  const renderModalContent = () => (
    <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
      {/* Interactive Map View with Live Coordinates */}
      <div
        className="relative rounded-2xl overflow-hidden border h-[260px] sm:h-[280px] w-full flex flex-col justify-center items-center shadow-inner"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-color)'
        }}
      >
        {hasGoogleMaps ? (
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={currentPos}
            center={currentPos}
            defaultZoom={11}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling="cooperative"
            disableDefaultUI={false}
          >
            <AdvancedMarker position={currentPos}>
              <Pin background="#f59e0b" glyphColor="#ffffff" borderColor="#d97706" />
            </AdvancedMarker>

            {interactionsWithLocation.map((item) => {
              if (!item.location) return null;
              return (
                <AdvancedMarker
                  key={item.id}
                  position={{
                    lat: item.location.latitude,
                    lng: item.location.longitude
                  }}
                  onClick={() => setSelectedPin(item)}
                >
                  <Pin background="#0ea5e9" glyphColor="#ffffff" borderColor="#0284c7" />
                </AdvancedMarker>
              );
            })}
            <GoogleMapController center={currentPos} />
          </Map>
        ) : (
          <LeafletSanctuaryMap
            center={currentPos}
            placeName={placeName}
            onCoordinatesSelected={(lat, lng) => {
              setCurrentPos({ lat, lng });
            }}
            savedInteractions={interactionsWithLocation}
            onSelectPin={(item) => setSelectedPin(item)}
          />
        )}

        {/* Selected Pin Overlay */}
        {selectedPin && (
          <div
            className="absolute top-3 left-3 right-3 p-3 rounded-xl border shadow-lg text-xs space-y-1 z-20"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                {selectedPin.location?.placeName || 'Past Reflection'}
              </span>
              <button
                onClick={() => setSelectedPin(null)}
                className="opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="italic line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
              "{selectedPin.prompt}"
            </p>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {new Date(selectedPin.timestamp || selectedPin.createdAt).toLocaleDateString()}
            </p>
          </div>
        )}

        {/* Floating Pinpoint Indicator Badge */}
        <div
          className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono shadow-md z-20 backdrop-blur-sm pointer-events-none"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            color: '#f8fafc'
          }}
        >
          📍 {currentPos.lat.toFixed(4)}°, {currentPos.lng.toFixed(4)}°
        </div>
      </div>

      {/* Location Name with Real-Time Autocomplete Dropdown & Device Position */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Place Name / Sanctuary
          </label>
          <PlaceAutocompleteInput
            value={placeName}
            onChange={(val) => setPlaceName(val)}
            onPlaceSelected={(name, lat, lng) => {
              setPlaceName(name);
              setCurrentPos({ lat, lng });
            }}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={isLocating}
            className="w-full py-2.5 px-4 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'var(--accent-light)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)'
            }}
          >
            <Navigation className="w-4 h-4" />
            {isLocating ? 'Detecting Location...' : 'Use My Current Location'}
          </button>
        </div>
      </div>

      {/* Sanctuary Geographies Presets */}
      <div>
        <span className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
          Or Choose a Peaceful Destination Preset
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SANCTUARY_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => {
                setCurrentPos({ lat: preset.latitude, lng: preset.longitude });
                setPlaceName(preset.name.split(',')[0]);
              }}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                placeName === preset.name.split(',')[0] ? 'shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: placeName === preset.name.split(',')[0] ? 'var(--accent-light)' : 'var(--bg-card-elevated)',
                borderColor: placeName === preset.name.split(',')[0] ? 'var(--accent)' : 'var(--border-color)',
                color: placeName === preset.name.split(',')[0] ? 'var(--accent)' : 'var(--text-primary)'
              }}
            >
              <p className="text-xs font-semibold truncate">
                {preset.name.split(',')[0]}
              </p>
              <p className="text-[10px] line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {locationSuccess && (
        <div
          className="p-3 rounded-xl border flex items-center gap-2 text-xs"
          style={{
            backgroundColor: 'var(--accent-light)',
            borderColor: 'var(--accent)',
            color: 'var(--accent)'
          }}
        >
          <Check className="w-4 h-4 shrink-0" />
          Place "{placeName}" attached to reflection!
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs opacity-70 hover:opacity-100 transition cursor-pointer"
          style={{ color: 'var(--text-secondary)' }}
        >
          Cancel
        </button>
        <button
          id="confirm-tag-location-button"
          type="button"
          onClick={handleApplyLocation}
          className="px-5 py-2 rounded-xl text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          style={{
            backgroundColor: 'var(--accent)',
            color: '#ffffff'
          }}
        >
          <Tag className="w-3.5 h-3.5" />
          Attach Location Tag
        </button>
      </div>
    </div>
  );

  return (
    <div
      id="location-sanctuary-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLocating) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        id="location-sanctuary-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden my-4 flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-card-elevated)',
            borderColor: 'var(--border-color)'
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)'
              }}
            >
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Peaceful Places & Sanctuaries
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Anchor your mindfulness reflections to soothing geography
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 transition cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-secondary)'
            }}
            aria-label="Close location tagger"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {hasGoogleMaps ? (
          <APIProvider
            apiKey={apiKey}
            libraries={['places']}
            solutionChannel="GMP_devsite_samples_v3_rgmautocomplete"
          >
            {renderModalContent()}
          </APIProvider>
        ) : (
          renderModalContent()
        )}
      </motion.div>
    </div>
  );
};
