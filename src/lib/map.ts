import type { MapOptions } from "maplibre-gl";

export type MapLibre = typeof import("maplibre-gl");

export const MAP_STYLE: NonNullable<MapOptions["style"]> = {
	version: 8,
	sources: {
		osm: {
			type: "raster",
			tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
			tileSize: 256,
			maxzoom: 19,
			attribution:
				'<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
		},
	},
	layers: [{ id: "osm", type: "raster", source: "osm" }],
};

let cached: Promise<MapLibre> | null = null;

export function loadMap() {
	if (!cached) {
		cached = Promise.all([
			import("maplibre-gl"),
			import("maplibre-gl/dist/maplibre-gl.css"),
		]).then(([mod]) => mod);
	}
	return cached;
}
