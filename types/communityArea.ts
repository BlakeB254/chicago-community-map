export interface CommunityArea {
  the_geom: {
    type: 'MultiPolygon' | 'Polygon';
    coordinates: number[][][];
  };
  area_numbe: string;
  community: string;
  area_num_1: string;
  shape_area: string;
  shape_len: string;
  perimeter: string;
  area: string;
  comarea: string;
  comarea_id: string;
}