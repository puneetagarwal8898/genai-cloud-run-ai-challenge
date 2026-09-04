import React, { useState } from 'react';
import {
  X,
  MapPin,
  Navigation,
  Globe,
  Tag,
  Check
} from 'lucide-react';
import { motion } from 'motion/react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
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

  if (!isOpen) return null;

  const apiKey =
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
              <h2 className="text-base sm:text-lg font-semibold tracking-tight font-serif">
                Peaceful Places &bull; Location Tag
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Remember the peaceful atmosphere where you found clarity
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
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar text-sm">
          {/* Map Preview */}
          <div
            className="relative rounded-2xl overflow-hidden border h-[240px] flex flex-col justify-center items-center shadow-inner"
            style={{
              backgroundColor: 'var(--bg-canvas)',
              borderColor: 'var(--border-color)'
            }}
          >
            {apiKey ? (
              <APIProvider apiKey={apiKey}>
                <Map
                  defaultCenter={currentPos}
                  center={currentPos}
                  defaultZoom={9}
                  mapId="sanctuary_map_journey"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                  gestureHandling="cooperative"
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
                </Map>
              </APIProvider>
            ) : (
              <div className="p-6 text-center space-y-2">
                <Globe className="w-8 h-8 mx-auto" style={{ color: 'var(--accent)' }} />
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Coordinates Saved
                  </h4>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--accent)' }}>
                    {currentPos.lat.toFixed(4)}° N, {currentPos.lng.toFixed(4)}° E
                  </p>
                </div>
                <p className="text-[11px] max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>
                  Your spot is tagged and saved to your reflection history.
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

          {/* Location Name & Device Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                Place Name / Label
              </label>
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
      </motion.div>
    </div>
  );
};
