import { LovelaceCardConfig } from 'custom-card-helpers';
// BoM Radar Card configuration
export interface BomRadarCardConfig extends LovelaceCardConfig {
  type: 'custom:bom-radar-card';

  // General
  name?: string;
  card_title?: string;
  map_style?: 'Light' | 'Dark';
  zoom_level?: number;
  center_latitude?: number;
  center_longitude?: number;

  // Marker
  show_marker?: boolean;
  marker_latitude?: number;
  marker_longitude?: number;

  // Controls
  show_zoom?: boolean;
  show_scale?: boolean;
  show_recenter?: boolean;

  // Animation
  frame_count?: number;
  frame_delay?: number;
  restart_delay?: number;
  overlay_transparency?: number;

  // Standard Lovelace flags
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  show_header_toggle?: boolean;
}
