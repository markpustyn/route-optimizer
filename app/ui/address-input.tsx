"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  defaultLocation,
  type GooglePlacePrediction,
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
  const [focused, setFocused] = useState(false);
  const [predictions, setPredictions] = useState<GooglePlacePrediction[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [message, setMessage] = useState("");
  const session = useRef<object | null>(null);
  const version = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const open = focused && !disabled && predictions.length > 0;

  useEffect(() => {
    if (!focused || disabled || !mapLoaded || !value.trim()) return;
    let active = true;
    const requestVersion = version.current;
    const timer = setTimeout(async () => {
      try {
        const places = window.google.maps.places;
        session.current ??= new places.AutocompleteSessionToken();
        const { suggestions } =
          await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            sessionToken: session.current,
            includedRegionCodes: ["us"],
            locationBias: { center: defaultLocation, radius: 50000 },
          });
        if (!active || requestVersion !== version.current) return;
        const results = suggestions.flatMap((suggestion) =>
          suggestion.placePrediction ? [suggestion.placePrediction] : [],
        );
        setPredictions(results);
        setActiveIndex(-1);
        setMessage(
          results.length
            ? ""
            : "No suggestions found. You can enter the full address manually.",
        );
      } catch {
        if (active && requestVersion === version.current) {
          setPredictions([]);
          setMessage(
            "Autocomplete is unavailable. Enter the full address manually.",
          );
        }
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [value, focused, disabled, mapLoaded]);

  useEffect(() => {
    const container = list.current;
    const option = container?.children[activeIndex];
    if (!container || !option) return;
    // Scroll only the suggestions, not the form or page containing the input.
    const bounds = container.getBoundingClientRect();
    const optionBounds = option.getBoundingClientRect();
    if (optionBounds.top < bounds.top) {
      container.scrollTop += optionBounds.top - bounds.top;
    } else if (optionBounds.bottom > bounds.bottom) {
      container.scrollTop += optionBounds.bottom - bounds.bottom;
    }
  }, [activeIndex]);
  useEffect(
    () => () => {
      ++version.current;
    },
    [],
  );

  async function selectPrediction(prediction: GooglePlacePrediction) {
    if (disabled) return;
    setPredictions([]);
    setFocused(false);
    input.current?.blur();
    const selection = ++version.current;
    onChange(prediction.text.toString());
    const place = prediction.toPlace();
    session.current = null;
    try {
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      if (selection !== version.current) return;
      if (!place.formattedAddress || !place.location)
        throw new Error("Missing address details");
      onChange(place.formattedAddress);
      onPlaceSelect?.({
        address: place.formattedAddress,
        position: { lat: place.location.lat(), lng: place.location.lng() },
      });
      setMessage("");
    } catch {
      if (selection === version.current)
        setMessage(
          "Address details unavailable. You can enter the full address manually.",
        );
    }
  }

  return (
    <div className="relative h-12 min-w-0 flex-1">
      <Input
        ref={input}
        id={id}
        role="combobox"
        aria-label={label}
        aria-autocomplete="list"
        aria-describedby={message ? id + "-status" : undefined}
        aria-expanded={open}
        aria-controls={open ? id + "-suggestions" : undefined}
        aria-activedescendant={
          open && activeIndex >= 0 ? id + "-option-" + activeIndex : undefined
        }
        value={value}
        maxLength={300}
        disabled={disabled}
        autoComplete="off"
        onFocus={() => {
          ++version.current;
          setFocused(true);
        }}
        onBlur={() => {
          setFocused(false);
          setPredictions([]);
        }}
        onChange={(event) => {
          ++version.current;
          setPredictions([]);
          setActiveIndex(-1);
          setMessage("");
          setFocused(true);
          onChange(event.target.value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            ++version.current;
            setPredictions([]);
            setFocused(false);
          } else if (
            open &&
            (event.key === "ArrowDown" || event.key === "ArrowUp")
          ) {
            event.preventDefault();
            setActiveIndex((current) =>
              event.key === "ArrowDown"
                ? (current + 1) % predictions.length
                : current <= 0
                  ? predictions.length - 1
                  : current - 1,
            );
          } else if (open && event.key === "Enter") {
            event.preventDefault();
            if (activeIndex >= 0)
              void selectPrediction(predictions[activeIndex]);
          }
        }}
        placeholder={"Search " + label.toLowerCase()}
        className="h-12 text-base md:text-sm"
        required
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-input bg-white shadow-lg">
          <ul
            ref={list}
            id={id + "-suggestions"}
            role="listbox"
            aria-label={label + " suggestions"}
            className="max-h-44 overflow-y-auto overscroll-contain [overflow-anchor:none]"
          >
            {predictions.map((prediction, index) => (
              <li
                key={index}
                id={id + "-option-" + index}
                role="option"
                aria-selected={index === activeIndex}
                className={
                  "cursor-pointer break-words px-3 py-3 text-sm hover:bg-blue-50 " +
                  (index === activeIndex ? "bg-blue-50" : "")
                }
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectPrediction(prediction)}
              >
                {prediction.text.toString()}
              </li>
            ))}
          </ul>
          <div className="border-t px-3 py-2 text-right text-xs text-slate-600">
            Google Maps
          </div>
        </div>
      )}
      {message && (
        <p
          id={id + "-status"}
          role="status"
          className="absolute inset-x-0 top-full z-50 mt-1 rounded-lg border border-input bg-white px-3 py-2 text-xs text-muted-foreground shadow-lg"
        >
          {message}
        </p>
      )}
    </div>
  );
}
