/**
 * EventList Component
 *
 * Scrollable list of events with filters (host, subtype).
 * Shows count and allows selection/highlighting.
 */

"use client";

import { useState, useMemo } from "react";
import { Filter, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";
import { EventRow } from "./EventRow";
import type { Event } from "@/lib/types";

export interface EventListProps {
  events: Event[];
  selectedEventId?: string;
  highlightedEventIds?: string[];
  onEventSelect?: (eventId: string) => void;
}

export function EventList({
  events,
  selectedEventId,
  highlightedEventIds = [],
  onEventSelect,
}: EventListProps) {
  const [hostFilter, setHostFilter] = useState<string>("");
  const [subtypeFilter, setSubtypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Extract unique hosts and subtypes
  const uniqueHosts = useMemo(
    () =>
      Array.from(
        new Set(events.map((e) => e.host?.name).filter(Boolean) as string[])
      ),
    [events]
  );
  const uniqueSubtypes = useMemo(
    () => Array.from(new Set(events.map((e) => e.subtype))),
    [events]
  );

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesHost = !hostFilter || event.host?.name === hostFilter;
      const matchesSubtype = !subtypeFilter || event.subtype === subtypeFilter;
      const matchesSearch =
        !searchQuery ||
        event.raw_excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.host?.name?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesHost && matchesSubtype && matchesSearch;
    });
  }, [events, hostFilter, subtypeFilter, searchQuery]);

  const hasActiveFilters = hostFilter || subtypeFilter || searchQuery;

  const clearAllFilters = () => {
    setHostFilter("");
    setSubtypeFilter("");
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900">Events</h2>
          <span className="text-sm text-slate-500">
            {filteredEvents.length} / {events.length}
          </span>
        </div>

        {/* Search */}
        <Input
          type="text"
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Filter className="w-4 h-4" />}
          fullWidth
        />
      </div>

      {/* Filters */}
      {(uniqueHosts.length > 1 || uniqueSubtypes.length > 1) && (
        <div className="flex-shrink-0 p-3 border-b border-slate-200 bg-slate-50 space-y-2">
          {/* Host Filter */}
          {uniqueHosts.length > 1 && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Host
              </label>
              <div className="flex flex-wrap gap-1.5">
                {uniqueHosts.map((host) => (
                  <Chip
                    key={host}
                    variant="host"
                    onClick={() =>
                      setHostFilter(host === hostFilter ? "" : host)
                    }
                    className={
                      host === hostFilter ? "ring-2 ring-accent-400" : ""
                    }
                  >
                    {host}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Subtype Filter */}
          {uniqueSubtypes.length > 1 && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {uniqueSubtypes.map((subtype) => (
                  <Chip
                    key={subtype}
                    variant="default"
                    onClick={() =>
                      setSubtypeFilter(subtype === subtypeFilter ? "" : subtype)
                    }
                    className={
                      subtype === subtypeFilter ? "ring-2 ring-accent-400" : ""
                    }
                  >
                    {subtype}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Event List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p className="text-sm">No events match your filters.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <EventRow
              key={event.id}
              event={event}
              isSelected={selectedEventId === event.id}
              isHighlighted={highlightedEventIds.includes(event.id)}
              onClick={() => onEventSelect?.(event.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
