/* The hero's camera, for screens narrower than the video (phones, mostly):
   which part of the frame sits in the middle of the screen, 0 the left edge,
   1 the right, by master frame. Centred; a touch right while she stands; then
   it glides left so her fingers and the drop are the main point of the
   close-up, and back to centre. Wide screens see the whole frame, so the
   track does nothing there.

   The phone frames (tools/hero/encode-phone.mjs) are cut along this same
   track, so change it here and run that script again: until then the phones
   get the full frames (heroSequence.ts compares the two). */
export const CAMERA = [
  [0, 0.5],
  [175, 0.5],
  [200, 0.55], // she stands right of centre
  [228, 0.53],
  [255, 0.36], // her hand reaches out
  [300, 0.34], // the drop lands on her fingers
  [320, 0.32], // the finger close-up
  [335, 0.42],
  [355, 0.5], // back to centre
] as const;
