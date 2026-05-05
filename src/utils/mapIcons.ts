import { Folder, Home, Star, Heart, Bookmark, Coffee, ShoppingBag, Briefcase, Plane, Camera, Music, Book, Zap, Umbrella, Gamepad2, Gift } from 'lucide-react';
import React from 'react';

export const MAP_ICONS: Record<string, React.FC<any>> = {
  folder: Folder,
  home: Home,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  coffee: Coffee,
  shoppingBag: ShoppingBag,
  briefcase: Briefcase,
  plane: Plane,
  camera: Camera,
  music: Music,
  book: Book,
  zap: Zap,
  umbrella: Umbrella,
  gamepad: Gamepad2,
  gift: Gift
};

export const getIconComponent = (iconId: string) => {
  return MAP_ICONS[iconId] || MAP_ICONS['folder'];
};
