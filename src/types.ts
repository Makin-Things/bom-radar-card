import { LovelaceCardConfig } from 'custom-card-helpers';

// TODO Add your configuration elements here for type-checking
export interface BomRadarCardConfig extends LovelaceCardConfig {
  type: string;
  name?: string;
  map_style?: string;
  show_warning?: boolean;
  show_error?: boolean;
  test_gui?: boolean;
  show_header_toggle?: boolean;
}
