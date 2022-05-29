import WebMap from '@arcgis/core/WebMap'
import MapView from '@arcgis/core/views/MapView'
import RouteLayer from '@arcgis/core/layers/RouteLayer'
import Stop from '@arcgis/core/rest/support/Stop'
import PointBarrier from '@arcgis/core/rest/support/PointBarrier'
import PolygonBarrier from '@arcgis/core/rest/support/PolygonBarrier'
import PolylineBarrier from '@arcgis/core/rest/support/PolylineBarrier'

import './style.css'

const synth = window.speechSynthesis;

const element = document.createElement('div');
element.classList.add('esri-component', 'esri-widget', 'directions-display');
element.innerHTML = '<strong>Upcoming directions</strong>'

async function load() {
  // an authorization string used to access the routing service
  const apiKey = import.meta.env.VITE_API_KEY

  // create new stops for start (Ontario) and end (Esri)
  const stops = [
    new Stop({
      geometry: { x: -117.59275, y: 34.062 },
      name: 'Ontario Airport'
    }),
    new Stop({
      geometry: { x: -117.1957, y: 34.05609 },
      name: 'Esri Campus'
    })
  ];

  // create new point barriers
  const pointBarriers = [
    new PointBarrier({ geometry: { x: -117.43576, y: 34.10264 } }), // DUI checkpoint, Fontana
    new PointBarrier({ geometry: { x: -117.29412, y: 34.1053 } }), // Construction, San Bernardino
    new PointBarrier({ geometry: { x: -117.30507, y: 34.03644 } }), // Car fire, Grand Terrace
    new PointBarrier({ geometry: { x: -117.57527, y: 34.10282 } }), // REI sale, Rancho Cucamonda
    new PointBarrier({ geometry: { x: -117.48886, y: 34.09552 } }), // Protest, Kaiser
    new PointBarrier({ geometry: { x: -117.47636, y: 34.04798 } }) // Quarry incident, Declezville
  ];

  // create new polyline barrier
  const polylineBarriers = [
    new PolylineBarrier({
      geometry: {
        paths: [
          [
            [-117.30584, 34.07115],
            [-117.2671, 34.04838]
          ]
        ]
      },
      name: 'Major highway closure'
    })
  ];

  // create new polygon barrier
  const polygonBarriers = [
    new PolygonBarrier({
      geometry: {
        rings: [
          [
            [-117.49497 - 0.01, 34.13484 - 0.01],
            [-117.49497 - 0.01, 34.13484 + 0.01],
            [-117.49497 + 0.01, 34.13484 + 0.01],
            [-117.49497 + 0.01, 34.13484 - 0.01],
            [-117.49497 - 0.01, 34.13484 - 0.01]
          ]
        ]
      },
      name: 'Street festival, Etiwanda'
    })
  ];

  const routeLayer = new RouteLayer({
    stops,
    pointBarriers,
    polylineBarriers,
    polygonBarriers
  });

  const map = new WebMap({
    basemap: 'topo-vector',
    layers: [routeLayer]
  });

  const view = new MapView({
    container: 'root',
    map
  });

  view.ui.add(element, 'bottom-right');

  await Promise.all([view.when(), routeLayer.load()]);

  const results = await routeLayer.solve({ apiKey });

  routeLayer.update(results);

  await view.goTo(routeLayer.routeInfo.geometry);

  const { directionPoints } = routeLayer;

  // Do something with directions and points
  const points = directionPoints.toArray().values();

  const speakToMe = (point) => {
    view.graphics.removeAll();
    view.graphics.add({
      geometry: point.geometry,
      symbol: {
        type: 'simple-marker',
        style: 'diamond',
        outline: { width: 2, color: [255, 255, 255, 1] },
        size: 19,
        color: [232, 59, 233, 1]
      }
    });
    view.center = point.geometry;
    element.innerHTML = point.displayText;
    let utterance = new SpeechSynthesisUtterance(point.displayText);
    utterance.addEventListener('end', () => {
      const { value, done } = points.next();
      if (done) return;

      setTimeout(() => {
        speakToMe(value);
      }, 1500);
    });

    synth.speak(utterance);
  }

  const { value } = points.next();
  speakToMe(value);
}

load();