import barba from "@barba/core";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  window.barba = barba;
  window.Lenis = Lenis;
}