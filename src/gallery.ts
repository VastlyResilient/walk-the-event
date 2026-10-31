
import { STATIONS } from "./data-gen";
import { LINES } from "./guide";
import type { WalkCtx } from "./walk";

export function mountGallery(root: HTMLElement, ctx: WalkCtx): () => void {
  root.innerHTML = `
    <div class="gallery">
      <div class="gallery-head">
        <h1 class="map-title">The Stations</h1>
        <p class="map-sub">Six works from the night. Swipe through; open any of them in the walk.</p>
      </div>
      <div class="carousel">
        ${STATIONS.map(st => `
          <div class="gcard" data-id="${st.id}">
            <img class="hero" src="${st.hero}" alt="${st.title || st.label}" loading="lazy"/>
            <div class="gb">
              <div class="kicker">${st.label}</div>
              <h3>${st.title || st.label}</h3>
              <p>${st.oneLiner}</p>
              <div class="station-actions">
                <button class="btn primary" data-open="${st.id}">Walk there</button>
                <button class="btn" data-view="${st.id}">Quick view</button>
              </div>
            </div>
          </div>`).join("")}
      </div>
    </div>`;
  root.querySelectorAll<HTMLButtonElement>("[data-open]").forEach(b =>
    b.addEventListener("click", () => {
      history.pushState(null, "", `/#station-${b.dataset.open}`);
      dispatchEvent(new PopStateEvent("popstate"));
    }));
  root.querySelectorAll<HTMLButtonElement>("[data-view]").forEach(b =>
    b.addEventListener("click", () => {
      const st = STATIONS.find(s => s.id === b.dataset.view)!;
      ctx.openStation(st, st.timestamp);
      ctx.say(LINES.station[st.id].open[ctx.getPersonality()]);
    }));
  return () => {};
}
