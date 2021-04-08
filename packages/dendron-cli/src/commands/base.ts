import { createLogger } from "@dendronhq/common-server";
import yargs from "yargs";
import _ from "lodash";
import fs from "fs-extra";
import path from "path";

type BaseCommandOpts = { log2Stdout?: boolean; quiet?: boolean };

export abstract class BaseCommand<TOpts, TOut = any> {
  public L: ReturnType<typeof createLogger>;
  protected opts: BaseCommandOpts;

  constructor(name?: string, opts?: BaseCommandOpts) {
    this.opts = _.defaults(opts, { log2Stdout: false });
    this.L = createLogger(name || "Command");
  }
  abstract execute(opts?: TOpts): Promise<TOut>;
}

export abstract class CLICommand<TOpts, TOut> extends BaseCommand<TOpts, TOut> {
  public name: string;
  public desc: string;

  constructor(opts: { name: string; desc: string } & BaseCommandOpts) {
    super(opts.name, opts);
    this.name = opts.name;
    this.desc = opts.desc;
  }

  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
    });
    args.option("vault", {
      describe: "name of vault",
    });
    args.option("quiet", {
      describe: "don't print output to stdout",
    });
  }

  buildCmd(yargs: yargs.Argv): yargs.Argv {
    return yargs.command(this.name, this.desc, this.buildArgs, this.eval);
  }

  abstract enrichArgs(args: any): Promise<TOpts>;

  eval = async (args: any) => {
    this.L.info({ args });
    // add wsRoot if not exist
    if (!args.wsRoot) {
      const cwd = process.cwd();
      if (!fs.existsSync(path.join(cwd, "dendron.yml"))) {
        console.log("no workspace deted. --wsRoot must be set");
        process.exit(1);
      } else {
        args.wsRoot = cwd;
      }
    }
    if (args.quiet) {
      this.opts.quiet = true;
    }
    const opts = await this.enrichArgs(args);
    return this.execute(opts);
  };

  print(obj: any) {
    if (!this.opts.quiet) {
      console.log(obj);
    }
  }
}
