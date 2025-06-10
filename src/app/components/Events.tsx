"use client";

import React, { useRef, useEffect, useState } from "react";
import { useEvent } from "@/app/contexts/EventContext";
import { LoggedEvent } from "@/app/types";

export interface EventsProps {
  isExpanded: boolean;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (value: boolean) => void;
  codec: string;
  onCodecChange: (value: string) => void;
}

function Events({ isExpanded, isAudioPlaybackEnabled, setIsAudioPlaybackEnabled, codec, onCodecChange }: EventsProps) {
  const [prevEventLogs, setPrevEventLogs] = useState<LoggedEvent[]>([]);
  const eventLogsContainerRef = useRef<HTMLDivElement | null>(null);

  const { loggedEvents, toggleExpand } = useEvent();

  const getDirectionArrow = (direction: string) => {
    if (direction === "client") return { symbol: "▲", color: "#7f5af0" };
    if (direction === "server") return { symbol: "▼", color: "#2cb67d" };
    return { symbol: "•", color: "#555" };
  };

  useEffect(() => {
    const hasNewEvent = loggedEvents.length > prevEventLogs.length;

    if (isExpanded && hasNewEvent && eventLogsContainerRef.current) {
      eventLogsContainerRef.current.scrollTop =
        eventLogsContainerRef.current.scrollHeight;
    }

    setPrevEventLogs(loggedEvents);
  }, [loggedEvents, isExpanded]);

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-lg p-4">
      <div className="flex flex-row items-center gap-4 mb-4">
        <div className="flex flex-row items-center gap-1">
          <input
            id="audio-playback"
            type="checkbox"
            checked={isAudioPlaybackEnabled}
            onChange={(e) => setIsAudioPlaybackEnabled(e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor="audio-playback" className="flex items-center cursor-pointer">
            Audio playback
          </label>
        </div>
        <div className="flex flex-row items-center gap-2">
          <div>Codec:</div>
          <select
            id="codec-select"
            value={codec}
            onChange={(e) => onCodecChange(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
          >
            <option value="opus">Opus (48 kHz)</option>
            <option value="pcmu">PCMU (8 kHz)</option>
            <option value="pcma">PCMA (8 kHz)</option>
          </select>
        </div>
      </div>
      <div
        className={
          (isExpanded ? "w-1/2 overflow-auto" : "w-0 overflow-hidden opacity-0") +
          " transition-all rounded-xl duration-200 ease-in-out flex-col bg-white"
        }
        ref={eventLogsContainerRef}
      >
        {isExpanded && (
          <div>
            <div className="flex items-center justify-between px-6 py-3.5 sticky top-0 z-10 text-base border-b bg-white rounded-t-xl">
              <span className="font-semibold">Logs</span>
            </div>
            <div>
              {loggedEvents.map((log) => {
                const arrowInfo = getDirectionArrow(log.direction);
                const isError =
                  log.eventName.toLowerCase().includes("error") ||
                  log.eventData?.response?.status_details?.error != null;

                return (
                  <div
                    key={log.id}
                    className="border-t border-gray-200 py-2 px-6 font-mono"
                  >
                    <div
                      onClick={() => toggleExpand(log.id)}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center flex-1">
                        <span
                          style={{ color: arrowInfo.color }}
                          className="ml-1 mr-2"
                        >
                        {arrowInfo.symbol}
                        </span>
                        <span
                          className={
                            "flex-1 text-sm " +
                            (isError ? "text-red-600" : "text-gray-800")
                          }
                        >
                          {log.eventName}
                        </span>
                      </div>
                      <div className="text-gray-500 ml-1 text-xs whitespace-nowrap">
                        {log.timestamp}
                      </div>
                    </div>

                    {log.expanded && log.eventData && (
                      <div className="text-gray-800 text-left">
                        <pre className="border-l-2 ml-1 border-gray-200 whitespace-pre-wrap break-words font-mono text-xs mb-2 mt-2 pl-2">
                          {JSON.stringify(log.eventData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Events;
