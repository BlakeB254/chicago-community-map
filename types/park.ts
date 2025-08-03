// Park types for Chicago Parks data
export interface Park {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number]; // [latitude, longitude]
  communityArea: number;
  amenities: string[];
  description: string;
  size: 'small' | 'medium' | 'large';
}

// Chicago Parks API response interface
export interface ChicagoParkAPIResponse {
  park: string;
  park_no: string;
  location: string;
  zip: string;
  acres: string;
  ward: string;
  park_class: string;
  the_geom: {
    type: string;
    coordinates: number[][][];
  };
  // Amenities as boolean strings
  basketball?: string;
  playground?: string;
  tennis_cou?: string;
  baseball_f?: string;
  soccer_fie?: string;
  football_f?: string;
  swimming_p?: string;
  beach?: string;
  dog_friend?: string;
  golf_cours?: string;
  nature_bir?: string;
  wheelchr_a?: string;
}