import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin
} from '@vis.gl/react-google-maps';
import {
  X,
  MapPin,
  Compass,
  Navigation,
  Check,
  Sparkles,
  Search,
  Globe,
  Tag
} from 'lucide-react';
import { JournalInteraction, SanctuaryLocation } from '../types';

interface LocationSanctuaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeInteraction: JournalInteraction | null;
  interactionsWithLocation: JournalInteraction[];
  onLocationTagged: (location: SanctuaryLocation) => void;
}

const SANCTUARY_PRESETS = [
  {
    name: 'Arashiyama Bamboo Grove, Kyoto',
    latitude: 35.0165,
    longitude: 135.6713,
    description: 'A tranquil canopy of swaying green bamboo'
  },
  {
    name: 'Big Sur Coastal Sanctuary, California',
    latitude: 36.2704,
    longitude: -121.8081,
    description: 'Pacific mist and timeless ocean horizons'
  },
  {
    name: 'Lake Louise Alpine Reflection, Banff',
    latitude: 51.4254,
    longitude: -116.1773,
    description: 'Glacial turquoise waters embraced by towering peaks'
  },
  {
    name: 'High Line Solitude Garden, New York',
    latitude: 40.748,
    longitude: -74.0048,
    description: 'Elevated urban sanctuary among native prairie grasses'
  }
];

export const LocationSanctuaryModal: React.FC<LocationSanctuaryModalProps> = ({
  isOpen,
  onClose,
  activeInteraction,
  interactionsWithLocation,
  onLocationTagged
}) => {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';

  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number }>(
    activeInteraction?.location
      ? { lat: activeInteraction.location.latitude, lng: activeInteraction.location.longitude }
      : { lat: 35.0165, lng: 135.6713 }
  );
  const [placeName, setPlaceName] = useState(
    activeInteraction?.location?.placeName || 'My Quiet Sanctuary'
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [selectedPin, setSelectedPin] = useState<JournalInteraction | null>(null);

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        setPlaceName(`Sanctuary (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation lookup notice:', err.message);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleApplyLocation = () => {
    const loc: SanctuaryLocation = {
      latitude: currentPos.lat,
      longitude: currentPos.lng,
      placeName: placeName.trim() || 'Mindful Sanctuary'
    };
    onLocationTagged(loc);
    setLocationSuccess(true);
    setTimeout(() => {
      setLocationSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div id="location-sanctuary-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        id="location-sanctuary-content"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 font-serif">
                Location-Aware Sanctuary Journey
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Ground your reflections in physical space and map your sacred mental geographies
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Map Section */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 h-[280px] bg-stone-100 dark:bg-stone-950 flex flex-col justify-center items-center shadow-inner">
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
                  {/* Current Active Marker */}
                  <AdvancedMarker position={currentPos}>
                    <Pin background="#d97706" glyphColor="#ffffff" borderColor="#b45309" />
                  </AdvancedMarker>

                  {/* Past tagged reflections */}
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
                        <Pin background="#4f46e5" glyphColor="#ffffff" borderColor="#3730a3" />
                      </AdvancedMarker>
                    );
                  })}
                </Map>
              </APIProvider>
            ) : (
              <div className="p-6 text-center space-y-3">
                <Globe className="w-10 h-10 mx-auto text-amber-600 dark:text-amber-400 opacity-80" />
                <div>
                  <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    Sanctuary Geolocation Engine Active
                  </h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto mt-1">
                    Latitude: <span className="font-mono text-amber-600">{currentPos.lat.toFixed(4)}° N</span>,{' '}
                    Longitude: <span className="font-mono text-amber-600">{currentPos.lng.toFixed(4)}° E</span>
                  </p>
                </div>
                <div className="text-[11px] text-stone-400 max-w-sm mx-auto">
                  To view live interactive Google Maps satellite tiles, configure <code className="bg-stone-200 dark:bg-stone-800 px-1 py-0.5 rounded font-mono text-[10px]">VITE_GOOGLE_MAPS_API_KEY</code>. Coordinates and sanctuary markers function seamlessly.
                </div>
              </div>
            )}

            {/* Selected Pin Overlay */}
            {selectedPin && (
              <div className="absolute top-3 left-3 right-3 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-lg text-xs space-y-1 z-20">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {selectedPin.location?.placeName || 'Past Reflection Marker'}
                  </span>
                  <button
                    onClick={() => setSelectedPin(null)}
                    className="text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-stone-700 dark:text-stone-300 italic line-clamp-2">
                  "{selectedPin.prompt}"
                </p>
                <p className="text-[10px] text-stone-400 font-mono">
                  {new Date(selectedPin.timestamp).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Location Details & Name Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Sanctuary Name / Landmark
              </label>
              <input
                id="location-name-input"
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="e.g. Garden Pavilion, Mountain Porch"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
                className="w-full py-2.5 px-4 rounded-xl border border-amber-600/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-4 h-4" />
                {isLocating ? 'Acquiring GPS Signal...' : 'Tag My Current Device Location'}
              </button>
            </div>
          </div>

          {/* Sanctuary Geographies Presets */}
          <div>
            <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-2">
              Or Choose a World Sanctuary Preset
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SANCTUARY_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    setCurrentPos({ lat: preset.latitude, lng: preset.longitude });
                    setPlaceName(preset.name);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    placeName === preset.name
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/30'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300'
                  }`}
                >
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {preset.name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-stone-400 line-clamp-1">{preset.description}</p>
                </button>
              ))}
            </div>
          </div>

          {locationSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <Check className="w-4 h-4 text-emerald-600" />
              Location "{placeName}" attached to reflection!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300"
            >
              Cancel
            </button>
            <button
              id="confirm-tag-location-button"
              type="button"
              onClick={handleApplyLocation}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
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
