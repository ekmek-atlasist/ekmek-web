import type { Metadata } from "next";
import { ListingDeeplink } from "./listing-deeplink";

export const metadata: Metadata = {
  title: "Ekmek — İş ilanı",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IlanDeeplinkPage() {
  return <ListingDeeplink />;
}
