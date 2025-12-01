import { useState, useRef, useEffect, useCallback } from 'react';

interface GeocodedAddress {
  label: string;
  street: string;
  city: string;
  cityPart: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: { 
    street: string; 
    city: string; 
    postalCode: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const AddressAutocomplete = ({
  value,
  onChange,
  onAddressSelect,
  placeholder = 'Zadejte adresu...',
  className = '',
  icon,
}: AddressAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<GeocodedAddress[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'none' | 'valid' | 'multiple' | 'invalid'>('none');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Parse Mapy.cz geocode XML response
  const parseGeocodeResponse = (xmlText: string): GeocodedAddress[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const items = xmlDoc.querySelectorAll('item');
    
    const results: GeocodedAddress[] = [];
    
    items.forEach((item) => {
      const title = item.getAttribute('title') || '';
      const x = parseFloat(item.getAttribute('x') || '0');
      const y = parseFloat(item.getAttribute('y') || '0');
      
      // Parse address parts from nested elements
      let street = '';
      let city = '';
      let cityPart = '';
      let postalCode = '';
      
      // Get street (muni + ward for address)
      const streetEl = item.querySelector('street');
      const muniEl = item.querySelector('muni');
      const wardEl = item.querySelector('ward');
      const zipEl = item.querySelector('zip');
      
      if (streetEl) {
        street = streetEl.getAttribute('title') || '';
        const houseNum = streetEl.getAttribute('num') || '';
        if (houseNum) {
          street += ' ' + houseNum;
        }
      }
      
      if (muniEl) {
        city = muniEl.getAttribute('title') || '';
      }
      
      if (wardEl) {
        cityPart = wardEl.getAttribute('title') || '';
      }
      
      if (zipEl) {
        postalCode = (zipEl.getAttribute('title') || '').replace(/\s/g, '');
      }
      
      // Fallback: try to parse from title if structured data missing
      if (!street && title) {
        const parts = title.split(',').map(p => p.trim());
        if (parts.length >= 1) street = parts[0];
        if (parts.length >= 2) city = parts[1];
      }
      
      // Build nice label
      const labelParts = [];
      if (street) labelParts.push(street);
      if (cityPart && cityPart !== city) labelParts.push(cityPart);
      if (city) labelParts.push(city);
      if (postalCode) labelParts.push(postalCode);
      
      results.push({
        label: labelParts.join(', ') || title,
        street,
        city,
        cityPart,
        postalCode,
        latitude: y,
        longitude: x,
      });
    });
    
    return results;
  };

  // Fetch and validate address using Mapy.cz Geocode API (no API key needed)
  const validateAddress = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setValidationStatus('none');
      return;
    }

    setIsLoading(true);
    try {
      // Mapy.cz Geocode API - free, no key required for basic usage
      const response = await fetch(
        `https://api.mapy.cz/geocode?query=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const xmlText = await response.text();
      const results = parseGeocodeResponse(xmlText);
      
      if (results.length === 0) {
        // No results - invalid address
        setValidationStatus('invalid');
        setSuggestions([]);
        setIsOpen(false);
      } else if (results.length === 1) {
        // Single result - auto-fill the address
        const addr = results[0];
        setValidationStatus('valid');
        setSuggestions([]);
        setIsOpen(false);
        
        // Auto-fill with normalized address
        onChange(addr.street || addr.label);
        
        if (onAddressSelect) {
          onAddressSelect({
            street: addr.street,
            city: addr.city,
            postalCode: addr.postalCode,
            latitude: addr.latitude,
            longitude: addr.longitude,
          });
        }
      } else {
        // Multiple results - show selection
        setValidationStatus('multiple');
        setSuggestions(results.slice(0, 5)); // Max 5 suggestions
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Address validation error:', error);
      setValidationStatus('invalid');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [onChange, onAddressSelect]);

  // Debounced validation (400ms)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setValidationStatus('none');

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      validateAddress(newValue);
    }, 400);
  };

  const handleSelect = (suggestion: GeocodedAddress) => {
    onChange(suggestion.street || suggestion.label);
    setIsOpen(false);
    setSuggestions([]);
    setValidationStatus('valid');

    if (onAddressSelect) {
      onAddressSelect({
        street: suggestion.street,
        city: suggestion.city,
        postalCode: suggestion.postalCode,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
    }
  };

  // Get border color based on validation status
  const getBorderClass = () => {
    switch (validationStatus) {
      case 'valid':
        return 'border-green-500 focus-within:ring-green-500';
      case 'invalid':
        return 'border-red-500 focus-within:ring-red-500';
      case 'multiple':
        return 'border-yellow-500 focus-within:ring-yellow-500';
      default:
        return 'border-gray-300 focus-within:ring-red-500';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    if (isLoading) {
      return (
        <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      );
    }
    switch (validationStatus) {
      case 'valid':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'invalid':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'multiple':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className={`flex items-center border rounded-lg overflow-hidden focus-within:ring-2 ${getBorderClass()}`}>
        {icon && (
          <div className="px-3 py-2 bg-gray-50">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 focus:outline-none"
          autoComplete="off"
        />
        <div className="px-3">
          {getStatusIcon()}
        </div>
      </div>

      {/* Validation message */}
      {validationStatus === 'multiple' && !isOpen && (
        <p className="text-xs text-yellow-600 mt-1">Vyberte správnou adresu ze seznamu</p>
      )}
      {validationStatus === 'invalid' && (
        <p className="text-xs text-red-600 mt-1">Adresa nebyla nalezena</p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="px-3 py-2 bg-yellow-50 text-xs text-yellow-700 border-b">
            Nalezeno více adres - vyberte správnou:
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-red-50 text-sm border-b last:border-b-0"
              onClick={() => handleSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.label}</div>
              <div className="text-xs text-gray-500 flex gap-2 mt-1">
                {suggestion.postalCode && <span>PSČ: {suggestion.postalCode}</span>}
                {suggestion.latitude && suggestion.longitude && (
                  <span>GPS: {suggestion.latitude.toFixed(4)}, {suggestion.longitude.toFixed(4)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
