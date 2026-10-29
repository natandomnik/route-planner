'use strict';
// Static truck-parking reference coordinates. No occupancy or live availability data.
// Retrieved from the EU SSTPA directory; see CONTEXT-DATA.md for exclusions.
const MAP_TRUCK_PARKINGS = [
  {
    "name": "Ādaži",
    "fullName": "A1 Ādaži",
    "point": [
      57.09814706015123,
      24.312634170933805
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3718/"
  },
  {
    "name": "Aerino → Thessaloniki",
    "fullName": "Aerino Safe and Secure Truck Parking Area (SSTPA) NB (direction to Thessaloniki)",
    "point": [
      39.32855,
      22.77522
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1230/"
  },
  {
    "name": "Aerino → Athens",
    "fullName": "Aerino Safe and Secure Truck Parking Area (SSTPA) SB (direction to Athens)",
    "point": [
      39.329528,
      22.774254
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1231/"
  },
  {
    "name": "San Román",
    "fullName": "Andamur San Román",
    "point": [
      42.86379012163205,
      -2.322242708729305
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3046/"
  },
  {
    "name": "Autohof Family",
    "fullName": "AUTOHOF FAMILY",
    "point": [
      46.40656,
      19.97746
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/703/"
  },
  {
    "name": "BIVAK Truck Park",
    "fullName": "BIVAK Truck Park",
    "point": [
      46.40486,
      19.4932
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/589/"
  },
  {
    "name": "Calsina Carré",
    "fullName": "CALSINA CARRÉ SERVICES",
    "point": [
      42.31721,
      2.936413
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/39/"
  },
  {
    "name": "Caspy Europarking",
    "fullName": "Caspy Europarking",
    "point": [
      44.92697,
      25.97549
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/545/"
  },
  {
    "name": "Toulouse · Fondeyre",
    "fullName": "Centre Routier de Fondeyre - Toulouse",
    "point": [
      43.6447,
      1.4262
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/627/"
  },
  {
    "name": "CPL Truck Park",
    "fullName": "CPL TRUCK PARK",
    "point": [
      45.416534,
      10.925348
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/543/"
  },
  {
    "name": "Dourges · Delta Park",
    "fullName": "DELTA PARK Truck Secure Parking",
    "point": [
      50.442253,
      2.995988
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/639/"
  },
  {
    "name": "Arasur",
    "fullName": "Dyneff Arasur",
    "point": [
      42.70085,
      -2.919275
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/15/"
  },
  {
    "name": "La Jonquera · Dyneff",
    "fullName": "Dyneff La Jonquera",
    "point": [
      42.3996958,
      2.8855038888888886
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/20/"
  },
  {
    "name": "Ježevo Jug",
    "fullName": "JEŽEVO-JUG-TRUCK STOP",
    "point": [
      45.750025,
      16.301488
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1226/"
  },
  {
    "name": "Düren · tankpool24",
    "fullName": "LKW-Sicherheitsparkplatz Düren (tankpool24)",
    "point": [
      50.834052,
      6.462289
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/16/"
  },
  {
    "name": "Malpensa Cargo City",
    "fullName": "Malpensa Cargo City – Parcheggio Sicuro",
    "point": [
      45.61512376941619,
      8.711970531656844
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/2931/"
  },
  {
    "name": "Astigarraga",
    "fullName": "mowiz TRUCK Astigarraga",
    "point": [
      43.2837994737749,
      -1.92602021746883
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/35/"
  },
  {
    "name": "Huelva",
    "fullName": "Mowiz TRUCK Huelva",
    "point": [
      37.23828359354308,
      -6.94481243751729
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3824/"
  },
  {
    "name": "Oiartzun",
    "fullName": "mowiz TRUCK Oiartzun",
    "point": [
      43.320091,
      -1.849924
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/41/"
  },
  {
    "name": "Montseny",
    "fullName": "mowiz Truck Park Montseny",
    "point": [
      41.6487508843118,
      2.42683729990117
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/25/"
  },
  {
    "name": "Latisana",
    "fullName": "Nection Latisana",
    "point": [
      45.80804,
      13.01611
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3705/"
  },
  {
    "name": "La Jonquera · OnTurtle",
    "fullName": "On Turtle La Jonquera",
    "point": [
      42.407003,
      2.879506
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/23/"
  },
  {
    "name": "Parkamion",
    "fullName": "PARKAMION",
    "point": [
      45.15355,
      7.75417
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/741/"
  },
  {
    "name": "Prato · P1",
    "fullName": "Parking P1",
    "point": [
      43.8539,
      11.13437
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3789/"
  },
  {
    "name": "Prato · P10",
    "fullName": "Parking P10",
    "point": [
      43.858876,
      11.130512
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3793/"
  },
  {
    "name": "Prato · P7",
    "fullName": "Parking P7",
    "point": [
      43.857404,
      11.135947
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3790/"
  },
  {
    "name": "Prato · P8",
    "fullName": "Parking P8",
    "point": [
      43.85685,
      11.13744
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3791/"
  },
  {
    "name": "Prato · P9",
    "fullName": "Parking P9",
    "point": [
      43.86571,
      11.121807
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3792/"
  },
  {
    "name": "Calais · La Londonienne",
    "fullName": "RDV TRANSPORTS / LA LONDONIENNE",
    "point": [
      50.94377291862703,
      1.93806429787609
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/21/"
  },
  {
    "name": "Horsens · Recharge City",
    "fullName": "Recharge City",
    "point": [
      55.84619,
      9.73306
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1057/"
  },
  {
    "name": "Preganziol",
    "fullName": "SECURE PARK PREGANZIOL",
    "point": [
      45.59228615623279,
      12.267592706036568
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3605/"
  },
  {
    "name": "Spinea",
    "fullName": "SECURE PARK SPINEA",
    "point": [
      45.48085474890304,
      12.130957297909534
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3607/"
  },
  {
    "name": "Parma",
    "fullName": "Secure Track Parking Parma",
    "point": [
      44.845583,
      10.230178
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3779/"
  },
  {
    "name": "Bologna · Interporto",
    "fullName": "Smart Park Interporto Bologna",
    "point": [
      44.62801,
      11.38021
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3724/"
  },
  {
    "name": "Kalken → Gent",
    "fullName": "TOTAL KALKEN – DIRECTION GENT",
    "point": [
      51.06996693141469,
      3.9206854896408725
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/22/"
  },
  {
    "name": "Curtici · Trade Trans",
    "fullName": "Trade Trans Parking",
    "point": [
      46.34283320028472,
      21.291625297489247
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/553/"
  },
  {
    "name": "Travel Centers of Europe",
    "fullName": "Travel Centers of Europe",
    "point": [
      45.96821,
      21.29721
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/617/"
  },
  {
    "name": "Trento Nord",
    "fullName": "Trento Nord",
    "point": [
      46.111369346382915,
      11.093677901747796
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3774/"
  },
  {
    "name": "Toulouse · Truck Arena",
    "fullName": "TRUCK ARENA TOULOUSE",
    "point": [
      43.764758,
      1.36733
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/40/"
  },
  {
    "name": "Valenciennes",
    "fullName": "Truck Etape Valenciennes",
    "point": [
      50.343397,
      3.468227
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/38/"
  },
  {
    "name": "Brescia Est",
    "fullName": "Truck Park Brescia EST",
    "point": [
      45.48622655648243,
      10.32146827120787
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/37/"
  },
  {
    "name": "Rovereto Sud",
    "fullName": "Truck Park Rovereto Sud",
    "point": [
      45.84692,
      11.00158
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1940/"
  },
  {
    "name": "Truck Parking Lithuania",
    "fullName": "Truck Parking Lithuania",
    "point": [
      55.370356,
      23.120601
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/14/"
  },
  {
    "name": "Colleferro",
    "fullName": "TRUCK VILLAGE COLLEFERRO",
    "point": [
      41.75287,
      12.98819
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/3799/"
  },
  {
    "name": "Venlo · Truckstop",
    "fullName": "Truckstop Venlo",
    "point": [
      51.3909724,
      6.1014592
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/1312/"
  },
  {
    "name": "Labourse · TWV",
    "fullName": "TWV Park",
    "point": [
      50.47984,
      2.704011
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/472/"
  },
  {
    "name": "Zagreb · Jankomir",
    "fullName": "VANJSKO TERETNO PARKIRALIŠTE – ROBNI TERMINALI ZAGREB",
    "point": [
      45.798909,
      15.8757876875675
    ],
    "minZoom": 10,
    "parking": true,
    "population": 0,
    "source": "https://eu-parkings.eu/sstpas/sstpas-map/entry/34/"
  }
];
