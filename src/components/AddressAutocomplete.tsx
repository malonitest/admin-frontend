import { useState, useRef, useEffect, useCallback } from 'react';

interface AddressSuggestion {
  label: string;
  street?: string;
  city?: string;
  postalCode?: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: { street: string; city: string; postalCode: string }) => void;
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  // Fetch suggestions from Mapy.cz Suggest API
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Using Mapy.cz Suggest API (free, good coverage for Czech Republic)
      const response = await fetch(
        `https://api.mapy.cz/v1/suggest?lang=cs&limit=5&type=regional.address&apikey=&query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        // Fallback to a simpler approach if API fails
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      const formattedSuggestions: AddressSuggestion[] = (data.items || []).map((item: any) => {
        const regionalStructure = item.regionalStructure || [];
        const street = item.name || '';
        const city = regionalStructure.find((r: any) => r.type === 'regional.municipality')?.name || '';
        const postalCode = item.zip || '';
        
        return {
          label: item.label || `${street}, ${city}`,
          street: street,
          city: city,
          postalCode: postalCode,
        };
      });

      setSuggestions(formattedSuggestions);
      setIsOpen(formattedSuggestions.length > 0);
    } catch (error) {
      console.error('Address suggestion error:', error);
      // Fallback - no suggestions on error
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelect = (suggestion: AddressSuggestion) => {
    onChange(suggestion.street || suggestion.label);
    setIsOpen(false);
    setSuggestions([]);

    if (onAddressSelect && suggestion.street) {
      onAddressSelect({
        street: suggestion.street,
        city: suggestion.city || '',
        postalCode: suggestion.postalCode || '',
      });
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-red-500 focus-within:border-red-500">
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
        {isLoading && (
          <div className="px-3">
            <svg className="animate-spin h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-3 py-2 cursor-pointer hover:bg-red-50 text-sm"
              onClick={() => handleSelect(suggestion)}
            >
              <div className="font-medium">{suggestion.label}</div>
              {suggestion.postalCode && (
                <div className="text-xs text-gray-500">{suggestion.postalCode}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;
