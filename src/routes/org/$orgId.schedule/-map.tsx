import type { MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { loadMap, MAP_STYLE, type MapLibre } from "@/lib/map";
import type { TrackLocationResponse } from "@/server/domains/tracking/schema";
import type { WorkOrderResponse } from "@/server/domains/workorders/schema";
import { type LayerKey, type SelectionType, statusMarkerColor } from "./-types";

const DEFAULT_CENTER: [number, number] = [-30, 25];
const DEFAULT_ZOOM = 1.6;

type Positioned = { latitude?: number | null; longitude?: number | null };
type Located = { latitude: number; longitude: number };

function hasCoords<T extends Positioned>(value: T): value is T & Located {
	return Number.isFinite(value.latitude) && Number.isFinite(value.longitude);
}

const lngLat = (value: Located): [number, number] => [
	value.longitude,
	value.latitude,
];

function markerEl(
	colorClass: string,
	label: string,
	icon: string,
): HTMLElement {
	const container = document.createElement("div");
	container.className = "flex flex-col items-center cursor-pointer";

	const tag = document.createElement("div");
	tag.className = `flex items-center gap-1 px-1.5 py-0.5 ${colorClass} text-white text-[10px] font-medium rounded shadow-lg mb-1 whitespace-nowrap max-w-44`;
	tag.innerHTML = `${icon}<span class="truncate">${label}</span>`;

	const dot = document.createElement("div");
	dot.className = `w-3 h-3 rounded-full ${colorClass} border-2 border-white shadow-lg`;

	container.appendChild(tag);
	container.appendChild(dot);
	return container;
}

const USER_ICON = `<svg class="size-2.5 shrink-0" viewBox="0 0 256 256" fill="#ffffff"><path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8c18.84-32.56,52.14-52,89.07-52s70.23,19.44,89.07,52a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z"></path></svg>`;
const REPEAT_ICON = `<svg class="size-2.5 shrink-0" viewBox="0 0 256 256" fill="#ffffff"><path d="M224,48V96a8,8,0,0,1-8,8H168a8,8,0,0,1,0-16h28.69L182.06,73.37a79.56,79.56,0,0,0-56.13-23.43h-.45A79.52,79.52,0,0,0,69.59,72.71,8,8,0,0,1,58.41,61.27a96,96,0,0,1,135,.79L208,76.69V48a8,8,0,0,1,16,0ZM186.41,183.29a80,80,0,0,1-112.47-.66L59.31,168H88a8,8,0,0,0,0-16H40a8,8,0,0,0-8,8v48a8,8,0,0,0,16,0V179.31l14.63,14.63A95.43,95.43,0,0,0,130,222.06h.53a95.36,95.36,0,0,0,67.07-27.33,8,8,0,0,0-11.18-11.44Z"></path></svg>`;
const CALENDAR_ICON = `<svg class="size-2.5 shrink-0" viewBox="0 0 256 256" fill="#ffffff"><path d="M208,32H184V24a8,8,0,0,0-16,0v8H88V24a8,8,0,0,0-16,0v8H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM72,48v8a8,8,0,0,0,16,0V48h80v8a8,8,0,0,0,16,0V48h24V80H48V48ZM208,208H48V96H208V208Z"></path></svg>`;

interface ScheduleMapProps {
	members: TrackLocationResponse[];
	workOrders: WorkOrderResponse[];
	layers: Record<LayerKey, boolean>;
	focusTarget: { lng: number; lat: number; key: string } | null;
	onSelect: (type: SelectionType, id: number) => void;
}

export function ScheduleMap({
	members,
	workOrders,
	layers,
	focusTarget,
	onSelect,
}: ScheduleMapProps) {
	const mapContainer = useRef<HTMLDivElement>(null);
	const map = useRef<MapLibreMap | null>(null);
	const maplibreRef = useRef<MapLibre | null>(null);
	const markersRef = useRef<Map<string, Marker>>(new Map());
	const hasFittedBounds = useRef(false);
	const [mapReady, setMapReady] = useState(false);

	const showMembers = layers.members;
	const showWorkOrders = layers.workOrders;

	useMountEffect(() => {
		if (!mapContainer.current || map.current) return;
		let cancelled = false;
		let observer: ResizeObserver | null = null;

		loadMap().then((mod) => {
			if (cancelled || !mapContainer.current) return;
			maplibreRef.current = mod;

			map.current = new mod.Map({
				container: mapContainer.current,
				style: MAP_STYLE,
				center: DEFAULT_CENTER,
				zoom: DEFAULT_ZOOM,
			});

			map.current.addControl(new mod.NavigationControl(), "bottom-right");
			map.current.once("style.load", () => setMapReady(true));

			observer = new ResizeObserver(() => map.current?.resize());
			observer.observe(mapContainer.current);
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
			map.current?.remove();
			map.current = null;
			setMapReady(false);
			hasFittedBounds.current = false;
		};
	});

	useEffect(() => {
		if (!mapReady || !map.current || hasFittedBounds.current) return;
		const mb = maplibreRef.current;
		if (!mb) return;

		const coords: [number, number][] = [];
		for (const wo of workOrders) {
			const loc = wo.location;
			if (loc && hasCoords(loc)) coords.push(lngLat(loc));
		}
		for (const member of members) {
			if (hasCoords(member)) coords.push(lngLat(member));
		}
		if (coords.length === 0) return;
		hasFittedBounds.current = true;

		if (coords.length === 1) {
			map.current.flyTo({ center: coords[0], zoom: 13, duration: 800 });
			return;
		}

		const bounds = new mb.LngLatBounds(coords[0], coords[0]);
		for (const coord of coords) bounds.extend(coord);
		map.current.fitBounds(bounds, { padding: 70, maxZoom: 14, duration: 800 });
	}, [mapReady, workOrders, members]);

	useEffect(() => {
		if (!mapReady || !map.current || !maplibreRef.current) return;
		const mb = maplibreRef.current;
		const target = map.current;

		for (const marker of markersRef.current.values()) marker.remove();
		markersRef.current.clear();

		type LocPoint = {
			id: number;
			name: string;
			lng: number;
			lat: number;
			orders: WorkOrderResponse[];
		};
		const points = new Map<number, LocPoint>();

		for (const wo of workOrders) {
			const id = wo.location_id;
			const loc = wo.location;
			if (id == null || !loc || !hasCoords(loc)) continue;
			const existing = points.get(id);
			if (existing) {
				existing.orders.push(wo);
			} else {
				points.set(id, {
					id,
					name: loc.name ?? "",
					lng: loc.longitude,
					lat: loc.latitude,
					orders: [wo],
				});
			}
		}

		if (showWorkOrders) {
			for (const point of points.values()) {
				const first = point.orders[0];
				const recurrenceIcon =
					first.recurrence_type !== "none" ? REPEAT_ICON : CALENDAR_ICON;
				const label = point.name
					? `#${first.id} · ${point.name}`
					: `#${first.id}`;
				const el = markerEl(
					statusMarkerColor(first.status),
					label,
					recurrenceIcon,
				);
				el.onclick = () => onSelect("wo", first.id);
				const marker = new mb.Marker({ element: el, anchor: "bottom" })
					.setLngLat([point.lng, point.lat])
					.addTo(target);
				markersRef.current.set(`loc-${point.id}`, marker);
			}
		}

		if (showMembers) {
			for (const member of members) {
				if (!hasCoords(member)) continue;
				const userId = member.user_id ?? 0;
				const firstName = (member.full_name ?? "").split(" ")[0];
				const el = markerEl("bg-stone-500", firstName, USER_ICON);
				el.title = member.full_name ?? "";
				el.onclick = () => onSelect("member", userId);
				const marker = new mb.Marker({ element: el, anchor: "bottom" })
					.setLngLat(lngLat(member))
					.addTo(target);
				markersRef.current.set(`member-${userId}`, marker);
			}
		}
	}, [mapReady, showWorkOrders, showMembers, workOrders, members, onSelect]);

	useEffect(() => {
		if (!mapReady || !map.current || !focusTarget) return;
		map.current.flyTo({
			center: [focusTarget.lng, focusTarget.lat],
			zoom: 15,
			duration: 900,
		});
	}, [mapReady, focusTarget]);

	return <div ref={mapContainer} className="h-full w-full" />;
}
