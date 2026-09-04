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
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  useMapsLibrary
} from '@vis.gl/react-google-maps';
import { SanctuaryLocation, JournalInteraction } from '../types';

interface LocationSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationTagged: (location: SanctuaryLocation) => void;
  existingLocation?: SanctuaryLocation;
  interactionsWithLocation?: JournalInteraction[];
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
const MapController: React.FC<{ center: { lat: number; lng: number } }> = ({ center }) => {
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

interface PlaceAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onPlaceSelected: (placeName: string, lat: number, lng: number) => void;
}

/**
 * Autocomplete input powered by Google Places service with styled suggestions
 */
const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  value,
  onChange,
  onPlaceSelected
}) => {
  const places = useMapsLibrary('places');
  const [predictions, setPredictions] = useState<Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
  }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const sessionTokenRef = useRef<any>(null);
  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!places) return;
    try {
      autocompleteServiceRef.current = new places.AutocompleteService();
      sessionTokenRef.current = new places.AutocompleteSessionToken();
      const dummyDiv = document.createElement('div');
      placesServiceRef.current = new places.PlacesService(dummyDiv);
    } catch (err) {
      console.warn('Google Places service init error:', err);
    }
  }, [places]);

  useEffect(() => {
    if (!value || value.trim().length < 2 || !autocompleteServiceRef.current) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const timer = setTimeout(() => {
      try {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: value.trim(),
            sessionToken: sessionTokenRef.current
          },
          (results: any[], status: any) => {
            if (!active) return;
            setIsLoading(false);
            if (status === 'OK' && results && results.length > 0) {
              setPredictions(
                results.slice(0, 5).map((p) => ({
                  placeId: p.place_id,
                  description: p.description,
                  mainText: p.structured_formatting?.main_text || p.description,
                  secondaryText: p.structured_formatting?.secondary_text || ''
                }))
              );
              setIsOpen(true);
            } else {
              setPredictions([]);
              setIsOpen(false);
            }
          }
        );
      } catch (err) {
        setIsLoading(false);
      }
    }, 280);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, places]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectPrediction = (item: { placeId: string; description: string; mainText: string }) => {
    onChange(item.mainText);
    setIsOpen(false);

    if (placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        {
          placeId: item.placeId,
          fields: ['geometry', 'name', 'formatted_address'],
          sessionToken: sessionTokenRef.current
        },
        (details: any, status: any) => {
          if (status === 'OK' && details?.geometry?.location) {
            const lat = details.geometry.location.lat();
            const lng = details.geometry.location.lng();
            onPlaceSelected(details.name || item.mainText, lat, lng);
            // Regenerate session token after query completion
            if (places) {
              sessionTokenRef.current = new places.AutocompleteSessionToken();
            }
          }
        }
      );
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
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder="e.g. Garden Pavilion, Kyoto Bamboo, Morning Porch"
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

      {isOpen && predictions.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl border shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto custom-scrollbar"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)'
          }}
        >
          {predictions.map((p) => (
            <button
              key={p.placeId}
              type="button"
              onClick={() => handleSelectPrediction(p)}
              className="w-full text-left px-3.5 py-2.5 transition flex items-start gap-2.5 border-b last:border-b-0 cursor-pointer"
              style={{
                borderColor: 'var(--border-color)',
                backgroundColor: 'var(--bg-card)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card-elevated)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-card)';
              }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-500 mt-0.5" />
              <div className="min-w-0 flex-1 truncate">
                <p className="font-semibold text-xs leading-snug truncate" style={{ color: 'var(--text-primary)' }}>
                  {p.mainText}
                </p>
                {p.secondaryText && (
                  <p className="text-[11px] truncate leading-tight mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {p.secondaryText}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  const hasInteractiveMap = Boolean(apiKey && !authError);

  const renderModalContent = () => (
    <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
      {/* Map or Peaceful Coordinates View */}
      <div
        className="relative rounded-2xl overflow-hidden border h-[250px] sm:h-[270px] w-full flex flex-col justify-center items-center shadow-inner"
        style={{
          backgroundColor: 'var(--bg-canvas)',
          borderColor: 'var(--border-color)'
        }}
      >
        {hasInteractiveMap ? (
          <Map
            style={{ width: '100%', height: '100%' }}
            defaultCenter={currentPos}
            center={currentPos}
            defaultZoom={10}
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
            <MapController center={currentPos} />
          </Map>
        ) : (
          <div className="p-6 text-center space-y-2">
            <Globe className="w-8 h-8 mx-auto" style={{ color: 'var(--accent)' }} />
            <div>
              <h4 className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Peaceful Sanctuary Coordinates
              </h4>
              <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--accent)' }}>
                {currentPos.lat.toFixed(4)}° N, {currentPos.lng.toFixed(4)}° E
              </p>
            </div>
            <p className="text-[11px] max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
              Select a tranquil preset below or use your device location to anchor your reflection in place.
            </p>
          </div>
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
              {new Date(selectedPin.timestamp).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Location Name with Autocomplete & Device Position */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
            Place Name / Sanctuary
          </label>
          {hasInteractiveMap ? (
            <PlaceAutocompleteInput
              value={placeName}
              onChange={(val) => setPlaceName(val)}
              onPlaceSelected={(name, lat, lng) => {
                setPlaceName(name);
                setCurrentPos({ lat, lng });
              }}
            />
          ) : (
            <input
              id="location-name-input"
              type="text"
              value={placeName}
              onChange={(e) => setPlaceName(e.target.value)}
              placeholder="e.g. Garden Pavilion, Morning Porch"
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border focus:outline-none transition"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)'
              }}
            />
          )}
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
          Or Choose a Peaceful Destination
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
        {hasInteractiveMap ? (
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
