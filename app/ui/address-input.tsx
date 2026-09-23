"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  defaultLocation,
  type GooglePlaceAutocompleteElement,
  type GooglePlaceSelectEvent,
  type SelectedPlace,
} from "@/app/lib/types";

type AddressInputProps = {
  id: string;
  label: string;
  value: string;
  mapLoaded: boolean;
  disabled: boolean;
  onChange: (address: string) => void;
  onPlaceSelect?: (place: SelectedPlace) => void;
};

export default function AddressInput({
  id,
  label,
  value,
  mapLoaded,
  disabled,
  onChange,
  onPlaceSelect,
}: AddressInputProps) {
  const container = useRef<HTMLDivElement>(null);
  const widget = useRef<GooglePlaceAutocompleteElement | null>(null);
  const [searchUnavailable, setSearchUnavailable] = useState(false);
  const [message, setMessage] = useState("");

  // Read current props without recreating the Google widget on every keystroke.
  const changeAddress = useEffectEvent((address: string) => {
    if (!disabled) onChange(address);
  });
  const selectPlace = useEffectEvent((place: SelectedPlace) => {
    if (disabled) return;
    onChange(place.address);
    onPlaceSelect?.(place);
  });

  useEffect(() => {
    if (
      !mapLoaded ||
      searchUnavailable ||
      !container.current ||
      !window.google?.maps.places
    )
      return;
    const host = container.current;
    const autocomplete =
      new window.google.maps.places.PlaceAutocompleteElement();
    widget.current = autocomplete;
    autocomplete.id = id;
    autocomplete.maxlength = 300;
    autocomplete.noInputIcon = true;
    autocomplete.includedRegionCodes = ["us"];
    autocomplete.locationBias = { center: defaultLocation, radius: 50000 };
    autocomplete.className =
      "w-full rounded-lg border border-input bg-white text-sm scheme-light";
    let active = true;
    let version = 0;

    const handleInput = () => {
      ++version;
      changeAddress(autocomplete.value);
    };
    const handleSelect = async (event: Event) => {
      const selection = ++version;
      const place = (event as GooglePlaceSelectEvent).placePrediction.toPlace();
      try {
        await place.fetchFields({ fields: ["formattedAddress", "location"] });
        if (!active || selection !== version) return;
        if (!place.formattedAddress || !place.location) {
          setMessage(
            "Address details unavailable. You can enter the full address manually.",
          );
          return;
        }
        autocomplete.value = place.formattedAddress;
        selectPlace({
          address: place.formattedAddress,
          position: { lat: place.location.lat(), lng: place.location.lng() },
        });
        setMessage("");
      } catch {
        if (active && selection === version)
          setMessage(
            "Address details unavailable. You can enter the full address manually.",
          );
      }
    };
    const handleError = () => {
      changeAddress(autocomplete.value);
      setSearchUnavailable(true);
      setMessage(
        "Autocomplete is unavailable. Enter the full address manually.",
      );
    };

    autocomplete.addEventListener("input", handleInput);
    autocomplete.addEventListener("change", handleInput);
    autocomplete.addEventListener("gmp-select", handleSelect);
    autocomplete.addEventListener("gmp-error", handleError);
    host.replaceChildren(autocomplete);

    return () => {
      active = false;
      autocomplete.removeEventListener("input", handleInput);
      autocomplete.removeEventListener("change", handleInput);
      autocomplete.removeEventListener("gmp-select", handleSelect);
      autocomplete.removeEventListener("gmp-error", handleError);
      host.replaceChildren();
      widget.current = null;
    };
  }, [id, mapLoaded, searchUnavailable]);

  useEffect(() => {
    if (!widget.current) return;
    if (widget.current.value !== value) widget.current.value = value;
    widget.current.disabled = disabled;
    widget.current.placeholder = `Search ${label.toLowerCase()}`;
    widget.current.setAttribute("aria-label", label);
  }, [value, disabled, label, mapLoaded, searchUnavailable]);

  return (
    <div className="min-w-0 flex-1">
      <div ref={container} />
      {(!mapLoaded || searchUnavailable) && (
        <Input
          id={id}
          aria-label={label}
          value={value}
          maxLength={300}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder={`Enter ${label.toLowerCase()}`}
          className="h-12"
          required
        />
      )}
      {message && (
        <p role="status" className="mt-1 text-xs text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  );
}
