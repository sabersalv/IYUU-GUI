import {
  TorrentClient,
  TorrentClientConfig,
  TorrentState,
  AddTorrentOptions,
} from "@/interfaces/BtClient/AbstractClient";

import axios from "axios";
import nodeFetch from "node-fetch/lib";
import fetch from "@/utils/fetch"; 
import { omitBy, isNil } from "lodash";
import {
  TorrentProperties,
  TorrentListSummary,
  AddTorrentByURLOptions,
  AddTorrentByFileOptions,
  FloodPingResponse,
  FloodTorrent,
  FloodTorrentClientConfig,
  FloodTorrentFilterRules,
} from "@/interfaces/BtClient/flood";

export const defaultFloodConfig: FloodTorrentClientConfig = {
  type: "flood",
  name: "flood",
  uuid: "4d371c3b-6dfc-4e12-a03e-a6ce32385049",
  address: "http://localhost:3000",
  username: "",
  password: "",
  timeout: 60 * 1e3,
};

export default class Flood implements TorrentClient {
  config: TorrentClientConfig;
  private cookie: string = "";
  private address: string = "";

  constructor(options: Partial<FloodTorrentClientConfig> = {}) {
    this.config = { ...defaultFloodConfig, ...options };
  }

  async login() {
    const res = await this.rawRequest("POST", "/auth/authenticate", {
      username: this.config.username,
      password: this.config.password,
    });
    const headers = Object.fromEntries(res.headers.entries());
    this.cookie = headers["set-cookie"];
  }

  async ping(): Promise<boolean> {
    try {
      const data: FloodPingResponse = await this.request(
        "GET",
        "/client/connection-test"
      );
      return data.isConnected;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  async getAllTorrents(): Promise<FloodTorrent[]> {
    return await this.getTorrentsBy({});
  }

  async getTorrent(id: string): Promise<FloodTorrent> {
    const torrents = await this.getTorrentsBy({
      ids: [id],
    });
    return torrents[0];
  }

  async getTorrentsBy(
    filter: FloodTorrentFilterRules
  ): Promise<FloodTorrent[]> {
    const data: TorrentListSummary = await this.request("GET", "/torrents");
    let returnTorrents = Object.values(data.torrents).map((v) =>
      this._normalizeTorrent(v)
    );
    if (filter.complete) {
      returnTorrents = returnTorrents.filter((v) => v.isCompleted);
    }
    return returnTorrents;
  }

  async addTorrent(
    url: string,
    options: Partial<AddTorrentOptions> = {}
  ): Promise<boolean> {
    try {
      if (options.localDownload) {
        const req = await axios.get(url, {
          responseType: "arraybuffer",
        });
        const files = [Buffer.from(req.data, "binary").toString("base64")];
        const params: AddTorrentByFileOptions = {
          files,
          destination: options.savePath,
          tags: options.label ? [options.label] : undefined,
          start: !options.addAtPaused,
          isBasePath: true,
          isCompleted: true,
        };
        return await this.request(
          "POST",
          "/torrents/add-files",
          omitBy(params, isNil)
        );
      } else {
        const params: AddTorrentByURLOptions = {
          urls: [url],
          destination: options.savePath,
          tags: options.label ? [options.label] : undefined,
          start: !options.addAtPaused,
          isBasePath: true,
          isCompleted: true,
        };
        return await   this.request(
          "POST",
          "/torrents/add-urls",
          omitBy(params, isNil)
        );
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  async pauseTorrent(id: any): Promise<any> {
    throw new Error("Not Implemented");
  }

  async removeTorrent(
    id: number,
    removeData: boolean | undefined
  ): Promise<boolean> {
    throw new Error("Not Implemented");
  }

  async resumeTorrent(id: any): Promise<boolean> {
    throw new Error("Not Implemented");
  }

  async request(
    method: "GET" | "POST",
    path: string,
    data: any = null
  ): Promise<any> {
    let res = await this.rawRequest(method, path, data);
    // console.log(method, `${this.config.address}/api${path}`, data, res);
    if (res.status === 401) {
      await this.login();
      res = await this.rawRequest(method, path, data);
      //   console.log('after login', res)
    }
    // /torrents/add-urls returns empty string
    if (["/torrents/add-urls", "/torrents/add-files"].includes(path)) {
      if (res.status === 200) {
        return true;
      }
    }
    const body = await await res.json();
    if (res.status >= 400) {
      throw new Error(`${body.message} -- ${method} ${path} ${res.status} ${res.statusText}`);
    }
    return body;
  }

  async rawRequest(
    method: "GET" | "POST",
    path: string,
    data: any = null
  ): Promise<Response> {
    return fetch(
      `${this.config.address}/api${path}`,
      omitBy(
        {
          customFetch: nodeFetch,
          method,
          body: data ? JSON.stringify(data) : null,
          headers: {
            "Content-Type": "application/json",
            Cookie: this.cookie,
          },
          // fix hang forever
          timeout: this.config.timeout,
        },
        isNil
      )
    );
  }

  _normalizeTorrent(torrent: TorrentProperties): FloodTorrent {
    let state = TorrentState.unknown;
    if (torrent.status.includes("seeding")) {
      state = TorrentState.seeding;
    } else if (torrent.status.includes("downloading")) {
      state = TorrentState.downloading;
    } else if (torrent.status.includes("stopped")) {
      state = TorrentState.paused;
    } else if (torrent.status.includes("checking")) {
      state = TorrentState.checking;
    }

    return {
      id: torrent.hash,
      infoHash: torrent.hash.toLowerCase(),
      name: torrent.name,
      progress: torrent.percentComplete,
      isCompleted: torrent.status.includes("complete"),
      ratio: torrent.ratio,
      dateAdded: new Date(torrent.dateAdded * 1000).toISOString(),
      savePath: torrent.directory,
      label: torrent.tags.join(","),
      state: state,
      totalSize: torrent.sizeBytes,
    };
  }
}
