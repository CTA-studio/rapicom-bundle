import barba from "@barba/core";
import Lenis from "lenis";

function createLenis(options = {}) {
  return new Lenis(options);
}

const RapicomBundle = {
  barba,
  createLenis,
};

if (typeof window !== "undefined") {
  window.RapicomBundle = RapicomBundle;
}

export { barba, createLenis };
export default RapicomBundle;