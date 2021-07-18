import {
  Torrent,
  TorrentClientConfig,
  TorrentFilterRules,
} from "@/interfaces/BtClient/AbstractClient";

export interface FloodPingResponse {
  isConnected: boolean;
}

export interface FloodTorrent extends Torrent {
  id: string;
}

export interface FloodTorrentFilterRules extends TorrentFilterRules {}

export interface FloodArguments {}

export interface FloodTorrentClientConfig extends TorrentClientConfig {}

////////
// From Flood
//////
export interface TorrentProperties {
  bytesDone: number;
  dateAdded: number;
  dateCreated: number;
  directory: string;
  downRate: number;
  downTotal: number;
  // Torrent ETA (seconds), -1 means infinity
  eta: number;
  // Upper-case hash of info section of the torrent
  hash: string;
  isPrivate: boolean;
  // If initial seeding mode (aka super seeding) is enabled
  isInitialSeeding: boolean;
  // If sequential download is enabled
  isSequential: boolean;
  message: string;
  name: string;
  peersConnected: number;
  peersTotal: number;
  percentComplete: number;
  priority: TorrentPriority;
  ratio: number;
  seedsConnected: number;
  seedsTotal: number;
  sizeBytes: number;
  status: Array<TorrentStatus>;
  tags: Array<string>;
  trackerURIs: Array<string>;
  upRate: number;
  upTotal: number;
}

export enum TorrentPriority {
  DO_NOT_DOWNLOAD = 0,
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
}

const torrentStatusMap = [
  "checking",
  "seeding",
  "complete",
  "downloading",
  "stopped",
  "error",
  "inactive",
  "active",
] as const;

export type TorrentStatus = typeof torrentStatusMap[number];

export interface TorrentListSummary {
  id: number;
  torrents: TorrentList;
}

export interface TorrentList {
  [hash: string]: TorrentProperties;
}

export interface AddTorrentByURLOptions {
  urls: Array<string>;
  cookies?: string;
  destination?: string;
  tags?: Array<string>;
  isBasePath?: boolean;
  isCompleted?: boolean;
  isSequential?: boolean;
  isInitialSeeding?: boolean;
  start?: boolean;
}

export interface AddTorrentByFileOptions {
  files: Array<string>;
  destination?: string;
  tags?: Array<string>;
  isBasePath?: boolean;
  isCompleted?: boolean;
  isSequential?: boolean;
  isInitialSeeding?: boolean;
  start?: boolean;
}
