import "./style.css";

import Map from "ol/Map.js";
import View from "ol/View.js";
import { Draw, Modify, Snap } from "ol/interaction.js";
import { OSM, Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import { get } from "ol/proj.js";
import GeoJSON from "ol/format/GeoJSON.js";

const raster = new TileLayer({
  source: new OSM(),
});

const source = new VectorSource();
const vector = new VectorLayer({
  source: source,
  style: {
    "fill-color": "rgba(255, 255, 255, 0.2)",
    "stroke-color": "#ffcc33",
    "stroke-width": 2,
    "circle-radius": 7,
    "circle-fill-color": "#ffcc33",
  },
});

const extent = get("EPSG:3857").getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const map = new Map({
  layers: [raster, vector],
  target: "map",
  view: new View({
    center: [-11000000, 4600000],
    zoom: 4,
    extent,
  }),
});

const modify = new Modify({ source: source });
map.addInteraction(modify);

let draw, snap;
const typeSelect = document.getElementById("type");

function addInteractions() {
  draw = new Draw({
    source: source,
    type: typeSelect.value,
  });
  map.addInteraction(draw);
  snap = new Snap({ source: source });
  map.addInteraction(snap);
}

typeSelect.onchange = function () {
  map.removeInteraction(draw);
  map.removeInteraction(snap);
  addInteractions();
};

addInteractions();

document.getElementById("export").addEventListener("click", () => {
  // create a GeoJSON object
  const json = new GeoJSON().writeFeatures(vector.getSource().getFeatures(), {
    dataProjection: "EPSG:4326",
    featureProjection: "EPSG:3857",
  });
  // pretty print the JSON
  const content = JSON.stringify(JSON.parse(json), null, 2);
  console.log(content);

  // download the data as file
  const a = document.createElement("a");
  const file = new Blob([content], { type: "application/geo+json" });
  a.href = URL.createObjectURL(file);
  a.download = "data.geojson";
  a.click();
});

const fileToRead = document.getElementById("import");
fileToRead.addEventListener(
  "change",
  function (event) {
    const files = fileToRead.files;
    if (files.length) {
      const file = files[0];

      const reader = new FileReader();
      reader.onloadend = function (evt) {
        if (evt.target.readyState === FileReader.DONE) {
          const data = JSON.parse(evt.target.result);
          const features = new GeoJSON().readFeatures(data, {
            dataProjection: "EPSG:4326",
            featureProjection: "EPSG:3857",
          });
          source.addFeatures(features);
        }
      };
      reader.readAsText(file);
    }
  },
  false
);
