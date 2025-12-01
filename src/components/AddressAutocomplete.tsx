import { useState, useRef, useEffect, useCallback } from 'react';

interface GeocodedAddress {
  label: string;
  street: string;
  city: string;
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

const MAPY_API_KEY = 'ylj7EXFfwPaHMx459Z_IbHsNlnfHT7beiJum4KWRUiQ';

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
  const lastValidatedRef = useRef<string>(''); // Track last validated address to prevent re-validation
  const skipNextValidationRef = useRef<boolean>(false); // Skip validation after auto-fill

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

  // Parse Mapy.cz v1 geocode JSON response
  const parseGeocodeResponse = (data: any): GeocodedAddress[] => {
    const items = data.items || [];
    
    return items.map((item: any) => {
      const position = item.position || {};
      const regionalStructure = item.regionalStructure || [];
      
      // Extract address components
      let street = item.name || '';
      let city = '';
      let postalCode = item.zip || '';
      
      // Find city from regional structure
      for (const region of regionalStructure) {
        if (region.type === 'regional.municipality') {
          city = region.name || '';
          break;
        }
      }
      
      // If no municipality found, try district or region
      if (!city) {
        for (const region of regionalStructure) {
          if (region.type === 'regional.municipality_part' || region.type === 'regional.district') {
            city = region.name || '';
            break;
          }
        }
      }
      
      return {
        label: item.label || `${street}, ${city}`,
        street,
        city,
        postalCode: postalCode.replace(/\s/g, ''),
        latitude: position.lat || 0,
        longitude: position.lon || 0,
      };
    });
  };

  // Fetch and validate address using Mapy.cz v1 Geocode API
  const validateAddress = useCallback(async (query: string) => {
    // Skip if already validated this exact query
    if (query === lastValidatedRef.current) {
      return;
    }

    if (query.length < 5) {
      setSuggestions([]);
      setValidationStatus('none');
      return;
    }

    setIsLoading(true);
    try {
      // Mapy.cz v1 Geocode API with API key
      const response = await fetch(
        `https://api.mapy.cz/v1/geocode?query=${encodeURIComponent(query)}&lang=cs&limit=5&apikey=${MAPY_API_KEY}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const results = parseGeocodeResponse(data);
      
      // Remember this query was validated
      lastValidatedRef.current = query;
      
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
        
        // Mark to skip next validation (triggered by onChange)
        skipNextValidationRef.current = true;
        lastValidatedRef.current = addr.street || addr.label;
        
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
        setSuggestions(results);
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

  // Debounced validation (800ms to reduce API calls)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    // Skip validation if this change was triggered by auto-fill
    if (skipNextValidationRef.current) {
      skipNextValidationRef.current = false;
      return;
    }
    
    // Reset validation status when user types
    setValidationStatus('none');
    lastValidatedRef.current = '';

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      validateAddress(newValue);
    }, 800); // Longer debounce to reduce API calls
  };

  const handleSelect = (suggestion: GeocodedAddress) => {
    // Mark to skip next validation
    skipNextValidationRef.current = true;
    lastValidatedRef.current = suggestion.street || suggestion.label;
    
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
                {suggestion.city && <span>{suggestion.city}</span>}
                {suggestion.postalCode && <span>PSČ: {suggestion.postalCode}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
