import { SameOutfit } from "./SameOutfit";

/* What you can make, with Jose's first photograph: the four of them in the
   red wine halter gown, each under her own light, as one wide image. */
export function Lineup() {
  return (
    <SameOutfit
      photo={{
        src: "/lab/make/lineup-wine-c-1600.webp",
        srcSet: "/lab/make/lineup-wine-c-1600.webp 1600w, /lab/make/lineup-wine-c-3200.webp 3200w",
        alt: "Four women of different heights and builds, each in the same red wine satin halter gown, each under her own spotlight in a dark studio",
      }}
    />
  );
}
