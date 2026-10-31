// GENERATED from data/stations.json + beats JSON — station body text is verbatim from the
// photographed write-up cards. Do not hand-edit facts; edit data/stations.json and regenerate.

export interface TrackKey { t: number; x: number; y: number; w: number; h: number }
export interface Station {
  id: string; label: string; title: string; artist: string; oneLiner: string;
  body: string; highlights: string[]; photos: string[]; hero: string;
  timestamp: number; visibility: [number, number]; guideLines: string[];
  track: TrackKey[];
}
export interface Chapter { id: string; title: string; desc: string; t: number; end: number; floor: Floor }
export type Floor = "down" | "up";

export const FLOORS: Record<Floor, { src: string; duration: number; name: string }> = {
  down: { src: import.meta.env.BASE_URL + "media/downstairs.mp4", duration: 119.1, name: "Downstairs" },
  up:   { src: import.meta.env.BASE_URL + "media/upstairs.mp4",   duration: 129.6, name: "Upstairs" },
};

export const STATIONS: Station[] = [
 {
  "id": "led-camera",
  "label": "led camera screens",
  "title": "Self Portrait, 2026",
  "artist": "Joshua Wolk",
  "oneLiner": "A portrait, borrowed from centuries.",
  "body": "Joshua Wolk\nSelf Portrait, 2026\n\nIn a row of digital gilded frames, a\ncamera studies the face of whoever\nstands before it. It searches centuries of\nportraiture from the Met, the Art Institute\nof Chicago and the Cleveland Museum\nof Art for a matching pose and\nexpression, then lays the painted face\nover the living one. For a moment, each\nviewer becomes the subject.",
  "highlights": [
   "A portrait, borrowed from centuries.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/led-camera-screens/IMG_3852.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/led-camera-screens/IMG_3852.webp",
  "timestamp": 16.5,
  "visibility": [
   13.5,
   19.5
  ],
  "guideLines": [
   "A portrait, borrowed from centuries.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 13.5,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 16.5,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 19.5,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 },
 {
  "id": "tvs",
  "label": "TVS",
  "title": "Mandala, 2026",
  "artist": "Kevin Esherick",
  "oneLiner": "Make art. Leave a hash. Begin again.",
  "body": "Kevin Esherick\nMandala, 2026\n\nAn agent on a sandboxed virtual\nmachine is instructed to turn the\nsandbox itself into a work of art,\ncontinually expanding and improving on\nits creation. Every 24 hours, the\nmachine is wiped. Only a hash of the\nprevious state is left behind, serving as\nthe seed for the next. Each day the\nagent begins anew.",
  "highlights": [
   "Make art. Leave a hash. Begin again.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/tvs/IMG_3855.webp",
   import.meta.env.BASE_URL + "stations/tvs/IMG_3856.webp",
   import.meta.env.BASE_URL + "stations/tvs/IMG_3857.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/tvs/IMG_3855.webp",
  "timestamp": 39.5,
  "visibility": [
   36.5,
   42.5
  ],
  "guideLines": [
   "Make art. Leave a hash. Begin again.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 36.5,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 39.5,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 42.5,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 },
 {
  "id": "projector",
  "label": "Projector Screens",
  "title": "The Shape of Everything, 2026",
  "artist": "Jteve Sobs",
  "oneLiner": "Sound and image, one whole world.",
  "body": "Jteve Sobs\nThe Shape of Everything, 2026\n\nJteve Sobs works across sound and\nmoving image, treating them as one\nmedium. Using layers of generative ai,\nthe work centers on speculative\nworldbuilding, including post-human\nfutures, machine consciousness, and\narchitectures that evoke a beatific vision\nof the near future. Each piece is\ncomposed as a complete audiovisual\nenvironment, with sound and image\nconceived together from the outset.",
  "highlights": [
   "Sound and image, one whole world.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/projector-screens/IMG_3859.webp",
   import.meta.env.BASE_URL + "stations/projector-screens/IMG_3860.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/projector-screens/IMG_3859.webp",
  "timestamp": 48,
  "visibility": [
   45,
   51
  ],
  "guideLines": [
   "Sound and image, one whole world.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 45,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 48.0,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 51,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 },
 {
  "id": "space-screen",
  "label": "SPACE SCREEN",
  "title": "Hermes Journey",
  "artist": "NOUS Research",
  "oneLiner": "Every skill leaves an orbit.",
  "body": "An interactive Hermes Journey display. Skills and memories appear in the order Hermes learned them, oldest at the center.",
  "highlights": [
   "Every skill leaves an orbit.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/space-screen/IMG_3842.webp",
   import.meta.env.BASE_URL + "stations/space-screen/IMG_3843.webp",
   import.meta.env.BASE_URL + "stations/space-screen/IMG_3844.webp",
   import.meta.env.BASE_URL + "stations/space-screen/IMG_3845.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/space-screen/IMG_3842.webp",
  "timestamp": 64.5,
  "visibility": [
   61.5,
   67.5
  ],
  "guideLines": [
   "Every skill leaves an orbit.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 61.5,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 64.5,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 67.5,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 },
 {
  "id": "merch",
  "label": "MERCH",
  "title": "NOUSCON Merch",
  "artist": "NOUS Research",
  "oneLiner": "The ideas look good on you, too.",
  "body": "NOUSCON NYC 2026 merchandise: graphic tees and printed designs from the event.",
  "highlights": [
   "The ideas look good on you, too.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/merch/IMG_3828.webp",
   import.meta.env.BASE_URL + "stations/merch/IMG_3834.webp",
   import.meta.env.BASE_URL + "stations/merch/IMG_3835.webp",
   import.meta.env.BASE_URL + "stations/merch/IMG_3836.webp",
   import.meta.env.BASE_URL + "stations/merch/IMG_3838.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/merch/IMG_3828.webp",
  "timestamp": 83,
  "visibility": [
   80,
   86
  ],
  "guideLines": [
   "The ideas look good on you, too.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 80,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 83.0,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 86,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 },
 {
  "id": "cpu-terminals",
  "label": "CPU TERMINALS",
  "title": "",
  "artist": "COMPUTER",
  "oneLiner": "Two computers. One impossible conversation.",
  "body": "COMPUTER\n\nMorry Kolman\nPersistence 2, 2026\n\nPersistence 2 is a duet performance where two\ncomputers with extremely limited networking\ncapabilities attempt to establish a means of\ncommunicating with each other. Kept separate\nby a hard firewall, banned from any wireless\nconnectivity, and without access to common\nmeans of emitting and receiving information\nsuch as microphones, cameras, speakers, and\nscreens, viewers can watch as these\ncomputers turn to the only means of outreach\nthey have left: their (quite literal) own devices.\nLeveraging agent skills loaded with data\nsmuggling and airgap jumping techniques from\nstate of the art security research, the\ncomputers attempt to turn adversarial\nexfiltration and hacking methods into a new\nmeans of connection. They must emit and they\nmust listen; they must take the arbitrary noise\naround them as potential signal, while also\nunderstanding how their own lossy\ncommunication may be interpreted by their\ncounterpart; they grow new senses so that\nthey may speak a new language.\n\n@WTTDOTM",
  "highlights": [
   "Two computers. One impossible conversation.",
   "Photographed at NOUSCON NYC 2026."
  ],
  "photos": [
   import.meta.env.BASE_URL + "stations/cpu-terminals/IMG_9270.webp"
  ],
  "hero": import.meta.env.BASE_URL + "stations/cpu-terminals/IMG_9270.webp",
  "timestamp": 91,
  "visibility": [
   88,
   94
  ],
  "guideLines": [
   "Two computers. One impossible conversation.",
   "Come take a closer look."
  ],
  "track": [
   {
    "t": 88,
    "x": 0.56,
    "y": 0.44,
    "w": 0.52,
    "h": 0.4
   },
   {
    "t": 91.0,
    "x": 0.42,
    "y": 0.42,
    "w": 0.6,
    "h": 0.46
   },
   {
    "t": 94,
    "x": 0.14,
    "y": 0.4,
    "w": 0.5,
    "h": 0.42
   }
  ]
 }
];

export const CHAPTERS: Chapter[] = [
 {
  "id": "into-the-pink",
  "title": "Into the pink",
  "desc": "A white corridor washed in magenta, gathering crowds.",
  "t": 0,
  "end": 12,
  "floor": "down"
 },
 {
  "id": "faces-in-the-frames",
  "title": "Faces in the frames",
  "desc": "Interactive portrait screens lead toward the NOUSCON crowd.",
  "t": 12,
  "end": 30,
  "floor": "down"
 },
 {
  "id": "around-the-curve",
  "title": "Around the curve",
  "desc": "An elevated walk beside a white rail, then wall-mounted displays and projection.",
  "t": 30,
  "end": 48,
  "floor": "down"
 },
 {
  "id": "worlds-within-worlds",
  "title": "Worlds within worlds",
  "desc": "Generative audiovisual art, an open gallery, and Hermes Journey.",
  "t": 48,
  "end": 72,
  "floor": "down"
 },
 {
  "id": "ideas-made-tangible",
  "title": "Ideas, made tangible",
  "desc": "Merchandise and isolated computer terminals.",
  "t": 72,
  "end": 100,
  "floor": "down"
 },
 {
  "id": "afterglow",
  "title": "Afterglow",
  "desc": "A dark red-lit passage opens into the final gallery.",
  "t": 100,
  "end": 119.1,
  "floor": "down"
 },
 {
  "id": "the-ascent",
  "title": "The ascent",
  "desc": "A grand staircase washed in violet.",
  "t": 0,
  "end": 11,
  "floor": "up"
 },
 {
  "id": "light-columns",
  "title": "Light columns",
  "desc": "A long upper gallery, windows and luminous floor fixtures.",
  "t": 11,
  "end": 44,
  "floor": "up"
 },
 {
  "id": "the-quiet-passage",
  "title": "The quiet passage",
  "desc": "A rhythmic corridor leads into moving colored light.",
  "t": 44,
  "end": 68,
  "floor": "up"
 },
 {
  "id": "electric-company",
  "title": "Electric company",
  "desc": "Crowds gather under violet light and colored projections.",
  "t": 68,
  "end": 100,
  "floor": "up"
 },
 {
  "id": "above-it-all",
  "title": "Above it all",
  "desc": "Planters, open rooms and a final view across the floor below.",
  "t": 100,
  "end": 129.6,
  "floor": "up"
 }
];
