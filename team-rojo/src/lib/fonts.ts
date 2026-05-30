import { Instrument_Serif } from "next/font/google";
import { GeistPixelSquare } from "geist/font/pixel";

export const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
});

export const pixel = GeistPixelSquare;
