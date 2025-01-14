import {
  AssetGetRequest,
  DendronError,
  ERROR_STATUS,
  RespV2,
} from "@dendronhq/common-all";
import { WorkspaceUtils } from "@dendronhq/engine-server";
import { getWS } from "../utils";
import fs from "fs-extra";

export class AssetsController {
  static singleton?: AssetsController;

  static instance() {
    if (!AssetsController.singleton) {
      AssetsController.singleton = new AssetsController();
    }
    return AssetsController.singleton;
  }

  async get({ fpath, ws }: AssetGetRequest): Promise<RespV2<string>> {
    const engine = await getWS({ ws });
    const { wsRoot, vaults } = engine;
    if (!WorkspaceUtils.isPathInWorkspace({ wsRoot, vaults, fpath })) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `fpath ${fpath} not inside a vault. wsRoot: ${wsRoot}, vaults: ${vaults
            .map((v) => v.fsPath)
            .join(", ")}`,
        }),
      };
    }
    if (!fs.existsSync(fpath)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `fpath ${fpath} does not exist`,
        }),
      };
    }
    return {
      data: fpath,
      error: null,
    };
  }
}
